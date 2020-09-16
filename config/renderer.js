module.exports = {
  entrance: {
    name: '入口',
    entry: 'src/renderer/entrance/main.js',
    template: 'public/index.html',
    browserWindowConfig: {
      width: 800,
      height: 500,
      resizable: false,
      // frame: false
    },
    bigWindow: {
      width: 1200,
      height: 640,
    },
  },
  screenCapture: {
    name: '截屏',
    entry: 'src/renderer/screenCapture/main.js',
    template: 'public/index.html',
    filename: 'screenCapture.html',
  }
};
