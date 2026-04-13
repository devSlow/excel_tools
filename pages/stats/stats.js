const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    taskId: '',
    taskName: '',
    columns: [],
    selectedColumn: '',
    stats: {
      totalRows: 0,
      columnCount: 0,
      groupCount: 0
    },
    columnStats: [],
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ taskId: options.id });
      this.loadStats();
    }
  },

  loadStats() {
    if (!this.data.taskId) return;
    
    util.showLoading();
    
    api.task.get(this.data.taskId).then((data) => {
      const columns = data.columns || [];
      this.setData({
        taskName: data.name,
        columns: columns,
        selectedColumn: columns.length > 0 ? columns[0] : '',
        stats: {
          totalRows: data.rowCount || 0,
          columnCount: columns.length,
          groupCount: 0
        }
      });
      
      if (columns.length > 0) {
        this.loadColumnStats(columns[0]);
      }
      
      util.hideLoading();
    }).catch(() => {
      util.hideLoading();
      util.showToast('加载失败');
    });
  },

  selectColumn(e) {
    const column = e.currentTarget.dataset.column;
    this.setData({ selectedColumn: column });
    this.loadColumnStats(column);
  },

  loadColumnStats(column) {
    if (!this.data.taskId || !column) return;
    
    this.setData({ loading: true });
    
    api.task.stats(this.data.taskId).then((data) => {
      const statsData = data.columnStats ? data.columnStats[column] : [];
      
      let maxCount = 0;
      statsData.forEach(item => {
        if (item.count > maxCount) maxCount = item.count;
      });
      
      const columnStats = statsData.map(item => ({
        ...item,
        percent: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
      }));
      
      this.setData({
        loading: false,
        columnStats: columnStats,
        stats: {
          ...this.data.stats,
          groupCount: statsData.length
        }
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  }
});