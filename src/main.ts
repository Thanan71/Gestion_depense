import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import router from '@/router'
import { localPersistPlugin } from '@/services/storage/persist'

import '@/assets/styles.css'

const pinia = createPinia()
pinia.use(localPersistPlugin)

createApp(App).use(pinia).use(router).mount('#app')
