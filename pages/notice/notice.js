const request = require('../../utils/request.js')

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
    request.request({
      url: `/notice/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({ notice: res.data })
      } else {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  }
})