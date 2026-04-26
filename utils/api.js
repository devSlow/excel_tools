const baseUrl = 'https://devslow.ccwu.cc/api';
// const baseUrl = 'http://localhost:8080/api';

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
        } else if (res.data.code === 4001 || res.data.code === 4002) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/login/login' });
          }, 500);
          reject(res.data);
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
    const token = wx.getStorageSync('token');
    let url = `${baseUrl}/parse/text/export?${params}`;
    if (token) {
      url += `&Authorization=Bearer%20${encodeURIComponent(token)}`;
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
  list: (page, size, keyword = '') => request({
    url: `/task?page=${page}&size=${size}${keyword ? '&keyword=' + encodeURIComponent(keyword) : ''}`,
    method: 'GET'
  }),
  count: () => request({
    url: '/task/count',
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
    const params = [];
    if (fileName) {
      params.push(`fileName=${encodeURIComponent(fileName)}`);
    }
    const token = wx.getStorageSync('token');
    if (token) {
      params.push(`Authorization=Bearer%20${encodeURIComponent(token)}`);
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return url;
  },
  exportGroup: (id, groupByField) => `${baseUrl}/task/${id}/export/group?groupByField=${groupByField}`
};

module.exports = {
  auth,
  parse,
  task,
  banner
};