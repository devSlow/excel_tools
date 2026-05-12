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
      url: api.baseUrl + '/gotenberg/pdf/rotate',
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
        if (res.statusCode === 200) {
          wx.showToast({ title: '旋转成功', icon: 'success' });
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
  }
});