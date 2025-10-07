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

    <!-- 移动端：遮罩与侧入弹层 -->
    <Transition name="overlay">
      <div
        v-if="menuOpen"
        class="drawer-overlay"
        role="button"
        aria-label="关闭菜单"
        @click="menuOpen = false"
      />
    </Transition>

    <Transition name="drawer">
      <aside
        v-if="menuOpen"
        class="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="移动端菜单"
      >
        <div class="drawer-header">
          <UButton
            class="drawer-close-btn"
            variant="ghost"
            color="neutral"
            :aria-label="'关闭菜单'"
            :aria-pressed="false"
            @click="menuOpen = false"
          >
            <Icon name="lucide:x" />
          </UButton>
        </div>
        <div class="drawer-body"></div>
      </aside>
    </Transition>

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

/* 遮罩（仅移动端显示） */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  @include desktop { display: none; }
  @include mobile { display: block; }
}

/* 遮罩过渡 */
.overlay-enter-active, .overlay-leave-active { transition: opacity .2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.overlay-enter-to, .overlay-leave-from { opacity: 1; }

/* 侧入弹层（仅移动端显示） */
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 300px;
  background: #fff;
  z-index: 50;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  @include desktop { display: none; }
  @include mobile { display: flex; }
}

/* 弹层过渡（右侧滑入） */
.drawer-enter-active, .drawer-leave-active { transition: transform .3s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
.drawer-enter-to, .drawer-leave-from { transform: translateX(0); }

.drawer-header {
  position: relative;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  border-bottom: 1px solid #f2f2f2;
}

.drawer-close-btn { display: inline-flex; }

.drawer-body {
  flex: 1 1 auto;
  /* 预留内容区域，暂不实现具体内容 */
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
