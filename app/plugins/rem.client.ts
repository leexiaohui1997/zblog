import { defineNuxtPlugin } from 'nuxt/app'

const BREAKPOINT = 960
const MOBILE_BASE = 375
const ROOT_REM = 16

function setRootFontSize() {
  const width = window.innerWidth
  const fontSize = width >= BREAKPOINT
    ? ROOT_REM
    : (width / MOBILE_BASE) * ROOT_REM
  document.documentElement.style.fontSize = `${fontSize}px`
  document.documentElement.classList.add('rem-inited')
}

export default defineNuxtPlugin(() => {
  setRootFontSize()
  window.addEventListener('resize', setRootFontSize)
  window.addEventListener('orientationchange', setRootFontSize)
})