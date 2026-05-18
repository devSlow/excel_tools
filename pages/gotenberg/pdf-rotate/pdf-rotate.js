const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    angle: 90,
    pages: '',
    loading: false,
    noticeVisible: false
  },

  onLoad() {
    this.checkServiceHealth();
  },

  checkServiceHealth() {
    api.gotenberg.health().catch(() => {
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
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          selectedFile: file.name,
          selectedFilePath: file.path
        });
      },
      fail: () => {
        wx.showToast({ title: '请选择PDF文件', icon: 'none' });
      }
    });
  },

  clearFile() {
    this.setData({
      selectedFile: '',
      selectedFilePath: ''
    });
  },

  selectAngle(e) {
    this.setData({ angle: parseInt(e.currentTarget.dataset.angle) });
  },

  onPagesInput(e) {
    this.setData({ pages: e.detail.value });
  },

  handleRotate() {
    if (!this.data.selectedFilePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('旋转中，请稍候...');

    wx.uploadFile({
      url: api.baseUrl + '/gotenberg/pdf/rotate/url',
      filePath: this.data.selectedFilePath,
      name: 'file',
      header: {
        'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
      },
      formData: {
        angle: String(this.data.angle),
        pages: this.data.pages
      },
      success: (res) => {
        util.hideLoading();
        if (res.statusCode === 200 && res.data) {
          try {
            const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (result.code === 200 && result.data) {
              const downloadUrl = result.data.startsWith('http') ? result.data : (api.baseUrl.replace('/api', '') + result.data);
              const token = wx.getStorageSync('token');
              if (token) {
                api.task.create({
                  title: `PDF旋转 - ${this.data.selectedFile}`,
                  type: 'pdf_rotate',
                  fileUrl: JSON.stringify([downloadUrl]),
                  sourceFile: this.data.selectedFile,
                  params: JSON.stringify({ angle: this.data.angle, pages: this.data.pages })
                }).catch(() => {});
              }
              this.downloadAndOpenFile(downloadUrl);
            } else {
              wx.showToast({ title: result.msg || '旋转失败', icon: 'none' });
            }
          } catch (e) {
            console.error('解析响应失败:', e);
            wx.showToast({ title: '旋转失败', icon: 'none' });
          }
        } else {
          try {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '旋转失败', icon: 'none' });
          } catch (e) {
            wx.showToast({ title: '旋转失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        util.hideLoading();
        console.error('Rotate error:', err);
        wx.showToast({ title: '旋转失败，请重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  downloadAndOpenFile(url) {
    util.showLoading('下载中...');
    
    wx.request({
      url: url,
      responseType: 'arraybuffer',
      timeout: 180000,
      success: (res) => {
        console.log('下载成功:', res);
        util.hideLoading();
        
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager();
          const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.pdf`;
          fs.writeFile({
            filePath: filePath,
            data: res.data,
            success: () => {
              wx.openDocument({
                filePath: filePath,
                fileType: 'pdf',
                showMenu: true,
                success: () => {
                  console.log('文档打开成功');
                  wx.showToast({ title: '旋转成功', icon: 'success' });
                },
                fail: (err) => {
                  console.error('文档打开失败:', err);
                  wx.showToast({ title: '打开失败', icon: 'none' });
                }
              });
            },
            fail: (err) => {
              console.error('文件写入失败:', err);
              wx.showToast({ title: '打开失败', icon: 'none' });
            }
          });
        }
      },
      fail: (err) => {
        console.error('下载失败:', err);
        util.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  }
});