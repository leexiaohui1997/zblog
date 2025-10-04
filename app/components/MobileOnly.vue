<template>
  <div class="mobile-only">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use "~/assets/styles/mixins" as *;

.mobile-only {
  display: block;
}
@include desktop {
  .mobile-only {
    display: none !important;
  }
}
</style>
