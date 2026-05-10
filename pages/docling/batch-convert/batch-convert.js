const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    fileList: [],
    enableOcr: true,
    loading: false,
    progress: 0,
    currentIndex: 0,
    outputFormats: [
      { name: 'Markdown', value: 'markdown' },
      { name: 'JSON', value: 'json' },
      { name: 'Text', value: 'text' }
    ],
    currentFormat: { name: 'Markdown', value: 'markdown' },
    results: [],
    noticeVisible: false
  },

  toggleNotice() {
    this.setData({ noticeVisible: true });
  },

  closeNotice() {
    this.setData({ noticeVisible: false });
  },

  chooseFiles() {
    wx.chooseMessageFile({
      count: 10,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        this.setData({ fileList: res.tempFiles });
      },
      fail: () => {
        util.showToast('选择失败，请重试');
      }
    });
  },

  removeFile(e) {
    const index = e.currentTarget.dataset.index;
    const fileList = [...this.data.fileList];
    fileList.splice(index, 1);
    this.setData({ fileList });
  },

  clearFiles() {
    this.setData({ fileList: [], results: [] });
  },

  onFormatChange(e) {
    const index = e.detail.value;
    this.setData({ currentFormat: this.data.outputFormats[index] });
  },

  onOcrChange(e) {
    this.setData({ enableOcr: e.detail.value });
  },

  handleConvert() {
    if (this.data.fileList.length === 0) {
      util.showToast('请先选择文件');
      return;
    }

    this.setData({ loading: true, results: [], progress: 0, currentIndex: 0 });
    util.showLoading('批量转换中...');

    const results = [];
    const total = this.data.fileList.length;

    const processFile = (index) => {
      if (index >= total) {
        this.setData({ loading: false, results });
        util.hideLoading();
        
        const successCount = results.filter(r => r.success).length;
        if (successCount === 0) {
          wx.showToast({ title: '全部转换失败', icon: 'none' });
          return;
        }

        const successResults = results.filter(r => r.success);
        const now = new Date();
        const fileName = `batch_convert_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        
        let content = '';
        let suffix = '';
        
        if (this.data.currentFormat.value === 'json') {
          content = JSON.stringify(successResults.map(r => ({ filename: r.filename, data: r.data })), null, 2);
          suffix = 'json';
        } else {
          content = successResults.map(r => `# ${r.filename}\n\n${r.data.markdown || r.data.text || ''}`).join('\n\n---\n\n');
          suffix = 'md';
        }
        
        const fs = wx.getFileSystemManager();
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}.${suffix}`;
        fs.writeFile({
          filePath: filePath,
          data: content,
          encoding: 'utf-8',
          success: () => {
            wx.showToast({ title: `${successCount}/${total}个转换成功`, icon: 'success' });
            setTimeout(() => {
              util.openFile(filePath, suffix === 'json' ? 'json' : 'doc');
            }, 500);
          },
          fail: () => {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        });
        
        return;
      }

      const file = this.data.fileList[index];
      const currentProgress = Math.round((index / total) * 100);
      this.setData({ currentIndex: index, progress: currentProgress });

      const options = {
        enableOcr: this.data.enableOcr,
        ocrEngine: 'easyocr'
      };

      const apiMethod = this.data.currentFormat.value === 'json' 
        ? api.docling.convertJson(file.path, options)
        : api.docling.convert(file.path, { ...options, outputFormats: this.data.currentFormat.value });

      apiMethod.then((data) => {
        results.push({
          filename: file.name,
          success: true,
          data: data
        });
        const successCount = results.filter(r => r.success).length;
        wx.showToast({ title: `处理中 ${index + 1}/${total} (成功${successCount})`, icon: 'none', duration: 1000 });
      }).catch(() => {
        results.push({
          filename: file.name,
          success: false
        });
        wx.showToast({ title: `处理中 ${index + 1}/${total}`, icon: 'none', duration: 1000 });
      }).finally(() => {
        this.setData({ progress: Math.round(((index + 1) / total) * 100) });
        setTimeout(() => processFile(index + 1), 100);
      });
    };

processFile(0);
  }
});