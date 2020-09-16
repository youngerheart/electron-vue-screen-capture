<template>
  <div>
    <button @click="startCapture">open capture</button>
    <div><img v-show="imgSrc" :src="imgSrc" alt="capture"></div>
  </div>
</template>
<script>
let isOpenScreenCapture = false;

export default {
  data () {
    return {
      imgSrc: ''
    };
  },
  created () {
    // 监听截屏快捷键
    this.$ipc.registerIpcEvent('openScreenCapture', () => {
      if (!isOpenScreenCapture) this.startCapture();
    });
    // 监听截屏数据
    this.$ipc.registerIpcEvent('getDataUrl', (dataUrl) => {
      console.log(dataUrl);
      this.imgSrc = dataUrl;
    });
  },
  methods: {
    startCapture (type) {
      this.$ipc.setWindow('open', { name: 'screenCapture', type });
    }
  }
};
</script>
