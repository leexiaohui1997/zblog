<template>
  <section style="padding: 24px">
    <h1>连接健康检查</h1>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <p>
        <strong>MySQL：</strong>
        <span :style="statusStyle(mysql.ok)">{{ mysql.ok ? '正常' : '异常' }}</span>
        <span v-if="mysql.error" style="color:#c00">（{{ mysql.error }}）</span>
      </p>
      <p>
        <strong>Redis：</strong>
        <span :style="statusStyle(redis.ok)">{{ redis.ok ? '正常' : '异常' }}</span>
        <span v-if="redis.error" style="color:#c00">（{{ redis.error }}）</span>
      </p>
      <small>更新时间：{{ timestamp }}</small>
    </div>
    <button @click="fetchStatus" style="margin-top:12px">重新检查</button>
  </section>
  
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type HealthItem = { ok: boolean; error?: string }
type HealthResponse = {
  mysql: HealthItem
  redis: HealthItem
  timestamp: string
}

const loading = ref(true)
const mysql = ref<{ ok: boolean; error?: string }>({ ok: false })
const redis = ref<{ ok: boolean; error?: string }>({ ok: false })
const timestamp = ref('')

function statusStyle(ok: boolean) {
  return ok ? 'color:#0a0' : 'color:#c00'
}

async function fetchStatus() {
  loading.value = true
  try {
    const res = await $fetch<HealthResponse>('/api/health')
    mysql.value = res.mysql
    redis.value = res.redis
    timestamp.value = res.timestamp
  } catch (e: any) {
    mysql.value = { ok: false, error: String(e) }
    redis.value = { ok: false, error: String(e) }
  } finally {
    loading.value = false
  }
}

onMounted(fetchStatus)
</script>