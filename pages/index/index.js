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
    showSearch: false,
    showUpdateModal: false,
    updateInfo: { version: '', updateContent: '', updateImage: '' },
    isLoggedIn: false,
    filterDate: 'all',
    filterStartDate: '',
    filterEndDate: ''
  },

  onLoad() {
    this.setCurrentDate();
    if (wx.getStorageSync('token')) {
      this.loadTaskCount();
      this.loadTasks().finally(() => {
        this.setData({ initialLoading: false });
      });
    } else {
      this.setData({ initialLoading: false });
    }
  },

  onShow() {
    const token = wx.getStorageSync('token');
    this.setData({ isLoggedIn: !!token });
    if (token) {
      this.loadTasks();
      this.loadTaskCount();
    } else {
      this.setData({ taskList: [], totalTasks: 0, totalRows: 0 });
    }
  },

  onReachBottom() {
    if (!this.data.isLoggedIn) return;
    if (!this.data.noMore && !this.data.loading && !this.data.searchLoading) {
      this.loadTasks(true);
    }
  },

  onPullDownRefresh() {
    if (!this.data.isLoggedIn) {
      wx.stopPullDownRefresh();
      return;
    }
    this.setData({ page: 1, noMore: false });
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

  checkUpdate() {
    // 版本检查已移除
  },

  closeUpdateModal() {
    wx.setStorageSync('app_version', this.data.updateInfo.version);
    this.setData({ showUpdateModal: false });
  },

  loadTaskCount() {
    if (!wx.getStorageSync('token')) return;
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
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      wx.setStorageSync('loginRedirect', '/' + currentPage.route);
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
    if (!this.data.isLoggedIn || this.data.loading) return Promise.resolve();
    
    this.setData({ loading: true });
    
    const page = loadMore ? this.data.page + 1 : 1;
    const keyword = this.data.searchKeyword;
    const startDate = this.data.filterStartDate;
    const endDate = this.data.filterEndDate;
    
    return api.task.list(page, this.data.size, keyword, startDate, endDate).then((data) => {
      const list = (data.records || []).map(item => ({
        ...item,
        statusText: this.getStatusText(item.status),
        createTime: item.createdAt ? util.formatTime(new Date(item.createdAt)) : '-',
        typeLabel: this.getTypeLabel(item.type),
        typeIcon: this.getTypeIcon(item.type),
        isFileTask: !!item.type && item.type !== 'parse_text' && item.type !== 'parse_excel'
      }));
      
      this.setData({
        page: page,
        taskList: loadMore ? [...this.data.taskList, ...list] : list,
        noMore: list.length < this.data.size
      });
    }).catch(() => {
      if (this.data.isLoggedIn) {
        util.showToast('加载失败');
      }
    }).finally(() => {
      this.setData({ loading: false, searchLoading: false });
    });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    if (!this.data.isLoggedIn) return;
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

  onFilterDate(e) {
    if (!this.data.isLoggedIn) return;
    const value = e.currentTarget.dataset.value;
    const now = new Date();
    let startDate = '';
    let endDate = '';
    
    if (value === 'today') {
      startDate = endDate = this.formatDate(now);
    } else if (value === 'week') {
      const dayOfWeek = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      startDate = this.formatDate(monday);
      endDate = this.formatDate(now);
    } else if (value === 'month') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = this.formatDate(now);
    } else if (value === 'custom') {
      this.setData({ filterDate: 'custom', filterStartDate: '', filterEndDate: '' });
      return;
    } else {
      this.setData({ filterDate: 'all', filterStartDate: '', filterEndDate: '', page: 1, noMore: false });
      this.loadTasks();
      return;
    }
    
    this.setData({ filterDate: value, filterStartDate: startDate, filterEndDate: endDate, page: 1, noMore: false });
    this.loadTasks();
  },

  onFilterReset() {
    this.setData({ filterDate: 'all', filterStartDate: '', filterEndDate: '', page: 1, noMore: false });
    this.loadTasks();
  },

  onStartDateChange(e) {
    this.setData({ filterStartDate: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ filterEndDate: e.detail.value });
  },

  onCustomDateConfirm() {
    if (this.data.filterStartDate && this.data.filterEndDate) {
      this.setData({ page: 1, noMore: false });
      this.loadTasks();
    }
  },

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  getStatusText(status) {
    const map = { completed: '已完成', processing: '处理中', draft: '草稿' };
    return map[status] || '未知';
  },

  getTypeLabel(type) {
    const map = {
      pdf_split: 'PDF拆分', pdf_rotate: 'PDF旋转', pdf_merge: 'PDF合并',
      pdf_encrypt: 'PDF加密', pdf_watermark: 'PDF水印',
      doc_convert: '文档转换', office_to_pdf: 'Office转PDF',
      web_to_pdf: '网页转PDF', web_screenshot: '网页截图',
      parse_text: '文本解析', parse_excel: 'Excel解析'
    };
    return map[type] || '数据处理';
  },

  getTypeIcon(type) {
    const map = {
      pdf_split: '📄', pdf_rotate: '🔄', pdf_merge: '📑',
      pdf_encrypt: '🔒', pdf_watermark: '💧',
      doc_convert: '📝', office_to_pdf: '📋',
      web_to_pdf: '🌐', web_screenshot: '📷'
    };
    return map[type] || '📊';
  },

  goToParse() {
    wx.switchTab({ url: '/pages/parse/text/text' });
  },

  goToCreate() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/task/create/create' });
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/task/detail/detail?id=${id}` });
  },

  goToStats(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/stats/stats?id=${id}` });
  }
});