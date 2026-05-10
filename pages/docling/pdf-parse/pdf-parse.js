const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    enableOcr: true,
    enableTableStructure: true,
    loading: false,
    showResult: false,
    resultContent: '',
    jsonResult: null,
    supportedFormats: [],
    selectedOutputFormat: 'markdown',
    noticeVisible: false
  },

  onLoad() {
    this.loadFormats();
  },

  loadFormats() {
    api.docling.formats().then((data) => {
      if (data && data.input_formats) {
        this.setData({ supportedFormats: data.input_formats });
      }
    }).catch(() => {});
  },

  toggleNotice() {
    this.setData({ noticeVisible: true });
  },

  closeNotice() {
    this.setData({ noticeVisible: false });
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          selectedFile: file.name,
          selectedFilePath: file.path,
          showResult: false
        });
      },
      fail: () => {
        wx.chooseMedia({
          count: 1,
          type: 'file',
          mediaType: ['file'],
          success: (res) => {
            if (res.tempFiles[0].fileType === 'pdf') {
              const file = res.tempFiles[0];
              this.setData({
                selectedFile: file.name || 'document.pdf',
                selectedFilePath: file.tempFilePath,
                showResult: false
              });
            } else {
              util.showToast('请选择PDF文件');
            }
          }
        });
      }
    });
  },

  clearFile() {
    this.setData({
      selectedFile: '',
      selectedFilePath: '',
      showResult: false,
      resultContent: ''
    });
  },

  onOcrChange(e) {
    this.setData({ enableOcr: e.detail.value });
  },

  onTableChange(e) {
    this.setData({ enableTableStructure: e.detail.value });
  },

  selectFormat(e) {
    this.setData({ selectedOutputFormat: e.currentTarget.dataset.format });
  },

  handleConvert() {
    if (!this.data.selectedFilePath) {
      util.showToast('请先选择文件');
      return;
    }

    this.setData({ loading: true });
    util.showLoading('解析中，请稍候...');

    const options = {
      outputFormats: this.data.selectedOutputFormat,
      enableOcr: this.data.enableOcr,
      ocrEngine: 'easyocr',
      ocrLangs: 'en,zh',
      enableTableStructure: this.data.enableTableStructure
    };

    api.docling.convert(this.data.selectedFilePath, options).then((data) => {
      util.hideLoading();
      
      let content = '';
      if (this.data.selectedOutputFormat === 'json') {
        content = JSON.stringify(data, null, 2);
      } else if (data.markdown) {
        content = data.markdown;
      } else if (data.text) {
        content = data.text;
      }

      const now = new Date();
      const suffix = this.data.selectedOutputFormat === 'json' ? 'json' : 'md';
      const fileName = `pdf_parse_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}.${suffix}`;
      
      const fs = wx.getFileSystemManager();
      fs.writeFile({
        filePath: filePath,
        data: content,
        encoding: 'utf-8',
        success: () => {
          util.openFile(filePath, suffix === 'json' ? 'json' : 'doc');
        },
        fail: () => {
          util.showToast('保存失败');
        }
      });
    }).catch((err) => {
      util.hideLoading();
      console.error('Convert error:', err);
      util.showToast('解析失败，请重试');
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  copyResult() {
    wx.setClipboardData({
      data: this.data.resultContent,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  }
});