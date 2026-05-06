const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    loading: false,
    loginStep: 'authorizing',
    appVersion: '',
    tapCount: 0,
    lastTapTime: 0
  },

  handleSecretTap() {
    const now = Date.now();
    const lastTapTime = this.data.lastTapTime;
    let tapCount = this.data.tapCount;
    
    if (now - lastTapTime > 3000) {
      tapCount = 0;
    }
    
    tapCount++;
    this.setData({ tapCount, lastTapTime: now });
    
    console.log('[SecretTap] count:', tapCount, 'time diff:', now - lastTapTime);
    
    if (tapCount >= 5) {
      this.setData({ tapCount: 0, lastTapTime: 0 });
      console.log('[SecretTap] 触发成功，跳转 verify 页面');
      wx.navigateTo({ url: '/pages/verify/verify' });
    }
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      isLoggedIn: !!token,
      userInfo: userInfo
    });
  },

  loadVersion() {
    // 版本检查已移除
  },

  handleLogin() {
    if (this.data.loading) return;
    if (this.data.isLoggedIn) return;
    
    this.setData({ loading: true, loginStep: 'authorizing' });
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (userRes) => {
        const nickname = userRes.userInfo.nickName;
        const avatarUrl = userRes.userInfo.avatarUrl;
        this.setData({ loginStep: 'verifying' });
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              api.auth.login(loginRes.code, nickname, avatarUrl).then((data) => {
                this.setData({ loginStep: 'success' });
                const userInfo = { nickname: nickname, avatarUrl: avatarUrl };
                wx.setStorageSync('token', data.token);
                wx.setStorageSync('userInfo', userInfo);
                util.showToast('登录成功');
                this.setData({ isLoggedIn: true, userInfo: userInfo, loading: false });
                const redirect = wx.getStorageSync('loginRedirect');
                wx.removeStorageSync('loginRedirect');
                setTimeout(() => {
                  if (redirect) {
                    if (redirect.startsWith('/pages/index/index') || redirect.startsWith('/pages/parse/')) {
                      wx.switchTab({ url: redirect });
                    } else {
                      wx.redirectTo({ url: redirect });
                    }
                  }
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
      },
      fail: () => {
        util.showToast('授权失败');
        this.setData({ loading: false });
      }
    });
  },

  handleLogout() {
    util.showModal('退出登录', '确定要退出当前账号吗？').then((confirm) => {
      if (confirm) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        this.setData({ isLoggedIn: false, userInfo: null });
        util.showToast('已退出登录');
      }
    });
  }
});