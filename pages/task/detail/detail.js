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
      const typeLabelMap = {
        pdf_split: 'PDF拆分', pdf_rotate: 'PDF旋转', pdf_merge: 'PDF合并',
        pdf_encrypt: 'PDF加密', pdf_watermark: 'PDF水印',
        doc_convert: '文档转换', office_to_pdf: 'Office转PDF',
        web_to_pdf: '网页转PDF', web_screenshot: '网页截图',
        parse_text: '文本解析', parse_excel: 'Excel解析'
      };
      const isFileTask = !!data.type && data.type !== 'parse_text' && data.type !== 'parse_excel';
      const columns = data.columns || [];
      const columnNames = columns.map(col => col.name);
      const rows = (data.rows || []).map(row => columnNames.map(name => row[name] ?? ''));
      
      let fileList = [];
      if (data.fileUrl) {
        try {
          const urls = JSON.parse(data.fileUrl);
          fileList = Array.isArray(urls) ? urls : [urls];
        } catch (e) {
          fileList = [data.fileUrl];
        }
      }
      this.setData({
        task: {
          ...data,
          columns,
          rows,
          rowCount: data.rows ? data.rows.length : 0,
          columnCount: columns.length,
          statusText: statusMap[data.status] || '未知',
          createTime: data.createdAt ? util.formatTime(new Date(data.createdAt)) : '-',
          isFileTask,
          typeLabel: typeLabelMap[data.type] || '数据处理',
          fileList
        }
      });
      util.hideLoading();
    }).catch(() => {
      util.hideLoading();
      util.showToast('加载失败');
    });
  },

  handleFileDownload(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '文件不可用', icon: 'none' });
      return;
    }
    const task = this.data.task;
    wx.showLoading({ title: '下载中...' });

    // 推断文件类型：params > URL扩展名 > 任务类型 > 默认pdf
    let fileType = '';
    if (task.params) {
      try {
        const params = JSON.parse(task.params);
        if (params.targetFormat) fileType = params.targetFormat;
      } catch (e) {}
    }
    if (!fileType && url) {
      const ext = url.split('.').pop().toLowerCase().split('?')[0];
      if (['pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'png', 'jpeg', 'webp'].includes(ext)) {
        fileType = ext;
      }
    }
    if (!fileType && task.type) {
      if (task.type.includes('screenshot')) fileType = 'png';
      else if (task.type.includes('pdf')) fileType = 'pdf';
    }
    if (!fileType) fileType = 'pdf';

    wx.downloadFile({
      url: url,
      timeout: 180000,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: fileType,
            showMenu: true,
            fail: () => { wx.showToast({ title: '打开失败', icon: 'none' }); }
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
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