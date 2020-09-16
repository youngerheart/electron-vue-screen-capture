import { ipcMain } from 'electron';

import ScreenCapture from '@/main/modules/screenCapture';
import { window } from '@/main/modules/windows';

export const ipc = {
  init () {
    this.registerOpen();
    this.registerClose();
    this.registerRendererEvent();
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
      console.log(type, name);
      if (!name) return;
      if (name === 'screenCapture')  type === 'hide' ? ScreenCapture.close(type) : ScreenCapture.prepareClose();
      else window.renderes[name] && window.renderes[name].close();
      if (type == 'reload') {
        setTimeout(() => {
          window.createWindow(name, 'entrance');
        }, 500);
      }
    });
  },
  // 注册渲染进程间传值
  registerRendererEvent () {
    ipcMain.on('sendData', (e, obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      let { name, event, data } = obj;
      window.renderes[name] && window.renderes[name].webContents.send(event, data);
    });
  },
};
