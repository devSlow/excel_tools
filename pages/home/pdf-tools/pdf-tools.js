Page({
  goTo(e) {
    const type = e.currentTarget.dataset.type;
    const routes = {
      'pdf-merge': '/pages/gotenberg/pdf-merge/pdf-merge',
      'pdf-split': '/pages/gotenberg/pdf-split/pdf-split',
      'pdf-rotate': '/pages/gotenberg/pdf-rotate/pdf-rotate',
      'pdf-encrypt': '/pages/gotenberg/pdf-encrypt/pdf-encrypt',
      'pdf-watermark': '/pages/gotenberg/pdf-watermark/pdf-watermark',
      'pdf-parse': '/pages/docling/pdf-parse/pdf-parse'
    };
    if (routes[type]) {
      wx.navigateTo({ url: routes[type] });
    }
  }
});
