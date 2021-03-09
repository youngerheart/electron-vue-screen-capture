import path from 'path';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import { app, BrowserWindow, screen, powerMonitor, globalShortcut, systemPreferences, dialog } from 'electron';
import { isMac } from '../util';
import { isDev } from '../../global/libs/tools';
// import packageInfo from '../../../package.json';

let pageName = 'screenCapture';
let captureWins = [];
let fakeWins = [];
function showCaptureWins () {
  captureWins.forEach((win) => {
    if (!win.isVisible()) {
      win.showInactive();
    }
    win.shouldClose = false;
  });
}

let setFocus = (captureWin) => {
  if (captureWin.isDestroyed()) return;
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
  targetWin: null,
  init (win) {
    if (win) {
      this.targetWin = win;
      this.targetWin.on('minimize', () => {
        if (this.targetWin.captureType === 'minimum') {
          setTimeout(showCaptureWins, 1000);
        }
      });
    }
    if (captureWins.length) return false;

    screen.on('display-added', () => this.close('refresh'));
    screen.on('display-removed', () => this.close('refresh'));

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
      if (isDev) {
        // Load the url of the dev server if in development mode
        captureWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + pageName);
        // if (!process.env.IS_TEST) captureWin.webContents.openDevTools();
      } else {
        let link;
        // 引入版本
        try {
          link = require.resolve(`electron-vue-screen-capture/dist_electron/bundled/${pageName}.html`);
          if (!isNaN(link)) {
            let filePath;
            if(isMac()) {
              filePath = path.join(path.dirname(app.getPath('exe')), `../resources/`);
            } else {
              filePath = path.join(path.dirname(app.getPath('exe')), `/resources/`);
            }
            link = `file://${path.resolve(filePath, 'screen-capture/screenCapture.html')}`;
          } else link = `file://${path.resolve(process.cwd(), link)}`;
        } catch (err) {
          // 独立版本
          createProtocol('app');
          link = `app://./${pageName}.html`;
        }
        console.info('load entry file: ', link);
        captureWin.loadURL(link);
      }
      captureWin.on('show', () => {
        if (isMac()) captureWin.setSimpleFullScreen(true);
        captureWin.interval = setInterval(() => setFocus(captureWin), 100); // 监听光标位置
        captureWin.setAlwaysOnTop(true, 'screen-saver');
        setTimeout(() => captureWin.webContents.send('showCapture', !!this.targetWin));
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
        if (fakeWins.length) this.close('hide');
        else if (this.targetWin && this.targetWin.captureType === 'minimum') {
          this.targetWin.restore();
          delete this.targetWin.captureType;
        }
        setTimeout(() => captureWin.webContents.send('hideCapture'));
      });
      captureWin.on('closed', () => {
        let index = captureWins.indexOf(captureWin);
        if (index !== -1) captureWins.splice(index, 1);
        if (captureWins.length) this.close("refresh");
        else isForceClose ? console.log('强制关闭截图进程') : setTimeout(() => this.init(), 2000);
      });
      captureWin.on('focus', () => {
        globalShortcut.register('Esc', this.prepareClose);
      });
      captureWin.on('blur', () => {
        globalShortcut.unregister('Esc');
      });
      captureWin.bounds = display.bounds;
      // 下载事件
      if (!this.targetWin) {
        captureWin.webContents.session.on('will-download', (event, item) => {
          item.once('done', () => this.close('hide'));
        });
      }
      // captureWin.webContents.session.on('spellcheck-dictionary-download-success', () => this.close())
      return captureWin;
    });
    // 监听系统休眠/激活
    powerMonitor.on('resume', function () {
      console.info('The system is going to resume');
      // 通知渲染进程
      captureWins.forEach((win) => win.webContents.send('screenReload'));
    });
    // 监听屏幕解锁
    powerMonitor.on('unlock-screen', function () {
      console.info('The system is going to unlock-screen');
      // 通知渲染进程
      captureWins.forEach((win) => win.webContents.send('screenReload'));
    });
  },
  start (type) {
    if (this.targetWin) {
      if (type === 'single') return;
      this.targetWin.captureType = type;
      if (isMac()) {
        if (this.targetWin.isFullScreen()) {
          this.targetWin.needCapture = true;
          this.targetWin.setFullScreen(false);
          return;
        }
      }
      if (type === 'minimum') {
        this.targetWin.minimize();
        return;
      }
    }
    // tip for mac screenAuth
    if (isMac() && systemPreferences.getMediaAccessStatus('screen') !== 'granted') {
      if (this.targetWin) {
        this.targetWin.webContents.send('screenCaptureAuthFailed');
        return;
      }
      dialog.showMessageBox({
        type: 'info',
        title: 'permission denied',
        message: 'please open the screenCapture permission',//'请点击“重新进入”',
        buttons: ['ok'], // , '重新进入'
      }).then(() => {
        this.close();
      });
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
