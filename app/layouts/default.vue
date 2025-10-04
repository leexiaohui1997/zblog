<template>
  <div class="layout-container">
    <main class="layout-main">
      <slot />
    </main>
    <aside class="layout-aside">
      <slot name="aside" />
    </aside>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.layout-container {
  @include container;

  // PC：左右布局
  @include desktop {
    display: flex;
    gap: $gap-desktop;
    align-items: flex-start;
  }

  // 移动端：垂直布局
  @include mobile {
    display: flex;
    flex-direction: column;
    gap: $gap-mobile;
  }
}

.layout-main {
  flex: 1 1 auto;
}

.layout-aside {
  @include desktop {
    width: $aside-width;
    flex: 0 0 $aside-width;
  }
  @include mobile {
    order: 2;
  }
}
</style>
