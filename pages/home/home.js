const util = require('../../utils/util.js');

Page({
  data: {
    currentDate: ''
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

  goToService(e) {
    const type = e.currentTarget.dataset.type;
    const routes = {
      text: '/pages/parse/text/text',
      pdf: '/pages/docling/pdf-parse/pdf-parse',
      batch: '/pages/docling/batch-convert/batch-convert'
    };
    if (routes[type]) {
      wx.navigateTo({ url: routes[type] });
    }
  }
});