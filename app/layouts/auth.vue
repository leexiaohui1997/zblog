<template>
  <div class="min-h-svh bg-gray-100 px-4 py-10 flex items-center justify-center">
    <AuthCard :title="projectName" :logo-src="logoSrc" :show-nav="true">
      <slot />
    </AuthCard>
  </div>
  
</template>

<script setup lang="ts">
import logoUrl from '~/assets/images/logo.svg'

const { public: { projectName } } = useRuntimeConfig()
const logoSrc = logoUrl
</script>
