<template>
  <UForm :state="state" class="space-y-4">
    <UFormField>
      <template #label>
        <span class="text-red-500">*</span>
        邮箱
      </template>
      <EmailInput
        v-model="state.email"
        scene="login"
      />
    </UFormField>

    <UFormField>
      <template #label>
        <span class="text-red-500">*</span>
        验证码
      </template>
      <UInput v-model="state.code" placeholder="验证码" class="w-full" />
    </UFormField>

    <UFormField>
      <template #label>
        <span class="text-red-500">*</span>
        密码
      </template>
      <PasswordInput v-model="state.password" placeholder="请输入密码" class="w-full" />
    </UFormField>

    <div class="flex justify-center">
      <UButton color="primary" :loading="submitting" :disabled="disableSubmit" @click="onSubmit" class="w-[100px] justify-center">
        登录
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import EmailInput from '~/components/EmailInput.vue'
import PasswordInput from '~/components/PasswordInput.vue'

definePageMeta({ layout: 'auth' })

const toast = useToast()
const route = useRoute()

const state = reactive({
  email: '',
  code: '',
  password: ''
})

const submitting = ref(false)

const validEmail = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(state.email)
})

const disableSubmit = computed(() => {
  return submitting.value || !validEmail.value || !/^\d{6}$/.test(state.code) || state.password.trim().length === 0
})

function showError(err: any, fallback = '请求失败') {
  const message = err?.data?.message || err?.message || fallback
  toast.add({ title: '错误', description: String(message), color: 'error' })
}

async function onSubmit() {
  if (!validEmail.value) {
    toast.add({ title: '邮箱格式不正确', description: '请检查输入', color: 'error' })
    return
  }
  if (!/^\d{6}$/.test(state.code)) {
    toast.add({ title: '表单校验失败', description: '验证码需为 6 位数字', color: 'error' })
    return
  }
  if (state.password.trim().length === 0) {
    toast.add({ title: '表单校验失败', description: '密码不能为空', color: 'error' })
    return
  }
  try {
    submitting.value = true
    const res: any = await $fetch('/api/auth/login/complete', {
      method: 'POST',
      body: {
        email: state.email,
        code: state.code,
        password: state.password
      }
    })
    if (res?.ok) {
      toast.add({ title: '登录成功', description: '正在跳转', color: 'success' })
      const redirect = String(route.query.redirect || '')
      await navigateTo(redirect || '/')
    } else {
      toast.add({ title: '登录失败', description: String(res?.message || '请稍后再试'), color: 'error' })
    }
  } catch (err: any) {
    showError(err, '登录失败')
  } finally {
    submitting.value = false
  }
}
</script>
