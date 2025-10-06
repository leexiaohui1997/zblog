<template>
  <UInput
    :type="visible ? 'text' : 'password'"
    :model-value="modelValue"
    @update:modelValue="onUpdate"
    :placeholder="placeholder"
    :disabled="disabled"
    :name="name"
    :id="id"
    :autocomplete="autocomplete || 'current-password'"
    :ui="{ trailing: 'pe-1' }"
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        :aria-pressed="visible"
        :aria-controls="id || 'password'"
        @click="visible = !visible"
      >
        <Icon :name="visible ? 'lucide:eye' : 'lucide:eye-off'" />
      </UButton>
    </template>
  </UInput>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  autocomplete?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const visible = ref(false)

function onUpdate(val: string) {
  emit('update:modelValue', val)
}
</script>
