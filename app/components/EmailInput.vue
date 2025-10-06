<template>
  <div class="flex items-center gap-2">
    <UInput
      class="flex-1"
      :model-value="modelValue"
      @update:modelValue="val => emit('update:modelValue', val)"
      type="email"
      :placeholder="placeholder || '邮箱'"
      :disabled="disabled"
      v-bind="inputProps"
    />
    <UButton
      :loading="sendingCode"
      :disabled="disableRequestCode"
      @click="onRequestCode"
      v-bind="buttonProps"
    >
      {{ sendCodeLabel }}
    </UButton>
  </div>
 </template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
  scene?: 'register' | 'login'
  placeholder?: string
  disabled?: boolean
  inputProps?: Record<string, any>
  buttonProps?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'code-requested'): void
  (e: 'cooldown-change', val: Date | null): void
  (e: 'error', err: any): void
}>()

const toast = useToast()

const sendingCode = ref(false)
const cooldownUntil = ref<Date | null>(null)
const nowMs = ref(Date.now())
const timer = ref<number | null>(null)

const remainingSeconds = computed(() => {
  if (!cooldownUntil.value) return 0
  const diff = cooldownUntil.value.getTime() - nowMs.value
  return diff > 0 ? Math.ceil(diff / 1000) : 0
})

const validEmail = computed(() => {
  const email = props.modelValue || ''
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
})

const disableRequestCode = computed(() => {
  return !!props.disabled || sendingCode.value || remainingSeconds.value > 0 || !validEmail.value
})

const sendCodeLabel = computed(() => {
  return remainingSeconds.value > 0 ? `重新获取（${remainingSeconds.value}s）` : '获取验证码'
})

onMounted(() => {
  timer.value = window.setInterval(() => {
    nowMs.value = Date.now()
    if (cooldownUntil.value && nowMs.value >= cooldownUntil.value.getTime()) {
      cooldownUntil.value = null
      emit('cooldown-change', null)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer.value) window.clearInterval(timer.value)
})

async function onRequestCode() {
  if (!validEmail.value) {
    toast.add({ title: '邮箱格式不正确', description: '请检查输入', color: 'error' })
    return
  }
  try {
    sendingCode.value = true
    const scene = props.scene || 'register'
    const res: any = await $fetch(`/api/auth/${scene}/request-code`, {
      method: 'POST',
      body: { email: props.modelValue }
    })
    if (res?.ok) {
      toast.add({ title: '验证码已发送', description: '请查收邮件', color: 'success' })
      const cd = res?.cooldownUntil
      if (cd) {
        cooldownUntil.value = new Date(cd)
        emit('cooldown-change', cooldownUntil.value)
      }
      emit('code-requested')
    } else {
      toast.add({ title: '发送失败', description: String(res?.message || '请稍后重试'), color: 'error' })
      const cd = res?.error?.cooldownUntil || res?.cooldownUntil
      if (cd) {
        cooldownUntil.value = new Date(cd)
        emit('cooldown-change', cooldownUntil.value)
      }
      emit('error', res)
    }
  } catch (err: any) {
    toast.add({ title: '发送失败', description: String(err?.data?.message || err?.message || '请稍后重试'), color: 'error' })
    const cd = err?.data?.error?.cooldownUntil || err?.error?.cooldownUntil || err?.data?.cooldownUntil
    if (cd) {
      cooldownUntil.value = new Date(cd)
      emit('cooldown-change', cooldownUntil.value)
    }
    emit('error', err)
  } finally {
    sendingCode.value = false
  }
}

defineExpose({ requestCode: onRequestCode, remainingSeconds })
</script>