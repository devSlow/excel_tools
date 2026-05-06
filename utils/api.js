// const baseUrl = 'https://devslow.ccwu.cc/api';
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

module.exports = {
  request,
  auth,
  parse,
  task,
  banner,
  notice,
  config,
  verify
};