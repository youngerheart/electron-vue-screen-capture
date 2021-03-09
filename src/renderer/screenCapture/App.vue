<template>
  <div class="capture" id="capture" draggable="false">
    <img ref="bg" v-show="showBg" draggable="false">
    <canvas class="editor"
      ref="editor"
      draggable="false"
      :style="{cursor: cursor}"
      @mousedown="move($event, 'start')"
      @mousemove="move($event, 'moving')"
      @mouseup="move($event, 'end')"/>
    <div v-show="cliped" class="info" :style="areaPosition(true)">{{`${clipArea.w}×${clipArea.h}`}}</div>
    <toolbar v-show="showToolbar" :style="areaPosition()" @ok="createImage" @cancel="close()"/>
    <a ref="download" :href="fileUrl" class="download" :download="fileName" @change="close()"></a>
  </div>
</template>
<script>
import { getScreen, handleStream, getDataUrl } from './capturer';
import toolbar from './components/Toolbar';
import crosshairImg from './assets/crosshair.png';

let hasTarget;
let cursorStr = `url(${crosshairImg}) 16 16, crosshair`;
// 开始截屏时原点
let origin = null;
let dragInfo = null;
// img(屏幕)大小
let size = null;
let ctx = null;
let range = 10;
let inArea = false;
let inRange = (origin, current) => {
  return origin[0] - range < current[0] && current[0] < origin[0] + range && origin[1] - range < current[1] && current[1] < origin[1] + range;
};
let fillNum = 0;
// 最终截屏区域
let getClipAreaCursor = (point, clipArea) => {
  if (!clipArea.w || !point) return cursorStr;
  let pointArr = Object.values(point);
  let  { x, y, w, h, origins } = clipArea;

  if (typeof origins === 'object') {
    for (let key in origins) {
      if (inRange(origins[key], pointArr)) {
        if (!inArea) {
          drawPoint(clipArea.origins);
          inArea = true;
        }
        return `${key}-resize`;
      }
    }
  }
  if (x - range < pointArr[0] && pointArr[0] < x + w + range && y - range < pointArr[1] && pointArr[1] < y + h + range) {
    if (!inArea) {
      drawPoint(clipArea.origins);
      inArea = true;
    }
    return 'move';
  }
  if (inArea) {
    draw(clipArea);
    inArea = false;
  }
  return cursorStr;
};

const draw = ({ x, y, w, h, origins }, cursor) => {
  // 清空之前的绘制
  ctx.clearRect(0, 0, size.width, size.height);
  //遮罩层
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.globalCompositeOperation = "source-over";
  ctx.fillRect(0, 0, size.width, size.height);
  //画框
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(x, y, w, h);
  //描边
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.closePath();
  // 拖动时要绘制顶点
  if (cursor && (cursor === 'move')) drawPoint(origins);
};

// 画顶点
const drawPoint = (origins) => {
  ctx.fillStyle = 'white';
  ctx.lineWidth = 1;
  if (typeof origins === 'object') {
    Object.values(origins).forEach((point) => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 4, 0, Math.PI*2, true);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    });
  }
};

