const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    userPassword: '',
    ownerPassword: '',
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
      selectedFilePath: '',
      userPassword: '',
      ownerPassword: ''
    });
  },

  onUserPasswordInput(e) {
    this.setData({ userPassword: e.detail.value });
  },

  onOwnerPasswordInput(e) {
    this.setData({ ownerPassword: e.detail.value });
  },

  handleEncrypt() {
    if (!this.data.selectedFilePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    if (!this.data.userPassword) {
      wx.showToast({ title: '请输入用户密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('加密中，请稍候...');

    wx.uploadFile({
      url: api.baseUrl + '/gotenberg/pdf/encrypt/url',
      filePath: this.data.selectedFilePath,
      name: 'file',
      header: {
        'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
      },
      formData: {
        userPassword: this.data.userPassword,
        ownerPassword: this.data.ownerPassword
      },
      success: (res) => {
        util.hideLoading();
        if (res.statusCode === 200 && res.data) {
          try {
            const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (result.code === 200 && result.data) {
              const downloadUrl = result.data.startsWith('http') ? result.data : (api.baseUrl.replace('/api', '') + result.data);
              
              wx.downloadFile({
                url: downloadUrl,
                header: {
                  'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
                },
                success: (downloadRes) => {
                  if (downloadRes.statusCode === 200) {
                    const fs = wx.getFileSystemManager();
                    const fileName = this.data.selectedFile.replace(/\.[^.]+$/, '') + '_encrypted.pdf';
                    const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
                    
                    fs.saveFile({
                      tempFilePath: downloadRes.tempFilePath,
                      filePath: tempFilePath,
                      success: (saveRes) => {
                        wx.showToast({ title: '加密成功', icon: 'success' });
                        setTimeout(() => {
                          wx.openDocument({
                            filePath: saveRes.savedFilePath,
                            fileType: 'pdf',
                            success: () => {},
                            fail: () => {
                              wx.showToast({ title: '打开失败', icon: 'none' });
                            }
                          });
                        }, 1500);
                      },
                      fail: () => {
                        wx.showToast({ title: '保存失败', icon: 'none' });
                      }
                    });
                  }
                },
                fail: () => {
                  wx.showToast({ title: '下载失败', icon: 'none' });
                }
              });
            } else {
              wx.showToast({ title: result.msg || '加密失败', icon: 'none' });
            }
          } catch (e) {
            wx.showToast({ title: '加密失败', icon: 'none' });
          }
        } else {
          try {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '加密失败', icon: 'none' });
          } catch (e) {
            wx.showToast({ title: '加密失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        util.hideLoading();
        console.error('Encrypt error:', err);
        wx.showToast({ title: '加密失败，请重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});
