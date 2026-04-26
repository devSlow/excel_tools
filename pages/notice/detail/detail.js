const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    notice: null
  },

  onLoad(options) {
    if (options.id) {
      this.loadNotice(options.id);
    }
  },

  loadNotice(id) {
    wx.showLoading({ title: '加载中' });
    api.notice.get(id).then((notice) => {
      if (notice) {
        if (notice.createdAt) {
          notice.createdAt = util.formatTime(new Date(notice.createdAt));
        }
        wx.setNavigationBarTitle({ title: notice.title || '公告详情' });
        this.setData({ notice });
      } else {
        wx.showToast({ title: '公告不存在', icon: 'none' });
      }
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  }
});
