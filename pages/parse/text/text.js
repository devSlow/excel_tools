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

  onLoad(options) {
    this.loadBanner();
    // 扫码进入会带 scene 参数
    const scene = (options && options.query && options.query.scene) || '';
    if (scene) {
      wx.redirectTo({
        url: '/pages/verify/verify?scene=' + scene
      });
    }
  },

  onPullDownRefresh() {
    this.loadBanner();
  },

  onShow(options) {
    if (!wx.getStorageSync('token')) {
      this.setData({ result: { columns: [], data: [], rowCount: 0, columnCount: 0 }, inputText: '' });
    }
    // 扫码进入会带 scene 参数，跳转到 verify 页
    const scene = (options && options.query && options.query.scene) || '';
    if (scene) {
      wx.redirectTo({
        url: '/pages/verify/verify?scene=' + scene
      });
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
      util.showToast('请输入要转换为Excel的文本');
      return;
    }

    this.setData({ loading: true });
    const delimiter = this.data.delimiter === 'auto' ? '' : this.data.delimiter;
    const isLoggedIn = !!wx.getStorageSync('token');
    
    api.parse.text(this.data.inputText, delimiter).then((data) => {
      if (isLoggedIn) {
        let prefix = '数据任务';
        if (data.data && data.data.length > 0 && data.columns && data.columns.length > 0) {
          const colName = data.columns[0].name;
          const val = (data.data[0][colName] || '').toString().trim();
          if (val) prefix = val.length > 10 ? val.substring(0, 10) : val;
        }
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const taskData = {
          title: `${prefix} ${timeStr}`,
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
    }).catch(() => {}).finally(() => {
      wx.stopPullDownRefresh();
    });
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