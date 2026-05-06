const api = require('../../utils/api.js');

Page({
  data: {
    sessionId: '',
    code: '',
    error: '',
    loading: false
  },
  
  onLoad(options) {
    if (options && options.scene) {
      const scene = decodeURIComponent(options.scene);
      const params = this.parseScene(scene);
      if (params.sessionId) {
        this.setData({ sessionId: params.sessionId });
        this.queryCode(params.sessionId);
      }
    }
  },
  
  parseScene(scene) {
    const params = {};
    scene.split('&').forEach(item => {
      const [key, value] = item.split('=');
      if (key && value) params[key] = value;
    });
    return params;
  },
  
  onSessionInput(e) {
    this.setData({ sessionId: e.detail.value.trim(), error: '' });
  },
  
  onClear() {
    this.setData({ sessionId: '', code: '', error: '' });
  },
  
  onQuery() {
    const sessionId = this.data.sessionId;
    if (!sessionId || this.data.loading) return;
    this.queryCode(sessionId);
  },
  
  queryCode(sessionId) {
    this.setData({ loading: true, error: '', code: '' });
    
    api.verify.getCode(sessionId).then(res => {
      if (res && res.code) {
        this.setData({ code: res.code, loading: false });
      } else {
        this.setData({ error: '未找到验证码，请确认 SessionID 是否正确', loading: false });
      }
    }).catch(err => {
      console.error('[Verify] 查询失败:', err);
      this.setData({ error: '查询失败，请稍后重试', loading: false });
    });
  }
})
