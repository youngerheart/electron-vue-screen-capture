const webpack = require('webpack');
const path = require('path');
const pages = require('./config/renderer');

let envPlugin = new webpack.DefinePlugin({
  'process.env.APPLEID': process.env.APPLEID,
  'process.env.APPLEIDPASS':process.env.APPLEIDPASS
});
// 禁止electron-builder签名: CSC_IDENTITY_AUTO_DISCOVERY=false

module.exports = {
  publicPath: '/',
  assetsDir: 'public',
  configureWebpack: (config) => {
    config.resolve.extensions =  ['.js', '.vue', '.node','.json', '.css' ];
  },
  chainWebpack: (config) => {
    config.resolve.alias.set('@', path.resolve('src'))

    config.plugins.delete('preload'); // TODO: need test
    config.plugins.delete('prefetch'); // TODO: need test
    config.plugin('global-env').use(envPlugin);

    // svg配置
    config.module
      .rule('svg')
      .exclude.add(path.resolve('src/global/images/icons'))
      .end();
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(path.resolve('src/global/images/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end();

    // babel-loader配置
    config.module.rule('compile')
      .exclude.add(/node_modules/)
      .end()
      .test(/\.js$/)
      .use('babel-loader')
      .loader(require.resolve('babel-loader'));

    // eslint-loader配置
    config.module
      .rule('eslint')
      .use('eslint-loader')
      .loader('eslint-loader')
      .tap((options) => {
        options.formatter = require('eslint-friendly-formatter');
        options.emitWarning = false;
        options.fix = true;
        return options;
      });
  },
  pages,
  pluginOptions: {
    // If you are using Yarn Workspaces, you may have multiple node_modules folders
    // List them all here so that VCP Electron Builder can find them
    nodeModulesPath: ['../../node_modules', './node_modules'],
    electronBuilder: {
      // mainProcessFile: 'src/background.js', // 更改主进程的入口
      mainProcessWatch: ['src/main/*/*.js'], // 默认情况下将添加您的主过程文件
      builderOptions: {
        appId: 'com.younger.app',
        productName: 'captureDemo', // 项目名，也是生成的安装文件名，即 vue-electron.exe
        copyright: 'Copyright © 2020', //版权信息
        directories: {
          output: 'build', // 输出文件路径
          buildResources: 'resources',
        },
        extraResources:[
          {
            from: 'static/',
            to: './'
          }
        ],
        mac: {
          icon: 'captureDemo.icns',
          hardenedRuntime: true, // hardened runtime 模式
          gatekeeperAssess: false,
          entitlements: 'resources/entitlements.mac.plist',
          entitlementsInherit: 'resources/entitlements.mac.plist',
          extendInfo: {
            NSMicrophoneUsageDescription: '请允许本程序访问您的麦克风',
            NSCameraUsageDescription: '请允许本程序访问您的摄像头'
          }
        },
        // afterSign: 'config/notarize.js', // 公证与盖章
        dmg: {
          sign: false,
          // background: 'resources/background.tiff',
          icon: 'captureDemo.icns', //注意格式
          contents: [{
            x: 410,
            y: 224,
            type: 'link',
            path: '/Applications'
          }, {
            x: 118,
            y: 224,
            type: 'file'
          }],
          window: {
            x: 100,  //窗口左上角起始坐标  
            y: 100,
            width: 530,
            height: 400
          }
        },
        win: {
          // 防止腾讯云SDK打包报错
          // extraFiles: [
          //   {
          //     from: 'node_modules/trtc-electron-sdk/build/Release',
          //     to: '.'
          //   }
          // ],
          // win 相关配置
          icon: 'resources/captureDemo.ico', // 图标，当前图标在根目录下，ico must be at least 256x256, 注意这里有两个坑
          requestedExecutionLevel: 'highestAvailable',  //安全级别
          target: [
            {
              target: 'nsis', // 利用nsis制作安装程序
              arch: [
                // 'x64', // 64位
                'ia32' // 32位 32位就足够
              ]
            }
          ],
          // verifyUpdateCodeSignature: false,
          // signingHashAlgorithms: [
          //   'sha256',
          //   'sha1'
          // ],
          // signDlls: true,
          // rfc3161TimeStampServer: "http://timestamp.digicert.com",
          // certificateFile: 'resources/sign.pfx',
          // certificatePassword: "bigClass007"
        },
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          perMachine: true, // 为所有用户安装
          menuCategory: false,
          allowToChangeInstallationDirectory: true, // 允许修改安装目录
          installerIcon: 'resources/captureDemo.ico', // 安装图标
          uninstallerIcon: 'resources/captureDemo.ico', //卸载图标
          license: 'resources/introdaction_win.txt',
          // installerHeaderIcon: './shanqis.ico', // 安装时头部图标
          createDesktopShortcut: 'always', // 创建桌面图标
          unicode: true,
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: 'captureDemo', // 图标名称
          deleteAppDataOnUninstall: true, // windows卸载时清除用户目录
          // include: 'config/win-protocol.nsh'
        },
        // for macOS - 用于在主机注册指定协议
        protocols: {
          name: 'capture',
          schemes: ['capture']
        },
        publish: [{
          provider: 'generic',  //手动提供
          url: '' //下载链接CDN
        }]
      }
    }
  }
};
