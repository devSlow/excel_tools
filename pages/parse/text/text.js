const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    inputText: '',
    delimiter: 'auto',
    loading: false,
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

    this.setData({ loading: true, result: { columns: [], data: [], rowCount: 0, columnCount: 0 } });

    const delimiter = this.data.delimiter === 'auto' ? '' : this.data.delimiter;
    
    api.parse.text(this.data.inputText, delimiter).then((data) => {
      this.setData({
        loading: false,
        result: {
          columns: data.columns || [],
          data: data.rows || [],
          rowCount: data.rows ? data.rows.length : 0,
          columnCount: data.columns ? data.columns.length : 0
        }
      });
    }).catch(() => {
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