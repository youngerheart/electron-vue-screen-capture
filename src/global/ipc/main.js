import { ipcMain } from 'electron';

import ScreenCapture from '@/main/modules/screenCapture';

export const ipc = {
  init () {
    this.registerOpen();
    this.registerClose();
  },
  // 注册打开事件
  registerOpen () {
    ipcMain.on('open', (event, { name, type }) => {
      if (name === 'screenCapture') ScreenCapture.start(type);
    });
  },
  // 注册关闭事件
  registerClose () {
    ipcMain.on('close', (event, {type, name}) => {
      if (name && name === 'screenCapture')  type === 'hide' ? ScreenCapture.close(type) : ScreenCapture.prepareClose();
    });
  }
};
