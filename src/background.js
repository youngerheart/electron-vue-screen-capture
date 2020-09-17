'use strict';

import { app, protocol } from 'electron';
import ScreenCapture from '@/main/modules/screenCapture';
import { ipc } from '@/global/ipc/main';
import { isMac } from '@/main/util.js';

if (!isMac()) {
  app.commandLine.appendSwitch('high-dpi-support', 1);
  app.commandLine.appendSwitch('force-device-scale-factor', 1);
}

// Scheme must be registered before the app is ready
// 解除chrome对http访问下一些js方法的限制，如navigator.mediaDevices
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    ScreenCapture.start();
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  ScreenCapture.start();
});

app.on('ready', async () => {
  // 创建渲染窗口
  ScreenCapture.init();
  // 初始化主进程IPC
  ipc.init();
});

app.allowRendererProcessReuse = true;
