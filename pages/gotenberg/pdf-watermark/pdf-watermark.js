const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    watermarkType: 'text',
    watermarkText: '',
    watermarkImage: '',
    watermarkImagePath: '',
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

  selectType(e) {
    this.setData({ watermarkType: e.currentTarget.dataset.type });
  },

  onTextInput(e) {
    this.setData({ watermarkText: e.detail.value });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const imagePath = res.tempFilePaths[0];
        this.setData({
          watermarkImage: imagePath,
          watermarkImagePath: imagePath
        });
      }
    });
  },

  clearImage() {
    this.setData({
      watermarkImage: '',
      watermarkImagePath: ''
    });
  },

  onPagesInput(e) {
    this.setData({ pages: e.detail.value });
  },

  handleWatermark() {
    if (!this.data.selectedFilePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    if (this.data.watermarkType === 'text' && !this.data.watermarkText) {
      wx.showToast({ title: '请输入水印文字', icon: 'none' });
      return;
    }

    if (this.data.watermarkType === 'image' && !this.data.watermarkImagePath) {
      wx.showToast({ title: '请上传水印图片', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('处理中，请稍候...');

    if (this.data.watermarkType === 'text') {
      wx.uploadFile({
        url: api.baseUrl + '/gotenberg/pdf/watermark/url',
        filePath: this.data.selectedFilePath,
        name: 'file',
        header: {
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
        },
        formData: {
          source: 'text',
          expression: this.data.watermarkText,
          pages: this.data.pages
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
                      const fileName = this.data.selectedFile.replace(/\.[^.]+$/, '') + '_watermarked.pdf';
                      const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
                      
                      fs.saveFile({
                        tempFilePath: downloadRes.tempFilePath,
                        filePath: tempFilePath,
                        success: (saveRes) => {
                          wx.showToast({ title: '水印添加成功', icon: 'success' });
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
                wx.showToast({ title: result.msg || '添加失败', icon: 'none' });
              }
            } catch (e) {
              wx.showToast({ title: '添加失败', icon: 'none' });
            }
          } else {
            try {
              const data = JSON.parse(res.data);
              wx.showToast({ title: data.msg || '添加失败', icon: 'none' });
            } catch (e) {
              wx.showToast({ title: '添加失败', icon: 'none' });
            }
          }
        },
        fail: (err) => {
          util.hideLoading();
          console.error('Watermark error:', err);
          wx.showToast({ title: '添加失败，请重试', icon: 'none' });
        },
        complete: () => {
          this.setData({ loading: false });
        }
      });
    } else {
      // 图片水印：上传PDF文件，图片路径作为表达式
      wx.uploadFile({
        url: api.baseUrl + '/gotenberg/pdf/watermark/url',
        filePath: this.data.selectedFilePath,
        name: 'file',
        header: {
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
        },
        formData: {
          source: 'image',
          expression: this.data.watermarkImagePath,
          pages: this.data.pages
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
                      const fileName = this.data.selectedFile.replace(/\.[^.]+$/, '') + '_watermarked.pdf';
                      const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
                      
                      fs.saveFile({
                        tempFilePath: downloadRes.tempFilePath,
                        filePath: tempFilePath,
                        success: (saveRes) => {
                          wx.showToast({ title: '水印添加成功', icon: 'success' });
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
                wx.showToast({ title: result.msg || '添加失败', icon: 'none' });
              }
            } catch (e) {
              wx.showToast({ title: '添加失败', icon: 'none' });
            }
          } else {
            try {
              const data = JSON.parse(res.data);
              wx.showToast({ title: data.msg || '添加失败', icon: 'none' });
            } catch (e) {
              wx.showToast({ title: '添加失败', icon: 'none' });
            }
          }
        },
        fail: (err) => {
          util.hideLoading();
          console.error('Watermark error:', err);
          wx.showToast({ title: '添加失败，请重试', icon: 'none' });
        },
        complete: () => {
          this.setData({ loading: false });
        }
      });
    }
  }
});
