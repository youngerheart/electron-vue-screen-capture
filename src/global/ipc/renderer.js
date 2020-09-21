import { ipcRenderer, remote } from 'electron';
let currentWindow = remote.getCurrentWindow();

export const ipc = {
  registerIpcEvent (eventName, callback) {
    ipcRenderer.on(`${eventName}`, (event, ...args) => {
      callback(...args);
    });
  },
  /**
   * 设置窗口
   */
  setWindow (method, options) {
    ipcRenderer.send(method, options);
  },
  getCurrentScreen () {
    let { x, y } = currentWindow.getBounds();
    return remote.screen.getAllDisplays().filter((d) => d.bounds.x === x && d.bounds.y === y)[0];
  },
  sendResult (data) {
    ipcRenderer.send('getCaptureData', data);
  }
};
