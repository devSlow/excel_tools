const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    task: {},
    showGroupModal: false,
    selectedField: ''
  },

  onLoad(options) {
    if (options.id) {
      this.loadTask(options.id);
    }
  },

  onShareAppMessage() {
    const task = this.data.task;
    return {
      title: task.title || 'Excel数据任务',
      path: `/pages/task/detail/detail?id=${task.id}`,
      imageUrl: '/images/share-task.png'
    };
  },

  loadTask(id) {
    util.showLoading();
    api.task.get(id).then((data) => {
      const statusMap = { completed: '已完成', processing: '处理中', draft: '草稿' };
      const columns = data.columns || [];
      const columnNames = columns.map(col => col.name);
      const rows = (data.rows || []).map(row => columnNames.map(name => row[name] ?? ''));
      
      this.setData({
        task: {
          ...data,
          columns,
          rows,
          rowCount: data.rows ? data.rows.length : 0,
          columnCount: columns.length,
          statusText: statusMap[data.status] || '未知',
          createTime: data.createdAt ? util.formatTime(new Date(data.createdAt)) : '-'
        }
      });
      util.hideLoading();
    }).catch(() => {
      util.hideLoading();
      util.showToast('加载失败');
    });
  },

  goToStats() {
    wx.navigateTo({ url: `/pages/stats/stats?id=${this.data.task.id}` });
  },

  handleExportSingle() {
    const now = new Date();
    const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    
    util.showLoading('导出中...');
    const url = api.task.export(this.data.task.id, fileName);
    util.downloadFile(url, fileName).then((filePath) => {
      util.hideLoading();
      util.openFile(filePath, 'xlsx');
    }).catch(() => {
      util.hideLoading();
      util.showToast('导出失败');
    });
  },

  showExportGroup() {
    if (!this.data.task.columns || this.data.task.columns.length === 0) {
      util.showToast('无可用字段');
      return;
    }
    this.setData({ showGroupModal: true, selectedField: this.data.task.columns[0].name });
  },

  hideModal() {
    this.setData({ showGroupModal: false });
  },

  stopProp() {},

  selectField(e) {
    this.setData({ selectedField: e.currentTarget.dataset.field });
  },

  handleExportGroup() {
    if (!this.data.selectedField) {
      util.showToast('请选择分组字段');
      return;
    }
    
    util.showLoading('导出中...');
    const url = api.task.exportGroup(this.data.task.id, this.data.selectedField);
    util.downloadFile(url).then((filePath) => {
      util.openFile(filePath);
      util.hideLoading();
      this.setData({ showGroupModal: false });
    }).catch(() => {
      util.hideLoading();
      util.showToast('导出失败');
    });
  },

  handleDelete() {
    util.showModal('确认删除', '删除后数据无法恢复').then((confirm) => {
      if (confirm) {
        util.showLoading('删除中...');
        api.task.delete(this.data.task.id).then(() => {
          util.showToast('删除成功');
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        }).catch(() => {
          util.hideLoading();
        });
      }
    });
  }
});