<template>
  <UForm :state="state">
    <UFormField label="邮箱">
      <div class="flex items-center gap-2">
        <UInput class="flex-1" v-model="state.email" type="email" placeholder="邮箱" />
        <UButton :loading="sendingCode" :disabled="disableRequestCode" @click="onRequestCode">
          {{ sendCodeLabel }}
        </UButton>
      </div>
    </UFormField>

    <UFormField label="验证码">
      <UInput v-model="state.code" placeholder="六位数字验证码" />
    </UFormField>

    <UFormField label="密码">
      <UInput v-model="state.password" type="password" placeholder="至少 8 位，需包含字母与数字" />
    </UFormField>

    <UFormField label="昵称（可选）">
      <UInput v-model="state.nickname" placeholder="2–32 字符，支持中英文、数字、下划线、短横线" />
    </UFormField>

    <div>
      <UButton color="primary" :loading="submitting" @click="onSubmit">
        提交注册
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'

const toast = useToast()

const state = reactive({
  email: '',
  code: '',
  password: '',
  nickname: ''
})


const sendingCode = ref(false)
const submitting = ref(false)
const cooldownUntil = ref<Date | null>(null)
const timer = ref<number | null>(null)

const remainingSeconds = computed(() => {
  if (!cooldownUntil.value) return 0
  const ms = cooldownUntil.value.getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 1000) : 0
})

const disableRequestCode = computed(() => sendingCode.value || remainingSeconds.value > 0)
const sendCodeLabel = computed(() => {
  return remainingSeconds.value > 0 ? `重新获取（${remainingSeconds.value}s）` : '获取验证码'
})

onMounted(() => {
  timer.value = window.setInterval(() => {
    // 触发 remainingSeconds 计算
    if (cooldownUntil.value && remainingSeconds.value <= 0) {
      cooldownUntil.value = null
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer.value) window.clearInterval(timer.value)
})

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validateFirst(): string | null {
  if (!validateEmail(state.email)) {
    return '邮箱格式不正确'
  }
  if (!/^\d{6}$/.test(state.code)) {
    return '验证码需为 6 位数字'
  }
  const pwd = state.password.trim()
  const hasLetter = /[A-Za-z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  if (pwd.length < 8 || !hasLetter || !hasDigit) {
    return '密码至少 8 位，需包含字母与数字'
  }
  const nk = state.nickname.trim()
  if (nk) {
    if (nk.length < 2 || nk.length > 32 || !/^[A-Za-z0-9_\-\u4e00-\u9fa5]+$/.test(nk)) {
      return '昵称需为 2–32 字符，可含中英文、数字、下划线、短横线'
    }
  }
  return null
}

function showError(err: any, fallback = '请求失败') {
  const message = err?.data?.message || err?.message || fallback
  toast.add({ title: '错误', description: String(message), color: 'error' })
}

async function onRequestCode() {
  if (!validateEmail(state.email)) {
    toast.add({ title: '邮箱格式不正确', description: '请检查输入', color: 'error' })
    return
  }
  try {
    sendingCode.value = true
    const res: any = await $fetch('/api/auth/register/request-code', {
      method: 'POST',
      body: { email: state.email }
    })
    if (res?.ok) {
      toast.add({ title: '验证码已发送', description: '请查收邮件', color: 'success' })
      if (res.cooldownUntil) {
        cooldownUntil.value = new Date(res.cooldownUntil)
      }
    } else {
      toast.add({ title: '发送失败', description: String(res?.message || '请稍后重试'), color: 'error' })
    }
  } catch (err: any) {
    showError(err, '发送失败')
  } finally {
    sendingCode.value = false
  }
}

async function onSubmit() {
  const firstError = validateFirst()
  if (firstError) {
    toast.add({ title: '表单校验失败', description: firstError, color: 'error' })
    return
  }
  try {
    submitting.value = true
    const res: any = await $fetch('/api/auth/register/complete', {
      method: 'POST',
      body: {
        email: state.email,
        code: state.code,
        password: state.password,
        nickname: state.nickname || undefined
      }
    })
    if (res?.ok) {
      toast.add({ title: '注册成功', description: `用户ID：${res.userId}`, color: 'success' })
      // 可选：清空表单
      // state.code = ''
      // state.password = ''
    } else {
      toast.add({ title: '注册失败', description: String(res?.message || '请稍后再试'), color: 'error' })
    }
  } catch (err: any) {
    showError(err, '注册失败')
  } finally {
    submitting.value = false
  }
}
</script>