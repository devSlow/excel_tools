const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    url: '',
    format: 'png',
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

  onUrlInput(e) {
    this.setData({ url: e.detail.value });
  },

  selectFormat(e) {
    this.setData({ format: e.currentTarget.dataset.format });
  },

  handleScreenshot() {
    if (!this.data.url) {
      wx.showToast({ title: '请输入网址', icon: 'none' });
      return;
    }

    const url = this.data.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      wx.showToast({ title: '请输入完整的URL地址', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('截图中，请稍候...');

    const token = wx.getStorageSync('token');
    const header = {};
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: api.baseUrl + '/gotenberg/screenshot',
      method: 'POST',
      header: header,
      data: {
        sourceType: 'url',
        url: this.data.url,
        format: this.data.format
      },
      responseType: 'arraybuffer',
      success: (res) => {
        util.hideLoading();
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager();
          const tempFilePath = `${wx.env.USER_DATA_PATH}/screenshot_${Date.now()}.${this.data.format}`;

          fs.writeFile({
            filePath: tempFilePath,
            data: res.data,
            encoding: 'binary',
            success: () => {
              const token = wx.getStorageSync('token');
              if (token) {
                api.task.create({
                  title: `网页截图 - ${this.data.url}`,
                  type: 'web_screenshot',
                  params: JSON.stringify({ url: this.data.url, format: this.data.format })
                }).catch(() => {});
              }
              wx.saveImageToPhotosAlbum({
                filePath: tempFilePath,
                success: () => {
                  wx.showToast({ title: '截图已保存到相册', icon: 'success' });
                },
                fail: (err) => {
                  console.error('Save to album error:', err);
                  if (err.errMsg.includes('auth deny')) {
                    wx.showModal({
                      title: '提示',
                      content: '需要授权保存图片到相册',
                      success: (res) => {
                        if (res.confirm) {
                          wx.openSetting();
                        }
                      }
                    });
                  } else {
                    wx.showToast({ title: '保存失败', icon: 'none' });
                  }
                }
              });
            },
            fail: (err) => {
              console.error('Save file error:', err);
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '截图失败', icon: 'none' });
        }
      },
      fail: (err) => {
        util.hideLoading();
        console.error('Screenshot error:', err);
        wx.showToast({ title: '截图失败，请重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});