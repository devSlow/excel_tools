const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    loading: false
  },

  handleLogin() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    wx.login({
      success: (res) => {
        if (res.code) {
          api.auth.login(res.code).then((data) => {
            wx.setStorageSync('token', data.token);
            wx.setStorageSync('userInfo', data.userInfo);
            util.showToast('登录成功');
            setTimeout(() => {
              wx.switchTab({ url: '/pages/index/index' });
            }, 500);
          }).catch(() => {
            this.setData({ loading: false });
          });
        } else {
          util.showToast('登录失败');
          this.setData({ loading: false });
        }
      },
      fail: () => {
        util.showToast('登录失败');
        this.setData({ loading: false });
      }
    });
  }
});