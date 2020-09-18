# electron-vue-screen-capture
<a href="https://www.npmjs.com/package/web-node-server"><img src="https://img.shields.io/npm/v/electron-vue-screen-capture.svg?sanitize=true" alt="Version"></a>
<p>a demo for screen capture base on electron & vue</p>
<div>
<img src="https://raw.githubusercontent.com/youngerheart/electron-vue-screen-capture/master/static/screenCapture.png" title="electron-vue-screen-capture" width="160px">
</div>

## usage
```js
// install
npm install electron-vue-screen-capture -S

// config vue.config.js
module.exports = {
  publicPath: '.',
  pluginOptions: {
    electronBuilder: {
      externals: ['electron-vue-screen-capture']
    }
  }
}

// use
import { init, start, prepareClose, close } from 'electron-vue-screen-capture/src/main/modules/screenCapture.js'
```

## downloads
[download link](https://github.com/youngerheart/electron-vue-screen-capture/releases)

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
