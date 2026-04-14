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

  checkLogin() {
    if (!wx.getStorageSync('token')) {
      util.showToast('请先登录');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 500);
      return false;
    }
    return true;
  },

  handleChooseFile() {
    if (!this.checkLogin()) return;
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

    api.parse.excel(this.data.fileList[0].path).then((data) => {
      this.setData({
        uploading: false,
        result: data,
        currentSheet: 0,
        currentSheetData: data.sheets ? data.sheets[0] : null
      });
    }).catch(() => {
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