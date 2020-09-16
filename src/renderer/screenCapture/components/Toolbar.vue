<template>
  <div class="toolbar">
    <!-- <div class="iconfont icon-reset"></div>
    <div class="iconfont icon-download"></div> -->
    <div class="iconfont icon-cancel" @click="$emit('cancel')"></div>
    <div class="iconfont icon-ok" @click="$emit('ok')"></div>
  </div>
</template>

<script>

</script>

<style lang="scss" scoped>
  .toolbar {
    position: absolute;
    color: #f5f5f5;
    font-size: 12px;
    background-color: #343434;
    padding: 0;
    border-radius: 4px;
    // box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
    z-index: 2;
    align-items: center;
    display: flex;
    overflow: hidden;
  }

  .toolbar .iconfont {
    font-size: 20px;
    padding: 2px 5px;
    cursor: pointer;
    &:hover {
      background-color: #222;
      color: #105bf7;
    }
  }
</style>
