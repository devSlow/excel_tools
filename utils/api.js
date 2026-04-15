// const baseUrl = 'https://devslow.ccwu.cc/api';
const baseUrl = 'http://localhost:8080/api';

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.data.code === 0) {
          resolve(res.data.data);
        } else {
          wx.showToast({
            title: res.data.msg || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
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

const parse = {
  text: (text, delimiter) => request({
    url: '/parse/text',
    method: 'POST',
    data: { text, delimiter }
  }),
  textExport: (text, delimiter) => {
    let params = `text=${encodeURIComponent(text)}`;
    if (delimiter && delimiter !== 'auto') {
      params += `&delimiter=${encodeURIComponent(delimiter)}`;
    }
    const token = wx.getStorageSync('token');
    let url = `${baseUrl}/parse/text/export?${params}`;
    if (token) {
      url += `&Authorization=Bearer ${token}`;
    }
    return url;
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
  list: (page, size) => request({
    url: `/task?page=${page}&size=${size}`,
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
  export: (id) => `${baseUrl}/task/${id}/export`,
  exportGroup: (id, groupByField) => `${baseUrl}/task/${id}/export/group?groupByField=${groupByField}`
};

module.exports = {
  auth,
  parse,
  task
};