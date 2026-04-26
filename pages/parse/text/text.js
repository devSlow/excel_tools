const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    bannerList: [],
    inputText: '',
    delimiter: 'auto',
    loading: false,
    showResult: false,
    noticeExpanded: false,
    noticeVisible: false,
    result: {
      columns: [],
      data: [],
      rowCount: 0,
      columnCount: 0
    }
  },

  onLoad() {
    this.loadBanner();
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      this.setData({ result: { columns: [], data: [], rowCount: 0, columnCount: 0 }, inputText: '' });
    }
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  toggleNotice() {
    if (this.data.noticeExpanded) return;
    this.setData({ noticeExpanded: true }, () => {
      setTimeout(() => {
        this.setData({ noticeVisible: true });
      }, 50);
    });
  },

  closeNotice() {
    this.setData({ noticeVisible: false });
    setTimeout(() => {
      this.setData({ noticeExpanded: false });
    }, 300);
  },

  selectDelimiter(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ delimiter: value === '\\t' ? '\t' : value });
  },

  handleParse() {
    if (!this.data.inputText) {
      util.showToast('请输入要解析的文本');
      return;
    }

    this.setData({ loading: true });
    const delimiter = this.data.delimiter === 'auto' ? '' : this.data.delimiter;
    const isLoggedIn = !!wx.getStorageSync('token');
    
    api.parse.text(this.data.inputText, delimiter).then((data) => {
      if (isLoggedIn) {
        const taskData = {
          title: '文本解析任务',
          columns: data.columns || [],
          rows: data.data || []
        };
        api.task.create(taskData);
      }
      return data;
    }).then((data) => {
      util.hideLoading();
      this.setData({ loading: false, showResult: false });
      
      util.showLoading('导出中...');
      const now = new Date();
      const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      
      const url = api.parse.textExport(this.data.inputText, delimiter);
      util.downloadFile(url, fileName).then((filePath) => {
        util.hideLoading();
        util.openFile(filePath, 'xlsx');
      }).catch(() => {
        util.hideLoading();
        util.showToast('导出失败');
      });
    }).catch(() => {
      util.hideLoading();
      this.setData({ loading: false });
    });
  },

  saveAsTask() {
    if (!this.data.result.columns || this.data.result.columns.length === 0) {
      util.showToast('没有可保存的数据');
      return;
    }

    wx.navigateTo({
      url: '/pages/task/create/create?source=text&data=' + encodeURIComponent(JSON.stringify(this.data.result))
    });
  },

  loadBanner() {
    api.banner.list().then((list) => {
      this.setData({ bannerList: list || [] });
    }).catch(() => {});
  },

  goToBanner(e) {
    const dataset = e.currentTarget.dataset;
    if (dataset.noticeId) {
      wx.navigateTo({ url: `/pages/notice/notice?id=${dataset.noticeId}` });
    } else if (dataset.link) {
      wx.navigateTo({ url: dataset.link });
    }
  },

  goToNotice(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/notice/detail/detail?id=${id}` });
  }
});