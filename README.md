# electron-vue-screen-capture
[![NPM version](https://img.shields.io/npm/v/electron-vue-screen-capture.svg?sanitize=true)](https://www.npmjs.com/package/electron-vue-screen-capture)
[![Downloads](https://img.shields.io/npm/dm/electron-vue-screen-capture.svg)](http://badge.fury.io/js/electron-vue-screen-capture)
<p>a demo for screen capture base on electron & vue</p>
<div>
<img src="https://raw.githubusercontent.com/youngerheart/electron-vue-screen-capture/master/static/screenCapture.png" title="electron-vue-screen-capture" width="160px">
</div>

## usage
```js
// install
npm install electron-vue-screen-capture -S

// use
import { init, start, close, targetWin } from 'electron-vue-screen-capture/src/main/modules/screenCapture.js'
// initial render process
init(win) // your BrowserWindow

// after clicked a btn，show capture window
start(type) // type 'minimum' will hide the targetWin

// after capture finished
ipcMain.on('getCaptureData', (e, obj) => {
  if (typeof obj !== 'object' || obj === null) return;
  targetWin.send('getCaptureData', data);
});

// close capture manual
close(type)
// type 'refresh' will exit capture's windows and restart
// type 'hide' will hide capture's windows
// otherwise force destory capture's windows
```

## downloads
[single version](https://github.com/youngerheart/electron-vue-screen-capture/releases)

## develop
```js
npm i
npm run serve
```

## mainly achieved features

1. tested and could be used in electron 8.x ~ 9.X (chromium 80 ~ 83)
2. support mac & windows platform
3. get mac's screenCapture promission automatically (after macOS 10.15)
4. support only fullscreen's capture, window's capture was not supported

## optimize