function dataURLtoBlob (dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export default {
  data () {
    return {
      clipArea: {},
      cursor: 'none',
      showToolbar: false,
      showBg: false,
      fileUrl: null,
      fileName: null
    };
  },
  mounted () {
    this.init();
  },
  components: {
    toolbar
  },
  computed: {
    areaPosition () {
      return function (onTop) {
        let { x, y, w ,h } = this.clipArea;
        if (!w) return {};
        if (onTop) return { top: `${ y < 40 ? y + 6 : y - 32 }px`, left: `${ x + 6 }px` };
        let bottom = size.height - y - h;
        return { bottom: `${ bottom < 40 ? bottom + 6 : bottom - 32 }px`, right: `${ size.width - w - x + 6 }px` };
      };
    },
    cliped () {
      return typeof this.clipArea.w !== 'undefined';
    }
  },
  methods: {
    createImage () {
      this.$nextTick(() => {
        let imageUrl = getDataUrl(this.clipArea, size.width);
        if (!imageUrl) return;
        if (hasTarget) {
          this.close(imageUrl);
        } else {
          // download files
          this.fileUrl = URL.createObjectURL(dataURLtoBlob(imageUrl));
          this.fileName = `Capture-${Date.now()}.png`;
          this.$nextTick(() => this.$refs.download.click());
        }
      });
    },
    init () {
      let { editor, bg } = this.$refs;
      size = {
        width: editor.offsetWidth,
        height: editor.offsetHeight
      };
      bg.onload = () => {
        if (bg.src) this.showBg = true;
      };
      editor.width = size.width;
      editor.height = size.height;
      ctx = editor.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.strokeStyle= '#105cfb';
      let screen = this.$ipc.getCurrentScreen();
      getScreen(screen).then(() => {
        this.$ipc.setWindow('open', { name: 'screenCapture', type: 'single' });
      });
      // 系统唤醒/解锁屏幕后重新获取视频流
      this.$ipc.registerIpcEvent('screenReload', () => {
        getScreen(screen);
      });
      // 在显示后再截图
      this.$ipc.registerIpcEvent('showCapture', (target) => {
        hasTarget = target;
        handleStream().then((imageUrl) => {
          //遮罩层
          ctx.globalCompositeOperation = "source-over";
          if (fillNum < 1) {
            ctx.fillRect(0, 0, size.width, size.height);
            bg.src = imageUrl;
            bg.width = size.width;
            fillNum++;
            this.cursor = cursorStr;
          }
        });
      });
      this.$ipc.registerIpcEvent('focusCapture', () => {
        this.cursor = cursorStr;
        this.$nextTick(() => this.$refs.editor.click());
      });
      // 在按esc后做关闭前准备
      this.$ipc.registerIpcEvent('closeCapture', this.close);
    },
    close (imageUrl) {
      this.showBg = false;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.clearRect(0, 0, size.width, size.height);
      if (fillNum > 0) fillNum--;
      origin = null;
      this.clipArea = {};
      this.showToolbar = false;
      this.cursor = 'none';
      if (hasTarget) {
        this.$ipc.sendResult(imageUrl || false);
      } else setTimeout(() => this.$ipc.setWindow('close', {name: 'screenCapture', type: 'hide'}), 100);
    },
    move ({ offsetX, offsetY }, key) {
      if (!this.showBg) return;
      if (key === 'start') {
        if (origin) {
          origin = null;
          // 显示确认框
          if (this.cliped) this.showToolbar = true;
          return;
        }
        this.showToolbar = false;
        origin = {
          x: offsetX,
          y: offsetY
        };
        if (this.cursor === 'move') {
          dragInfo = {
            x: this.clipArea.x,
            y: this.clipArea.y
          };
        } else if (this.cursor.indexOf('url') === -1) {
          // clipArea变换原点
          let  { x, y, w, h } = this.clipArea;
          switch (this.cursor) {
          // 西北
          case 'nw-resize':
            y += h;
          case 'w-resize':
            x += w;
            break;
            // 东北
          case 'ne-resize':
          case 'n-resize':
            y += h;
            break;
            // 东南
            // case 'se-resize':
            // case 'e':
            //   break;
            // 西南
          case 'sw-resize':
          case 's':
            x += w;
            break;
          }
          origin = { x, y };
        }
      } else if (key === 'moving') {
        if (!origin) {
          this.cursor = getClipAreaCursor({ offsetX, offsetY }, this.clipArea);
          return;
        }
        let x, y, w, h;
        if (this.cursor === 'move') {
          x = offsetX - origin.x + dragInfo.x;
          y = offsetY - origin.y + dragInfo.y;
          w = this.clipArea.w;
          h = this.clipArea.h;
        } else {
          x = origin.x;
          y = origin.y;
          switch (this.cursor) {
          case 'w-resize':
          case 'e-resize':
            h = this.clipArea.h;
            break;
          case 'n-resize':
          case 's-resize':
            w = this.clipArea.w;
            break;
          }
        }
        if (!w) w = offsetX - x;
        if (!h) h = offsetY - y;
        let maxX = size.width - Math.abs(w);
        let maxY = size.height - Math.abs(h);
        x = w < 0 ? x + w : x;
        x = x < 0 ? 0 : x > maxX ? maxX : x;
        y = h < 0 ? y + h : y;
        y = y < 0 ? 0 : y > maxY ? maxY : y;
        w = Math.abs(w);
        h = Math.abs(h);
        // 计算各个定点
        let origins = {
          n: [x + w / 2, y],
          e: [x + w, y + h / 2],
          s: [x + w / 2, y + h],
          w: [x, y + h / 2],
          ne: [x + w, y],
          se: [x + w, y + h],
          sw: [x, y + h],
          nw: [x, y]
        };
        let clipArea = { x, y, w, h, origins };
        Object.keys(clipArea).forEach((key) => this.$set(this.clipArea, key, clipArea[key]));
        draw(this.clipArea, this.cursor);
      } else if (key === 'end') {
        origin = null;
        // 显示确认框
        if (this.cliped) this.showToolbar = true;
      }
    }
  }
};
</script>

<style lang="scss">
  html, body, .capture {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    height: 100%;
    cursor: none;
    overflow: hidden;
    -webkit-user-select: none;
    -webkit-app-region: no-drag;
  }

  .bg, .editor {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: none;
  }

  .bg {
    z-index: 1;
  }

  .editor {
    background-color: transparent;
    z-index: 2;
    resize: both;
    overflow:auto;
    user-select:none;
  }

  .info {
    position: absolute;
    color: #ffffff;
    font-size: 12px;
    background: rgba(40, 40, 40, 0.8);
    padding: 5px 10px;
    border-radius: 2px;
    font-family: Arial Consolas sans-serif;
    z-index: 3;
  }

  .download {
    display: none;
  }
</style>
