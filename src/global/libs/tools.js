import { desktopCapturer } from 'electron';

// 获取屏幕权限
export function getScreenAccess () {
  return desktopCapturer.getSources({
    types: ['screen']
  });
}
