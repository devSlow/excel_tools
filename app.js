App({
  globalData: {
    userInfo: null,
    token: null
  },
  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
  },
  onShareAppMessage() {
    return {
      title: 'Excel数据处理与PDF工具',
      path: '/pages/home/home',
      imageUrl: ''
    };
  }
});