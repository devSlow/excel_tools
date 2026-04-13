const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    taskName: '',
    taskDesc: '',
    source: 'text',
    parseData: null,
    loading: false
  },

  onLoad(options) {
    if (options.source) {
      this.setData({ source: options.source });
    }
    if (options.data) {
      try {
        const parseData = JSON.parse(decodeURIComponent(options.data));
        this.setData({ parseData: parseData });
        // 自动填充任务名
        if (parseData.columns && parseData.columns.length > 0) {
          this.setData({ taskName: '任务-' + new Date().toLocaleString() });
        }
      } catch (e) {
        console.error('解析数据失败', e);
      }
    }
  },

  onTaskNameInput(e) {
    this.setData({ taskName: e.detail.value });
  },

  onTaskDescInput(e) {
    this.setData({ taskDesc: e.detail.value });
  },

  selectSource(e) {
    const source = e.currentTarget.dataset.source;
    this.setData({ source });
  },

  handleSubmit() {
    if (!this.data.taskName) {
      util.showToast('请输入任务名称');
      return;
    }

    this.setData({ loading: true });
    
    const data = {
      title: this.data.taskName,
      description: this.data.taskDesc,
      source: this.data.source
    };

    // 如果有解析数据，添加列定义和行数据
    if (this.data.parseData) {
      data.columns = this.data.parseData.columns || [];
      data.rows = this.data.parseData.rows || this.data.parseData.data || [];
    }

    api.task.create(data).then(() => {
      util.showToast('创建成功');
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  handleCancel() {
    wx.navigateBack();
  }
});