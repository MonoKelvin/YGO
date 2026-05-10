import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import './assets/css/variables.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(naive)

window.addEventListener('error', (event) => {
  console.error('[window.error]', event.message, event.filename, event.lineno, event.colno)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason)
})

app.config.errorHandler = (err, instance, info) => {
  console.error('[vue-error-handler]', err, { componentName: instance?.$options?.name, info })
}

app.mount('#app')
