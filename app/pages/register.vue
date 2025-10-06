<template>
  <UForm :state="state" class="space-y-4">
    <UFormField>
      <template #label>
        <span class="text-red-500">*</span>
        邮箱
      </template>
      <EmailInput v-model="state.email" scene="register" />
    </UFormField>

    <UFormField>
      <template #label>
        <span class="text-red-500">*</span>
        验证码
      </template>
      <UInput v-model="state.code" placeholder="六位数字验证码" class="w-full" />
    </UFormField>

    <UFormField>
      <template #label>
        <span class="text-red-500">*</span>
        密码
      </template>
      <PasswordInput v-model="state.password" placeholder="至少 8 位，需包含字母与数字" class="w-full" />
    </UFormField>

    <UFormField label="昵称（可选）">
      <UInput v-model="state.nickname" placeholder="2–32 字符，支持中英文、数字、下划线、短横线" class="w-full" />
    </UFormField>

    <div class="flex justify-center">
      <UButton color="primary" :loading="submitting" @click="onSubmit">
        提交注册
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import EmailInput from '~/components/EmailInput.vue'
import PasswordInput from '~/components/PasswordInput.vue'

definePageMeta({ layout: 'auth' })

const toast = useToast()

const state = reactive({
  email: '',
  code: '',
  password: '',
  nickname: ''
})

const submitting = ref(false)

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
      toast.add({ title: '注册成功', description: '请登录', color: 'success' })
      await navigateTo('/login')
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