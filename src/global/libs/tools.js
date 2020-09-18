import { desktopCapturer } from 'electron';

// 获取屏幕权限
export function getScreenAccess () {
  return desktopCapturer.getSources({
    types: ['screen']
  });
}

// 获取开发环境
export const isDev = process.cwd().indexOf('electron-vue-screen-capture') !== -1 && process.env.WEBPACK_DEV_SERVER_URL;
