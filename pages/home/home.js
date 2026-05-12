const util = require('../../utils/util.js');

Page({
  data: {
    currentTab: 'doc'
  },

  onLoad() {
    this.setCurrentDate();
  },

  setCurrentDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    this.setData({ currentDate: `${month}月${day}日 ${weekday}` });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  goToService(e) {
    const type = e.currentTarget.dataset.type;
    const routes = {
      text: '/pages/parse/text/text',
      'doc-convert': '/pages/gotenberg/doc-convert/doc-convert',
      'pdf-merge': '/pages/gotenberg/pdf-merge/pdf-merge',
      'pdf-split': '/pages/gotenberg/pdf-split/pdf-split',
      'pdf-rotate': '/pages/gotenberg/pdf-rotate/pdf-rotate',
      'pdf-encrypt': '/pages/gotenberg/pdf-encrypt/pdf-encrypt',
      'pdf-watermark': '/pages/gotenberg/pdf-watermark/pdf-watermark',
      'web-pdf': '/pages/gotenberg/web-to-pdf/web-to-pdf',
      'web-screenshot': '/pages/gotenberg/web-screenshot/web-screenshot'
    };
    if (routes[type]) {
      wx.navigateTo({ url: routes[type] });
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  }
});