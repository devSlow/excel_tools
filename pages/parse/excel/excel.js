const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    fileList: [],
    uploading: false,
    result: {
      sheets: []
    },
    currentSheet: 0,
    currentSheetData: null
  },

  onLoad() {
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      this.setData({ result: { sheets: [] }, fileList: [], currentSheet: 0, currentSheetData: null });
    }
  },

  handleChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          fileList: [{
            name: file.name,
            path: file.path,
            size: this.formatSize(file.size),
            status: 'pending'
          }]
        });
      }
    });
  },

  formatSize(size) {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  },

  handleUpload() {
    if (this.data.fileList.length === 0) {
      util.showToast('请先选择文件');
      return;
    }

    this.setData({ uploading: true });
    const isLoggedIn = !!wx.getStorageSync('token');

    api.parse.excel(this.data.fileList[0].path).then((data) => {
      this.setData({ uploading: false, result: data, currentSheet: 0, currentSheetData: data.sheets && data.sheets.length > 0 ? data.sheets[0] : null });
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
          name: `${prefix} ${timeStr}`,
          source: 'excel',
          columns: data.columns || [],
          data: data.data || [],
          sheets: data.sheets || [],
          status: 'completed'
        };
        api.task.create(taskData);
      }
      util.showToast('解析成功');
    }).catch((err) => {
      this.setData({ uploading: false });
    });
  },

  switchSheet(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentSheet: index,
      currentSheetData: this.data.result.sheets[index]
    });
  },

  saveAsTask() {
    if (!this.data.result.sheets || this.data.result.sheets.length === 0) {
      util.showToast('没有可保存的数据');
      return;
    }

    wx.navigateTo({
      url: '/pages/task/create/create?source=excel&data=' + encodeURIComponent(JSON.stringify(this.data.result))
    });
  }
});