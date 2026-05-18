const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

const FILE_TYPES = {
  pdf: { extensions: ['pdf'], type: 'PDF文档' },
  word: { extensions: ['doc', 'docx'], type: 'Word文档' },
  excel: { extensions: ['xls', 'xlsx'], type: 'Excel表格' },
  ppt: { extensions: ['ppt', 'pptx'], type: 'PPT演示' }
};

const FORMAT_CONFIGS = {
  pdf: {
    fromWord: [{ value: 'pdf', name: 'PDF', icon: 'PDF' }],
    fromExcel: [{ value: 'pdf', name: 'PDF', icon: 'PDF' }],
    fromPpt: [{ value: 'pdf', name: 'PDF', icon: 'PDF' }],
    toWord: [{ value: 'docx', name: 'Word', icon: 'W' }],
    toExcel: [{ value: 'xlsx', name: 'Excel', icon: 'X' }],
    toPpt: [{ value: 'pptx', name: 'PPT', icon: 'P' }]
  }
};

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    fileType: '',
    detectedType: '',
    targetFormat: '',
    availableFormats: [],
    loading: false,
    noticeVisible: false
  },

  onLoad() {
    this.checkServiceHealth();
  },

  checkServiceHealth() {
    api.gotenberg.health().then(() => {
      console.log('Gotenberg service is healthy');
    }).catch(() => {
      wx.showToast({ title: '服务暂不可用', icon: 'none' });
    });
  },

  toggleNotice() {
    this.setData({ noticeVisible: true });
  },

  closeNotice() {
    this.setData({ noticeVisible: false });
  },

  detectFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    for (const [type, config] of Object.entries(FILE_TYPES)) {
      if (config.extensions.includes(ext)) {
        return type;
      }
    }
    return '';
  },

  getAvailableFormats(fileType) {
    if (fileType === 'pdf') {
      return FORMAT_CONFIGS.pdf.toWord.concat(FORMAT_CONFIGS.pdf.toExcel, FORMAT_CONFIGS.pdf.toPpt);
    } else if (fileType === 'word') {
      return FORMAT_CONFIGS.pdf.fromWord;
    } else if (fileType === 'excel') {
      return FORMAT_CONFIGS.pdf.fromExcel;
    } else if (fileType === 'ppt') {
      return FORMAT_CONFIGS.pdf.fromPpt;
    }
    return [];
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
      success: (res) => {
        const file = res.tempFiles[0];
        const fileType = this.detectFileType(file.name);
        const formats = this.getAvailableFormats(fileType);

        this.setData({
          selectedFile: file.name,
          selectedFilePath: file.path,
          fileType: fileType,
          detectedType: FILE_TYPES[fileType]?.type || '未知类型',
          availableFormats: formats,
          targetFormat: ''
        });
      },
      fail: () => {
        wx.showToast({ title: '请选择文件', icon: 'none' });
      }
    });
  },

  clearFile() {
    this.setData({
      selectedFile: '',
      selectedFilePath: '',
      fileType: '',
      detectedType: '',
      availableFormats: [],
      targetFormat: ''
    });
  },

  selectFormat(e) {
    const format = e.currentTarget.dataset.format;
    this.setData({ targetFormat: format });
  },

  getContentType(format) {
    const types = {
      'pdf': 'pdf',
      'docx': 'docx',
      'xlsx': 'xlsx',
      'pptx': 'pptx'
    };
    return types[format] || format;
  },

  handleConvert() {
    if (!this.data.selectedFilePath || !this.data.targetFormat) {
      wx.showToast({ title: '请选择文件和目标格式', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('转换中，请稍候...');

    const token = wx.getStorageSync('token');
    const header = {
      'Authorization': token ? `Bearer ${token}` : ''
    };

    const originalName = this.data.selectedFile.replace(/\.[^.]+$/, '');
    const fileName = `${originalName}.${this.data.targetFormat}`;
    const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    console.log('=== 开始转换 ===');
    console.log('请求URL:', api.baseUrl + '/gotenberg/convert/document/url');
    console.log('文件路径:', this.data.selectedFilePath);
    console.log('文件名:', this.data.selectedFile);
    console.log('目标格式:', this.data.targetFormat);
    console.log('请求头:', header);

    wx.uploadFile({
      url: api.baseUrl + '/gotenberg/convert/document/url',
      filePath: this.data.selectedFilePath,
      name: 'file',
      header: header,
      formData: {
        targetFormat: this.data.targetFormat
      },
      success: (res) => {
        console.log('=== 请求成功 ===');
        console.log('状态码:', res.statusCode);
        console.log('响应头:', res.header);
        console.log('响应数据:', res.data);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(res.data);
            console.log('解析结果:', result);
            
            if (result.code === 200 && result.data) {
              const downloadUrl = result.data.startsWith('http') ? result.data : (api.baseUrl.replace('/api', '') + result.data);
              console.log('下载链接:', downloadUrl);
              const token = wx.getStorageSync('token');
              if (token) {
                api.task.create({
                  title: `文档转换 - ${this.data.selectedFile}`,
                  type: 'doc_convert',
                  fileUrl: JSON.stringify([downloadUrl]),
                  sourceFile: this.data.selectedFile,
                  params: JSON.stringify({ targetFormat: this.data.targetFormat })
                }).catch(() => {});
              }
              wx.downloadFile({
                url: downloadUrl,
                header: header,
                timeout: 180000, // 3分钟超时
                success: (downloadRes) => {
                  console.log('=== 下载成功 ===');
                  console.log('下载状态码:', downloadRes.statusCode);
                  console.log('临时文件路径:', downloadRes.tempFilePath);
                  
                  if (downloadRes.statusCode === 200) {
                      wx.saveFile({
                      tempFilePath: downloadRes.tempFilePath,
                      success: (saveRes) => {
                        console.log('文件保存成功:', saveRes.savedFilePath);
                        util.hideLoading();
                        wx.showToast({ title: '转换成功', icon: 'success' });
                        setTimeout(() => {
                          wx.openDocument({
                            filePath: saveRes.savedFilePath,
                            fileType: this.getContentType(this.data.targetFormat),
                            showMenu: true,
                            success: () => {
                              console.log('文档打开成功');
                            },
                            fail: (err) => {
                              console.error('文档打开失败:', err);
                              wx.showToast({ title: '打开失败', icon: 'none' });
                            }
                          });
                        }, 1500);
                      },
                      fail: (err) => {
                        console.error('文件保存失败:', err);
                        util.hideLoading();
                        wx.showToast({ title: '保存失败', icon: 'none' });
                      }
                    });
                  } else {
                    console.error('下载失败，状态码:', downloadRes.statusCode);
                    util.hideLoading();
                    wx.showToast({ title: '下载失败', icon: 'none' });
                  }
                },
                fail: (err) => {
                  console.error('=== 下载失败 ===');
                  console.error('错误信息:', err);
                  util.hideLoading();
                  wx.showToast({ title: '下载失败', icon: 'none' });
                }
              });
            } else {
              console.error('转换失败:', result.msg);
              util.hideLoading();
              wx.showToast({ title: result.msg || '转换失败', icon: 'none' });
            }
          } catch (e) {
            console.error('解析响应失败:', e);
            util.hideLoading();
            wx.showToast({ title: '转换失败', icon: 'none' });
          }
        } else {
          console.error('请求失败，状态码:', res.statusCode);
          util.hideLoading();
          wx.showToast({ title: '转换失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('=== 请求失败 ===');
        console.error('错误信息:', err);
        util.hideLoading();
        wx.showToast({ title: '转换失败，请重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});
