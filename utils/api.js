// const baseUrl = 'http://172.18.132.40:9090/api' //本地测试
const baseUrl = 'https://devslow.ccwu.cc/api';
const verifyBaseUrl = 'https://paper.devslow.ccwu.cc/api/auth';

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    const header = {
      'Content-Type': 'application/json'
    };
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    wx.request({
      url: baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: 5000,
      success: (res) => {
        if (res.data && (res.data.code === 0 || res.data.code === 200)) {
          resolve(res.data.data);
        } else if (res.data && (res.data.code === 4001 || res.data.code === 4002)) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          reject(res.data);
        } else {
          wx.showToast({
            title: (res.data && res.data.msg) || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        console.error('request fail:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
};

const auth = {
  login: (code, nickname, avatarUrl) => request({
    url: '/auth/login',
    method: 'POST',
    data: { code, nickname, avatarUrl }
  })
};

const banner = {
  list: () => request({
    url: '/banner',
    method: 'GET'
  })
};

const parse = {
  text: (text, delimiter) => request({
    url: '/parse/text',
    method: 'POST',
    data: { text, delimiter }
  }),
  textExport: (text, delimiter) => {
    let params = `text=${encodeURIComponent(text)}`;
    if (delimiter && delimiter !== 'auto' && delimiter !== '') {
      params += `&delimiter=${encodeURIComponent(delimiter)}`;
    }
    return `${baseUrl}/parse/text/export?${params}`;
  },
  excel: (filePath) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: baseUrl + '/parse/excel',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data.data);
          } else {
            wx.showToast({ title: data.msg, icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  }
};

const task = {
  list: (page, size, keyword = '', startDate = '', endDate = '') => request({
    url: `/task?page=${page}&size=${size}${keyword ? '&keyword=' + encodeURIComponent(keyword) : ''}${startDate ? '&startDate=' + startDate : ''}${endDate ? '&endDate=' + endDate : ''}`,
    method: 'GET'
  }),
  count: () => request({
    url: '/task/count',
    method: 'GET'
  }),
  countRows: () => request({
    url: '/task/count/rows',
    method: 'GET'
  }),
  create: (data) => request({
    url: '/task',
    method: 'POST',
    data
  }),
  get: (id) => request({
    url: `/task/${id}`,
    method: 'GET'
  }),
  update: (id, data) => request({
    url: `/task/${id}`,
    method: 'PUT',
    data
  }),
  delete: (id) => request({
    url: `/task/${id}`,
    method: 'DELETE'
  }),
  stats: (id) => request({
    url: `/task/${id}/stats`,
    method: 'GET'
  }),
  export: (id, fileName) => {
    let url = `${baseUrl}/task/${id}/export`;
    if (fileName) {
      url += `?fileName=${encodeURIComponent(fileName)}`;
    }
    return url;
  },
  exportGroup: (id, groupByField) => `${baseUrl}/task/${id}/export/group?groupByField=${encodeURIComponent(groupByField)}`
};

const notice = {
  get: (id) => request({
    url: `/notice/${id}`,
    method: 'GET'
  })
};

const config = {
  getVersion: () => request({
    url: '/config/version',
    method: 'GET'
  })
};

const verifyRequest = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    const header = {
      'Content-Type': 'application/json'
    };
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    wx.request({
      url: verifyBaseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: 5000,
      success: (res) => {
        if (res.data && (res.data.code === 0 || res.data.code === 200)) {
          resolve(res.data.data);
        } else if (res.data && (res.data.code === 4001 || res.data.code === 4002)) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          reject(res.data);
        } else {
          wx.showToast({
            title: (res.data && res.data.msg) || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        console.error('request fail:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
};

const verify = {
  generate: () => verifyRequest({
    url: '/verify/generate',
    method: 'POST'
  }),
  getCode: (sessionId) => verifyRequest({
    url: `/verify/code?sessionId=${sessionId}`,
    method: 'GET'
  }),
  confirm: (sessionId, code) => verifyRequest({
    url: '/verify/confirm',
    method: 'POST',
    data: { sessionId, code }
  }),
  redeem: (sessionId, code, deviceId) => verifyRequest({
    url: '/verify/redeem',
    method: 'POST',
    data: { sessionId, code, deviceId }
  })
};

const gotenberg = {
  health: () => request({
    url: '/gotenberg/health',
    method: 'GET'
  }),
  version: () => request({
    url: '/gotenberg/version',
    method: 'GET'
  }),
  convertDocument: (filePath, targetFormat, password = '') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      const formData = { targetFormat };
      if (password) {
        formData.password = password;
      }
      wx.uploadFile({
        url: baseUrl + '/gotenberg/convert/document',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: formData,
        responseType: 'arraybuffer',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '转换失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  convertPdfToOffice: (filePath, targetFormat = 'docx') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      wx.uploadFile({
        url: baseUrl + '/gotenberg/convert/pdf-to-office',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: {
          targetFormat
        },
        responseType: 'arraybuffer',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '转换失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  convertOfficeToPdf: (filePath, password = '') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      const formData = {};
      if (password) {
        formData.password = password;
      }
      wx.uploadFile({
        url: baseUrl + '/gotenberg/convert/office-to-pdf',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: formData,
        responseType: 'arraybuffer',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '转换失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  mergePdfs: (filePaths) => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      const uploadTasks = filePaths.map((filePath, index) => {
        return wx.uploadFile({
          url: baseUrl + '/gotenberg/pdf/merge',
          filePath: filePath,
          name: 'files',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
      });
      Promise.all(uploadTasks).then(() => {
        resolve();
      }).catch(reject);
    });
  },
  splitPdf: (filePath, splitMode, splitSpan, splitUnify = false) => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      wx.uploadFile({
        url: baseUrl + '/gotenberg/pdf/split',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: {
          splitMode,
          splitSpan,
          splitUnify: String(splitUnify)
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '拆分失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  rotatePdf: (filePath, angle, pages = '') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      wx.uploadFile({
        url: baseUrl + '/gotenberg/pdf/rotate',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: {
          angle: String(angle),
          pages
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '旋转失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  encryptPdf: (filePath, userPassword, ownerPassword = '') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      wx.uploadFile({
        url: baseUrl + '/gotenberg/pdf/encrypt',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: {
          userPassword,
          ownerPassword
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '加密失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  addWatermark: (filePath, source, expression, pages = '') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      wx.uploadFile({
        url: baseUrl + '/gotenberg/pdf/watermark',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        formData: {
          source,
          expression: expression || '',
          pages
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            const data = JSON.parse(res.data);
            wx.showToast({ title: data.msg || '添加水印失败', icon: 'none' });
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  convertToPdf: (sourceType, url = '', htmlFile = null, extraFiles = null) => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      if (sourceType === 'url') {
        wx.request({
          url: baseUrl + '/gotenberg/convert/to-pdf',
          method: 'POST',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          data: {
            sourceType,
            url
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              const data = res.data;
              wx.showToast({ title: data.msg || '转换失败', icon: 'none' });
              reject(data);
            }
          },
          fail: reject
        });
      } else if (htmlFile) {
        wx.uploadFile({
          url: baseUrl + '/gotenberg/convert/to-pdf',
          filePath: htmlFile,
          name: 'htmlFile',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          formData: {
            sourceType
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              const data = JSON.parse(res.data);
              wx.showToast({ title: data.msg || '转换失败', icon: 'none' });
              reject(data);
            }
          },
          fail: reject
        });
      }
    });
  },
  screenshot: (sourceType, url = '', htmlFile = null, format = 'png') => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      if (sourceType === 'url') {
        wx.request({
          url: baseUrl + '/gotenberg/screenshot',
          method: 'POST',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          data: {
            sourceType,
            url,
            format
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              const data = res.data;
              wx.showToast({ title: data.msg || '截图失败', icon: 'none' });
              reject(data);
            }
          },
          fail: reject
        });
      } else if (htmlFile) {
        wx.uploadFile({
          url: baseUrl + '/gotenberg/screenshot',
          filePath: htmlFile,
          name: 'htmlFile',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          formData: {
            sourceType,
            format
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              const data = JSON.parse(res.data);
              wx.showToast({ title: data.msg || '截图失败', icon: 'none' });
              reject(data);
            }
          },
          fail: reject
        });
      }
    });
  }
};

module.exports = {
  request,
  auth,
  parse,
  task,
  banner,
  notice,
  config,
  verify,
  gotenberg,
  baseUrl
};