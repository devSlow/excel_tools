const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    currentDate: '',
    isLoggedIn: false,
    totalTasks: 0,
    recentTasks: []
  },

  onLoad() {
    this.setCurrentDate();
  },

  onShow() {
    const token = wx.getStorageSync('token');
    this.setData({ isLoggedIn: !!token });
    if (token) {
      this.loadData();
    } else {
      this.setData({ totalTasks: 0, recentTasks: [] });
    }
  },

  setCurrentDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    this.setData({ currentDate: `${month}月${day}日 ${weekday}` });
  },

  loadData() {
    Promise.all([
      api.task.count(),
      api.task.list(1, 5)
    ]).then(([taskCount, taskData]) => {
      const recentTasks = (taskData.records || []).map(item => ({
        ...item,
        statusText: this.getStatusText(item.status),
        createTime: item.createdAt ? util.formatTime(new Date(item.createdAt)) : '-'
      }));
      this.setData({
        totalTasks: taskCount || 0,
        recentTasks
      });
    }).catch(() => {});
  },

  getStatusText(status) {
    const map = { completed: '已完成', processing: '处理中', draft: '草稿' };
    return map[status] || '未知';
  },

  goToService(e) {
    const type = e.currentTarget.dataset.type;
    const routes = {
      'text': '/pages/parse/text/text',
      'doc-convert': '/pages/gotenberg/doc-convert/doc-convert',
      'pdf-parse': '/pages/docling/pdf-parse/pdf-parse',
      'pdf-merge': '/pages/gotenberg/pdf-merge/pdf-merge',
      'pdf-split': '/pages/gotenberg/pdf-split/pdf-split',
      'pdf-rotate': '/pages/gotenberg/pdf-rotate/pdf-rotate',
      'pdf-encrypt': '/pages/gotenberg/pdf-encrypt/pdf-encrypt',
      'pdf-watermark': '/pages/gotenberg/pdf-watermark/pdf-watermark'
    };
    if (routes[type]) {
      wx.navigateTo({ url: routes[type] });
    }
  },

  goToTaskList() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/task/detail/detail?id=${id}` });
  }
});
