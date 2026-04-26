const api = require('../../utils/api.js');

Page({
  data: {
    notice: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.loadNotice(options.id)
    }
  },

  loadNotice(id) {
    api.request({
      url: `/notice/${id}`,
      method: 'GET'
    }).then(res => {
      this.setData({ notice: res })
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  }
})