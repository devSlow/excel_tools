const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    url: '',
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

  handleConvert() {
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
    util.showLoading('转换中，请稍候...');

    const token = wx.getStorageSync('token');
    const header = {};
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: api.baseUrl + '/gotenberg/convert/to-pdf',
      method: 'POST',
      header: header,
      data: {
        sourceType: 'url',
        url: this.data.url
      },
      responseType: 'arraybuffer',
      success: (res) => {
        util.hideLoading();
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager();
          const tempFilePath = `${wx.env.USER_DATA_PATH}/${Date.now()}.pdf`;

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
        } else {
          wx.showToast({ title: '转换失败', icon: 'none' });
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