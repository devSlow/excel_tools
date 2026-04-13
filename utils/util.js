const formatTime = date => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const formatDate = date => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const debounce = (fn, delay = 500) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

const throttle = (fn, delay = 500) => {
  let flag = true;
  return function(...args) {
    if (!flag) return;
    flag = false;
    setTimeout(() => {
      fn.apply(this, args);
      flag = true;
    }, delay);
  };
};

const showLoading = (title = '加载中') => {
  wx.showLoading({ title, mask: true });
};

const hideLoading = () => {
  wx.hideLoading();
};

const showToast = (title, icon = 'none') => {
  wx.showToast({ title, icon });
};

const showModal = (title, content) => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm)
    });
  });
};

const navigateTo = (url) => {
  wx.navigateTo({ url });
};

const switchTab = (url) => {
  wx.switchTab({ url });
};

const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          reject(new Error('下载失败'));
        }
      },
      fail: reject
    });
  });
};

const openFile = (filePath) => {
  wx.openDocument({ filePath, success: () => {} });
};

module.exports = {
  formatTime,
  formatDate,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  navigateTo,
  switchTab,
  downloadFile,
  openFile
};