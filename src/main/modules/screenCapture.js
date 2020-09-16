import { BrowserWindow, screen, powerMonitor } from 'electron';
// const os = require('os');
import { isMac } from '@/main/util';

const isDevelopment = process.env.WEBPACK_DEV_SERVER_URL;
let pageName = 'screenCapture';
let captureWins = [];
let fakeWins = [];
let targetWin = null;
function showCaptureWins () {
  captureWins.forEach((win) => {
    if (!win.isVisible()) {
      win.showInactive();
    }
    win.shouldClose = false;
  });
}

let setFocus = (captureWin) => {
  let { bounds } = captureWin;
  let { x, y } = screen.getCursorScreenPoint();
  if (x === captureWin.oldX && y === captureWin.oldY) return;
  captureWin.oldX = x;
  captureWin.oldY = y;
  if (x > bounds.x && y > bounds.y && x < bounds.x + bounds.width && y < bounds.y + bounds.height) {
    if (!captureWin.isFocused()) {
      captureWin.focus();
      captureWin.webContents.send('focusCapture');
    }
  } else {
    if (captureWin.isFocused()) captureWin.blur();
  }
};

let isForceClose = false;

export default {
  init (win) {
    if (win) {
      targetWin = win;
      targetWin.on('minimize', () => {
        if (targetWin.captureType === 'minimum') {
          setTimeout(showCaptureWins, 1000);
        }
      });
    }
    if (captureWins.length) return false;
    console.info('----init capture----');
    let displays = screen.getAllDisplays();
    captureWins = displays.map((display) => {
      let captureWin = new BrowserWindow({
        // window 使用 fullscreen,  mac 设置为 undefined, 不可为 false
        fullscreen: isMac() ? undefined: true,
        simpleFullscreen: true, // 根本没什么卵用！使用方法才有用
        fullScreenable: false,
        titleBarStyle: 'hidden',
        width: display.bounds.width,
        height: display.bounds.height,
        x: display.bounds.x,
        y: display.bounds.y,
        transparent: true,
        useContentSize: true,
        frame: false,
        // alwaysOnTop: true,
        skipTaskbar: true,
        autoHideMenuBar: true,
        movable: false,
        resizable: false,
        enableLargerThanScreen: true,
        hasShadow: false,
        show: false,
        thickFrame: false,
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false
        }
      });
      captureWin.setVisibleOnAllWorkspaces(true);
      // captureWin.setFullScreenable(true);
      // 开发环境自动打开控制台
      if (isDevelopment) {
        //     // Load the url of the dev server if in development mode
        captureWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + pageName);
        // if (!process.env.IS_TEST) captureWin.webContents.openDevTools();
      } else {
        // createProtocol('app');
        // Load the index.html when not in development
        captureWin.loadURL(`app://./${pageName}.html`);
      }
      captureWin.on('show', () => {
        if (isMac()) captureWin.setSimpleFullScreen(true);
        captureWin.interval = setInterval(() => setFocus(captureWin), 100); // 监听光标位置
        captureWin.setAlwaysOnTop(false, 'screen-saver');
        setTimeout(() => captureWin.webContents.send('showCapture'));
      });
      captureWin.on('hide', () => {
        if (isMac()) captureWin.setSimpleFullScreen(false);
        if (captureWin.interval) {
          clearInterval(captureWin.interval);
          delete captureWin.interval;
        }
        captureWin.setBounds(captureWin.bounds);
        let index = fakeWins.indexOf(captureWin);
        if (index !== -1) fakeWins.splice(index, 1);
        if (fakeWins.length) this.close("hide");
        else if (targetWin.captureType === 'minimum') {
          targetWin.restore();
          delete targetWin.captureType;
        }
        setTimeout(() => captureWin.webContents.send('hideCapture'));
      });
      captureWin.on('closed', () => {
        let index = captureWins.indexOf(captureWin);
        if (index !== -1) captureWins.splice(index, 1);
        if (captureWins.length) this.close("refresh");
        else isForceClose ? console.log('强制关闭截图进程') : setTimeout(() => this.init(), 2000);
      });
      captureWin.bounds = display.bounds;
      return captureWin;
    });
    // 监听系统休眠/激活
    powerMonitor.on('resume', function () {
      console.log('The system is going to resume');
      // 通知渲染进程
      captureWins.forEach((win) => win.webContents.send('systemResumed'));
    });
  },
  start (type) {
    targetWin.captureType = type;
    if (isMac() && targetWin.isFullScreen()) {
      targetWin.needCapture = true;
      targetWin.setFullScreen(false);
      return;
    }
    if (type === 'minimum') {
      targetWin.minimize();
      return;
    }
    showCaptureWins();
  },
  prepareClose () {
    captureWins.forEach((win) => win.webContents.send('closeCapture'));
  },
  close (status) {
    switch (status) {
    case 'refresh':
      if (captureWins.length) captureWins[captureWins.length - 1].destroy();
      break;
    case 'hide': {
      if (!fakeWins.length) fakeWins = captureWins.slice();
      let win = fakeWins[0];
      win.hide();
      break;
    }
    default:
      isForceClose = true;
      if (captureWins.length) captureWins.forEach((win) => win.destroy());
      break;
    }
  }
};
