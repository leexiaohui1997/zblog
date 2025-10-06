<template>
  <div class="w-full max-w-[600px] bg-white rounded-lg shadow-md p-6 mx-auto">
    <header class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3 min-w-0">
        <img :src="logoSrc" alt="logo" class="h-8 w-8" />
        <h1 class="text-lg font-semibold text-gray-800 truncate">{{ title }}</h1>
      </div>
      <nav v-if="showNav" class="flex items-center gap-2 text-sm">
        <NuxtLink to="/login" :class="loginLinkClass">登录</NuxtLink>
        <span class="text-gray-300">/</span>
        <NuxtLink to="/register" :class="registerLinkClass">注册</NuxtLink>
      </nav>
    </header>

    <div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string, logoSrc: string, showNav?: boolean }>()

const route = useRoute()
const isLogin = computed(() => route.path.startsWith('/login'))
const isRegister = computed(() => route.path.startsWith('/register'))

const baseLink = 'px-1.5 py-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
const activeLink = 'text-brand-600 font-medium'
const inactiveLink = 'text-gray-500 hover:text-brand-600'

const loginLinkClass = computed(() => `${baseLink} ${isLogin.value ? activeLink : inactiveLink}`)
const registerLinkClass = computed(() => `${baseLink} ${isRegister.value ? activeLink : inactiveLink}`)
</script>
