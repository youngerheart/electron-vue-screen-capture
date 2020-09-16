/**
 * 渲染窗口创建模块
 */
import { BrowserWindow, Menu } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import { getStaticFilePath, isMac } from '@/main/util';
// import ScreenCapture from '@/main/modules/screenCapture';
const isDevelopment = process.env.WEBPACK_DEV_SERVER_URL;
const iconPath = getStaticFilePath('capture.png');

export const window = {
  renderes: {},
  pages: {},
  init (pages) {
    this.renderes = {};
    this.pages = pages;
    if (!isDevelopment) {
      this.setMenu('empty');
    } else {
      this.setMenu('resetReloadInBigClass');
    }
    for (const key in pages) {
      // eslint-disable-next-line no-prototype-builtins
      if (pages.hasOwnProperty(key)) {
        this.renderes[key] = null;
      }
    }
  },
  createWindow (pageName) {
    let config = Object.assign({}, this.pages[pageName].browserWindowConfig, {
      icon: iconPath,
      show: false,
      title: '截屏demo',
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false
      }
    });
    // 初始化渲染进程
    this.renderes[pageName] = new BrowserWindow(config);
    let mainWindow = this.renderes[pageName];
    // 开启窗口最大化配置
    if (this.pages[pageName].maximize) {
      mainWindow.maximize();
    }
    mainWindow.show();

    // 开发环境自动打开控制台
    if (isDevelopment) {
      // Load the url of the dev server if in development mode
      mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + pageName);
      if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
    } else {
      createProtocol('app');
      // Load the index.html when not in development
      mainWindow.loadURL(`app://./${pageName}.html`);
    }
    // 注册渲染进行事件回调
    this.initRenderesEvent(pageName);
  },
  /**
   * 设置默认菜单
   * @param {boolean} type
   */
  setMenu (type) {
    let mainMenu = [];
    switch (type) {
    case 'empty':
      if (isMac()) {
        mainMenu = [];
      } else {
        mainMenu = null;
      }
      break;
    case 'resetReloadInBigClass':
      mainMenu = [
        {
          label: 'Debuger',
          submenu: [
            {
              label: 'reload',
              accelerator: 'CmdOrCtrl+R',
              click: (item, focusedWindow) => {
                if (this.renderes['bigClass'] && this.renderes['bigClass'].id === focusedWindow.id) {
                  this.renderes['bigClass'].webContents.send('reloadRoom');
                } else {
                  focusedWindow.reload();
                }
              }
            },
            {role: 'forcereload'},
            {role: 'toggledevtools'},
            // 开发环境加入剪切复制粘贴
            {role: 'cut'},
            {role: 'copy'},
            {role: 'paste'},
          ]
        }
      ];
      break;
    default:
      mainMenu = [
        {
          label: 'Debuger',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' }
          ]
        }
      ];
      break;
    }
    if (mainMenu !== null) {
      mainMenu = Menu.buildFromTemplate(mainMenu);
    }
    Menu.setApplicationMenu(mainMenu);
  },
  /* 
  * 初始化渲染进程事件
   * @param {String} pageName 
   */
  initRenderesEvent (pageName) {
    let mainWindow = this.renderes[pageName];
    if (!mainWindow) {
      return;
    }
    this.renderes[pageName].on('closed', () => {
      console.log(`${pageName} 窗口已销毁`);
      // 销毁子窗口实例
      this.renderes[pageName] = null;
    });
  }
};
