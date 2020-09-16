import { getScreenAccess } from '@/global/libs/tools';

let stream = null;
let canvas = document.createElement('canvas');
let ctx = null;
let clipCanvas = document.createElement('canvas');

export function getDataUrl ({ x, y, w, h }, width) {
  let ratio = canvas.width / width;
  w *= ratio;
  h *= ratio;
  clipCanvas.width = w;
  clipCanvas.height = h;
  var data = ctx.getImageData(x * ratio, y * ratio, w, h);
  var context = clipCanvas.getContext('2d');
  context.putImageData(data, 0, 0);
  return clipCanvas.toDataURL('image/png');
}

export function handleStream () {
  return new Promise((resolve, reject) => {
    let video = document.createElement('video');
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      // 只能先生成全屏图片再截取
      video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      video.pause();
      video = null;
      resolve(canvas.toDataURL('image/png'));
    };
    video.onerror = reject;
  });
}

function handleError (e) {
  console.error(e);
  // exit
}

export function getScreen (curScreen) {
  return new Promise((resolve) => {
    getScreenAccess().then((sources) => {
      let selectSource = sources.filter((source) => source.display_id + '' === curScreen.id + '')[0];
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectSource ? selectSource.id : 'screen:0:0',
            minWidth: 1280,
            minHeight: 720,
            maxWidth: 8000,
            maxHeight: 8000
          },
        }
      }).then((currentStream) => {
        stream = currentStream;
        resolve();
      }).catch(handleError);
    });
  });
}
