const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    currentDate: '',
    userAvatar: 'U',
    totalTasks: 0,
    totalRows: 0,
    taskList: [],
    page: 1,
    size: 10,
    loading: false,
    noMore: false,
    initialLoading: true,
    searchKeyword: '',
    searchLoading: false,
    showSearch: false
  },

  onLoad() {
    this.setCurrentDate();
    this.loadTaskCount();
    if (wx.getStorageSync('token')) {
      this.loadTasks().finally(() => {
        this.setData({ initialLoading: false });
      });
    } else {
      this.setData({ initialLoading: false });
    }
  },

  onShow() {
    if (wx.getStorageSync('token')) {
      this.loadTasks();
      this.loadTaskCount();
    } else {
      this.setData({ taskList: [], totalTasks: 0, totalRows: 0 });
    }
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading && !this.data.searchLoading) {
      this.loadTasks(true);
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, noMore: false, searchKeyword: '' });
    this.loadTasks().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  setCurrentDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[now.getDay()];
    this.setData({ currentDate: `${month}月${day}日 ${weekday}` });
  },

  loadTaskCount() {
    Promise.all([
      api.task.count(),
      api.task.countRows()
    ]).then(([taskCount, rowCount]) => {
      this.setData({ 
        totalTasks: taskCount || 0,
        totalRows: rowCount || 0
      });
    }).catch(() => {});
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) {
      util.showToast('请先登录');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 500);
      return false;
    }
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.nickname) {
      this.setData({ userAvatar: userInfo.nickname.charAt(0) });
    }
    return true;
  },

  loadTasks(loadMore = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    const page = loadMore ? this.data.page + 1 : 1;
    const keyword = this.data.searchKeyword;
    
    return api.task.list(page, this.data.size, keyword).then((data) => {
      const list = (data.records || []).map(item => ({
        ...item,
        statusText: this.getStatusText(item.status),
        createTime: item.createdAt ? util.formatTime(new Date(item.createdAt)) : '-'
      }));
      
      this.setData({
        page: page,
        taskList: loadMore ? [...this.data.taskList, ...list] : list,
        noMore: list.length < this.data.size
      });
    }).catch(() => {
      util.showToast('加载失败');
    }).finally(() => {
      this.setData({ loading: false, searchLoading: false });
    });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    this.setData({ page: 1, noMore: false, searchLoading: true });
    this.loadTasks();
  },

  onSearchClear() {
    this.setData({ searchKeyword: '', page: 1, noMore: false });
    this.loadTasks();
  },

  onSearchTap() {
    this.setData({ showSearch: true });
  },

  onSearchClose() {
    const hadKeyword = !!this.data.searchKeyword;
    this.setData({ showSearch: false, searchKeyword: '' });
    if (hadKeyword) {
      this.setData({ page: 1, noMore: false });
      this.loadTasks();
    }
  },

  onSearchBlur() {
    setTimeout(() => {
      if (!this.data.searchKeyword) {
        this.setData({ showSearch: false });
      }
    }, 150);
  },

  getStatusText(status) {
    const map = { completed: '已完成', processing: '处理中', draft: '草稿' };
    return map[status] || '未知';
  },

  goToCreate() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/task/create/create' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/task/detail/detail?id=${id}` });
  },

  goToStats(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/stats/stats?id=${id}` });
  },

  handleExport(e) {
    const id = e.currentTarget.dataset.id;
    const now = new Date();
    const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    
    util.showLoading('导出中...');
    const url = api.task.export(id, fileName);
    util.downloadFile(url, fileName).then((filePath) => {
      util.hideLoading();
      util.openFile(filePath, 'xlsx');
    }).catch(() => {
      util.hideLoading();
      util.showToast('导出失败');
    });
  },

  handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    util.showModal('确认删除', '删除后数据无法恢复').then((confirm) => {
      if (confirm) {
        util.showLoading('删除中...');
        api.task.delete(id).then(() => {
          util.showToast('删除成功');
          this.loadTasks();
        }).catch(() => {
          util.hideLoading();
        });
      }
    });
  }
});