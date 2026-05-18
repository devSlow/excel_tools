const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    selectedFile: '',
    selectedFilePath: '',
    splitMode: 'intervals',
    splitSpan: '3',
    loading: false,
    noticeVisible: false,
    splitFiles: []
  },

  onLoad() {
    this.checkServiceHealth();
  },

  checkServiceHealth() {
    api.gotenberg.health().catch(() => {
      wx.showToast({ title: '服务暂不可用', icon: 'none' });
    });
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
          splitFiles: []
        });
      },
      fail: () => {
        wx.showToast({ title: '请选择PDF文件', icon: 'none' });
      }
    });
  },

  clearFile() {
    this.setData({
      selectedFile: '',
      selectedFilePath: '',
      splitFiles: []
    });
  },

  selectMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const data = { splitMode: mode };
    if (mode === 'pages') {
      data.splitSpan = '';
    }
    this.setData(data);
  },

  onSpanInput(e) {
    this.setData({ splitSpan: e.detail.value });
  },

  handleSplit() {
    if (!this.data.selectedFilePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    if (this.data.splitMode === 'intervals' && !this.data.splitSpan) {
      wx.showToast({ title: '请输入间隔数', icon: 'none' });
      return;
    }

    this.setData({ loading: true, splitFiles: [] });
    util.showLoading('拆分中，请稍候...');

    console.log('=== 开始拆分PDF ===');
    console.log('文件路径:', this.data.selectedFilePath);
    console.log('文件名:', this.data.selectedFile);
    console.log('拆分模式:', this.data.splitMode);
    console.log('间隔数/页码:', this.data.splitSpan);
    const formData = {
      splitMode: this.data.splitMode
    };
    
    // 根据模式设置splitSpan参数
    if (this.data.splitMode === 'intervals') {
      formData.splitSpan = this.data.splitSpan;
    } else {
      // 按单页拆分时，使用用户输入的页码范围，默认为所有页面
      formData.splitSpan = this.data.splitSpan || '1-';
    }
    
    console.log('发送参数:', formData);

    wx.uploadFile({
      url: api.baseUrl + '/gotenberg/pdf/split/url',
      filePath: this.data.selectedFilePath,
      name: 'file',
      header: {
        'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
      },
      formData: formData,
      success: (res) => {
        console.log('=== 请求成功 ===');
        console.log('状态码:', res.statusCode);
        console.log('响应数据:', res.data);
        
        util.hideLoading();
        if (res.statusCode === 200 && res.data) {
          try {
            const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            console.log('解析结果:', result);
            
            if (result.code === 200 && result.data) {
              const baseName = this.data.selectedFile.replace(/\.[^.]+$/, '');
              const files = result.data.map((url, index) => {
                const downloadUrl = url.startsWith('http') ? url : (api.baseUrl.replace('/api', '') + url);
                return {
                  name: `${baseName}_第${index + 1}页.pdf`,
                  url: downloadUrl,
                  fileType: 'pdf'
                };
              });
              
              console.log('拆分文件列表:', files);
              this.setData({ splitFiles: files });
              wx.showToast({ title: `拆分成功，共${files.length}个文件`, icon: 'success' });
              const token = wx.getStorageSync('token');
              if (token) {
                api.task.create({
                  title: `PDF拆分 - ${this.data.selectedFile}`,
                  type: 'pdf_split',
                  fileUrl: JSON.stringify(files.map(f => f.url)),
                  sourceFile: this.data.selectedFile,
                  params: JSON.stringify({ splitMode: this.data.splitMode, splitSpan: formData.splitSpan })
                }).catch(() => {});
              }
            } else {
              wx.showToast({ title: result.msg || '拆分失败', icon: 'none' });
            }
          } catch (e) {
            console.error('解析响应失败:', e);
            wx.showToast({ title: '拆分失败', icon: 'none' });
          }
        } else {
          try {
            const data = JSON.parse(res.data);
            console.error('错误信息:', data);
            wx.showToast({ title: data.msg || '拆分失败', icon: 'none' });
          } catch (e) {
            console.error('解析响应失败:', e);
            wx.showToast({ title: '拆分失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        console.error('=== 请求失败 ===');
        console.error('错误信息:', err);
        util.hideLoading();
        wx.showToast({ title: '拆分失败，请重试', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  openFile(e) {
    const index = e.currentTarget.dataset.index;
    const file = this.data.splitFiles[index];
    
    console.log('打开文件:', file);
    
    util.showLoading('下载中...');
    
    wx.request({
      url: file.url,
      responseType: 'arraybuffer',
      timeout: 180000,
      success: (res) => {
        console.log('下载成功:', res);
        util.hideLoading();
        
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager();
          const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.pdf`;
          fs.writeFile({
            filePath: filePath,
            data: res.data,
            success: () => {
              wx.openDocument({
                filePath: filePath,
                fileType: file.fileType || 'pdf',
                showMenu: true,
                success: () => {
                  console.log('文档打开成功');
                },
                fail: (err) => {
                  console.error('文档打开失败:', err);
                  wx.showToast({ title: '打开失败', icon: 'none' });
                }
              });
            },
            fail: (err) => {
              console.error('文件写入失败:', err);
              wx.showToast({ title: '打开失败', icon: 'none' });
            }
          });
        }
      },
      fail: (err) => {
        console.error('下载失败:', err);
        util.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  }
});
