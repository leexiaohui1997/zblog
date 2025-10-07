<template>
  <div class="min-h-svh bg-gray-50 flex flex-col">
    <header class="layout-header">
      <div class="header-content">
        <div class="header-left">
          <img :src="logoSrc" alt="logo" class="header-logo" />
          <span class="header-title">{{ projectName }}</span>
        </div>
        <div class="header-right">
          <UButton
            class="menu-btn"
            variant="ghost"
            color="neutral"
            :aria-label="menuOpen ? '关闭菜单' : '打开菜单'"
            :aria-pressed="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <Icon :name="menuOpen ? 'lucide:x' : 'lucide:menu'" />
          </UButton>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-auto">
      <div class="layout-container">
        <main class="layout-main">
          <slot />
        </main>
        <aside class="layout-aside">
          <slot name="aside" />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import logoUrl from '~/assets/images/logo.svg'

const { public: { projectName } } = useRuntimeConfig()
const logoSrc = logoUrl
const menuOpen = ref(false)
</script>

<style lang="scss" scoped>
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.layout-header {
  background: #fff;
  border-bottom: 1px solid #eee;
}

.header-content {
  @include container;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @include desktop {
    height: 60px;
  }
  @include mobile {
    height: 50px;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  height: 28px;
  width: 28px;
}

.header-title {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.menu-btn {
  @include desktop {
    display: none;
  }
  @include mobile {
    display: inline-flex;
  }
}

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
