export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxt/icon'],
  css: [
    '~/assets/css/main.css',
    '~/assets/styles/base.scss'
  ],
  runtimeConfig: {
    public: {
      projectName: process.env.PROJECT_NAME
    }
  },
  ui: {
    fonts: false
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables" as *; @use "~/assets/styles/mixins" as *;'
        }
      }
    }
  },
  postcss: {
    plugins: {
      'postcss-pxtorem': {
        rootValue: 16,
        propList: ['*'],
        unitPrecision: 5,
        exclude: /node_modules/i
      }
    }
  },
  app: {
    head: {
      style: [
        {
          innerHTML: 'html:not(.rem-inited) { visibility: hidden; }'
        }
      ]
    }
  }
})
