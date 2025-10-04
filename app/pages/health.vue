<template>
  <section class="health">
    <h1 class="title">连接健康检查</h1>
    <div v-if="pending">加载中...</div>
    <div v-else>
      <p>
        <strong>MySQL：</strong>
        <span :class="statusClass(mysql.ok)">{{ mysql.ok ? '正常' : '异常' }}</span>
        <span v-if="mysql.error" class="error">（{{ mysql.error }}）</span>
      </p>
      <p>
        <strong>Redis：</strong>
        <span :class="statusClass(redis.ok)">{{ redis.ok ? '正常' : '异常' }}</span>
        <span v-if="redis.error" class="error">（{{ redis.error }}）</span>
      </p>
      <small>更新时间：{{ timestamp }}</small>
    </div>
    <button @click="fetchStatus" class="btn">重新检查</button>
  </section>
  
</template>

<script setup lang="ts">
// 使用 SSR 获取数据，确保首屏 HTML 与客户端初始渲染一致
type HealthItem = { ok: boolean; error?: string }
type HealthResponse = { mysql: HealthItem; redis: HealthItem; timestamp: string }

const { data, pending, error, refresh } = await useFetch<HealthResponse>('/api/health', {
  server: true,
  default: () => ({ mysql: { ok: false }, redis: { ok: false }, timestamp: '' })
})

const mysql = computed(() => data.value?.mysql ?? { ok: false })
const redis = computed(() => data.value?.redis ?? { ok: false })
const timestamp = computed(() => data.value?.timestamp ?? '')

function statusClass(ok: boolean) { return ok ? 'ok' : 'bad' }
function fetchStatus() { return refresh() }
</script>

<style lang="scss" scoped>
@use "~/assets/styles/mixins" as *;
@use "~/assets/styles/variables" as *;

.health {
  padding: 16px;
}

.sidebar {
  padding: 16px;
  border: 1px solid $color-border;
  border-radius: 8px;
}

.title { margin-bottom: 12px; }

.btn {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: 6px;
  background: transparent;
}

.ok { color: #0a0; }
.bad { color: #c00; }
.error { color: #c00; }

</style>