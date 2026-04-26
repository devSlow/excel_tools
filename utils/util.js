const formatTime = date => {
  const timestamp = date.getTime() + 8 * 60 * 60 * 1000;
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  const hour = d.getUTCHours().toString().padStart(2, '0');
  const minute = d.getUTCMinutes().toString().padStart(2, '0');
  return `${year}年${month}月${day}日 ${hour}:${minute}`;
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

const downloadFile = (url, fileName) => {
  return new Promise((resolve, reject) => {
    console.log('downloadFile url:', url);
    wx.downloadFile({
      url,
      success: (res) => {
        console.log('downloadFile response:', res);
        if (res.statusCode === 200) {
          const tempFilePath = res.tempFilePath;
          const fs = wx.getFileSystemManager();
          const ext = 'xlsx';
          const newFileName = fileName || 'export';
          const newFilePath = `${wx.env.USER_DATA_PATH}/${newFileName}.${ext}`;
          
          fs.getFileInfo({
            filePath: tempFilePath,
            success: () => {
              fs.readFile({
                filePath: tempFilePath,
                success: (readRes) => {
                  const buffer = readRes.data;
                  fs.writeFile({
                    filePath: newFilePath,
                    data: buffer,
                    encoding: 'binary',
                    success: () => {
                      resolve(newFilePath);
                    },
                    fail: () => {
                      resolve(tempFilePath);
                    }
                  });
                },
                fail: () => {
                  resolve(tempFilePath);
                }
              });
            },
            fail: () => {
              resolve(tempFilePath);
            }
          });
        } else {
          reject(new Error('下载失败'));
        }
      },
      fail: (err) => {
        console.log('downloadFile fail:', err);
        reject(err);
      }
    });
  });
};

const openFile = (filePath, fileType = 'xlsx') => {
  wx.openDocument({
    filePath,
    fileType,
    showMenu: true,
    success: () => {}
  });
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