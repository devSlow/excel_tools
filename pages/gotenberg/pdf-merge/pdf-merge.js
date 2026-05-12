const api = require('../../../utils/api.js');
const util = require('../../../utils/util.js');

Page({
  data: {
    files: [],
    loading: false,
    noticeVisible: false
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

  addFile() {
    if (this.data.files.length >= 10) {
      wx.showToast({ title: '最多添加10个文件', icon: 'none' });
      return;
    }

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0];
        const newFiles = [...this.data.files, { path: file.path, name: file.name }];
        this.setData({ files: newFiles });
      },
      fail: () => {
        wx.showToast({ title: '请选择PDF文件', icon: 'none' });
      }
    });
  },

  removeFile(e) {
    const index = e.currentTarget.dataset.index;
    const newFiles = this.data.files.filter((_, i) => i !== index);
    this.setData({ files: newFiles });
  },

  clearFiles() {
    this.setData({ files: [] });
  },

  handleMerge() {
    if (this.data.files.length < 2) {
      wx.showToast({ title: '请至少选择2个文件', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    util.showLoading('合并中，请稍候...');

    const token = wx.getStorageSync('token');
    const header = {};
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    console.log('=== 开始合并PDF ===');
    console.log('文件数量:', this.data.files.length);
    this.data.files.forEach((file, index) => {
      console.log(`文件 ${index + 1}:`, file.name, file.path);
    });

    // 第一步：逐个上传文件到临时目录
    const files = this.data.files;
    let uploadPromises = [];
    
    files.forEach((file, index) => {
      console.log(`上传文件 ${index + 1}:`, file.path);
      uploadPromises.push(
        new Promise((resolve, reject) => {
          wx.uploadFile({
            url: api.baseUrl + '/gotenberg/pdf/merge/upload',
            filePath: file.path,
            name: 'file',
            header: header,
            success: (res) => {
              console.log(`文件 ${index + 1} 上传成功:`, res.statusCode, res.data);
              if (res.statusCode === 200) {
                try {
                  const result = JSON.parse(res.data);
                  if (result.code === 200) {
                    resolve(result.data);
                  } else {
                    reject(new Error(result.msg || '上传失败'));
                  }
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(new Error('上传失败'));
              }
            },
            fail: (err) => {
              console.error(`文件 ${index + 1} 上传失败:`, err);
              reject(err);
            }
          });
        })
      );
    });

    Promise.all(uploadPromises)
      .then((filenames) => {
        console.log('=== 所有文件上传成功 ===');
        console.log('文件名列表:', filenames);
        
        // 第二步：调用合并接口
        const formData = {
          filenames: filenames.join(',')
        };
        
        console.log('调用合并接口，参数:', formData);
        
        wx.request({
          url: api.baseUrl + '/gotenberg/pdf/merge/files',
          method: 'POST',
          header: {
            ...header,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: formData,
          success: (res) => {
            console.log('=== 合并请求成功 ===');
            console.log('状态码:', res.statusCode);
            console.log('响应数据:', res.data);
            
            if (res.statusCode === 200 && res.data) {
              try {
                const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                console.log('解析结果:', result);
                
                if (result.code === 200 && result.data) {
                  const downloadUrl = result.data.startsWith('http') ? result.data : (api.baseUrl.replace('/api', '') + result.data);
                  console.log('下载链接:', downloadUrl);
                  
                  // 第三步：下载合并后的文件
                  wx.downloadFile({
                    url: downloadUrl,
                    header: header,
                    success: (downloadRes) => {
                      console.log('=== 下载成功 ===');
                      console.log('下载状态码:', downloadRes.statusCode);
                      console.log('临时文件路径:', downloadRes.tempFilePath);
                      
                      if (downloadRes.statusCode === 200) {
                        wx.saveFile({
                          tempFilePath: downloadRes.tempFilePath,
                          success: (saveRes) => {
                            console.log('保存成功:', saveRes.savedFilePath);
                            util.hideLoading();
                            wx.showToast({ title: '合并成功', icon: 'success' });
                            setTimeout(() => {
                              wx.openDocument({
                                filePath: saveRes.savedFilePath,
                                fileType: 'pdf',
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
                            console.error('保存失败:', err);
                            util.hideLoading();
                            wx.showToast({ title: '保存失败', icon: 'none' });
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
                } else {
                  util.hideLoading();
                  wx.showToast({ title: result.msg || '合并失败', icon: 'none' });
                }
              } catch (e) {
                console.error('解析响应失败:', e);
                util.hideLoading();
                wx.showToast({ title: '合并失败', icon: 'none' });
              }
            } else {
              util.hideLoading();
              wx.showToast({ title: '合并失败', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('=== 合并请求失败 ===');
            console.error('错误信息:', err);
            util.hideLoading();
            wx.showToast({ title: '合并失败，请重试', icon: 'none' });
          }
        });
      })
      .catch((err) => {
        console.error('=== 上传失败 ===');
        console.error('错误信息:', err);
        util.hideLoading();
        wx.showToast({ title: '合并失败，请重试', icon: 'none' });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  }
});
