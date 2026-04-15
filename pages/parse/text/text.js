const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    inputText: '',
    delimiter: 'auto',
    loading: false,
    showResult: false,
    result: {
      columns: [],
      data: [],
      rowCount: 0,
      columnCount: 0
    }
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      this.setData({ result: { columns: [], data: [], rowCount: 0, columnCount: 0 }, inputText: '' });
    }
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
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
    // 只设置 loading 标志，不更新按钮文字

    const delimiter = this.data.delimiter === 'auto' ? '' : this.data.delimiter;
    
    api.parse.text(this.data.inputText, delimiter).then((data) => {
      util.showLoading('创建任务中...');
      const taskData = {
        title: '文本解析任务',
        columns: data.columns || [],
        rows: data.data || []
      };
      return api.task.create(taskData);
    }).then(() => {
      util.hideLoading();
      util.showToast('任务已创建');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 500);
    }).catch((err) => {
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
  }
});