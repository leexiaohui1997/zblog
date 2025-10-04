// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: [
    '~/assets/styles/base.scss'
  ],
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
        rootValue: 100,
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
