const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    password: '',
    loading: false,
    noticeVisible: false
  },

  onLoad() {
    this.checkServiceHealth();
  },

  checkServiceHealth() {
    api.gotenberg.health().then(() => {
      console.log('Gotenberg service is healthy');
    }).catch((err) => {
      wx.showToast({ title: '服务暂不可用', icon: 'none' });
    });
  },

  toggleNotice() {
    this.setData({ noticeVisible: true });
  },

  closeNotice() {
    this.setData({ noticeVisible: false });
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          selectedFile: file.name,
          selectedFilePath: file.path
        });
      },
      fail: () => {
        wx.showToast({ title: '请选择Office文件', icon: 'none' });
      }
    });
  },

  clearFile() {
    this.setData({
      selectedFile: '',
      selectedFilePath: '',
      password: ''
    });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  handleConvert() {
    if (!this.data.selectedFilePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('转换中，请稍候...');

    const token = wx.getStorageSync('token');
    const header = {
      'Authorization': token ? `Bearer ${token}` : ''
    };
    const formData = {};
    if (this.data.password) {
      formData.password = this.data.password;
    }

    wx.uploadFile({
      url: api.baseUrl + '/gotenberg/convert/office-to-pdf',
      filePath: this.data.selectedFilePath,
      name: 'file',
      header: header,
      formData: formData,
      responseType: 'arraybuffer',
      success: (res) => {
        util.hideLoading();
        if (res.statusCode === 200) {
          try {
            const fs = wx.getFileSystemManager();
            const fileName = this.data.selectedFile.replace(/\.[^.]+$/, '') + '.pdf';
            const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

            fs.writeFile({
              filePath: tempFilePath,
              data: res.data,
              encoding: 'binary',
              success: () => {
                wx.showToast({ title: '转换成功', icon: 'success' });
                setTimeout(() => {
                  wx.openDocument({
                    filePath: tempFilePath,
                    fileType: 'pdf',
                    success: () => {},
                    fail: () => {
                      wx.showToast({ title: '打开失败', icon: 'none' });
                    }
                  });
                }, 1500);
              },
              fail: (err) => {
                console.error('Save file error:', err);
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            });
          } catch (e) {
            console.error('Process error:', e);
            wx.showToast({ title: '处理失败', icon: 'none' });
          }
        } else {
          try {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '转换失败', icon: 'none' });
          } catch (e) {
            wx.showToast({ title: '转换失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        util.hideLoading();
        console.error('Convert error:', err);
        wx.showToast({ title: '转换失败，请重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});