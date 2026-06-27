<script setup lang="ts">
import { Eye, EyeOff, LockKeyhole } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()
const mode = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const form = reactive({
  displayName: '',
  email: '',
  password: ''
})

const submit = async () => {
  if (authStore.loading) return

  const ok =
    mode.value === 'login'
      ? await authStore.login(form.email, form.password)
      : await authStore.register(form.email, form.password, form.displayName)

  if (ok) {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('gestion-depense:anonymous:')) {
        window.localStorage.removeItem(key)
      }
    }
    await router.push('/')
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="card pad auth-panel">
      <div class="brand" style="padding: 0 0 18px">
        <span class="brand-mark"><LockKeyhole :size="20" /></span>
        <span>Gestion dépense</span>
      </div>

      <div class="section-title">
        <h1>{{ mode === 'login' ? 'Connexion' : 'Créer un compte' }}</h1>
      </div>

      <form class="grid" @submit.prevent="submit">
        <label v-if="mode === 'register'" class="field">
          <span>Nom</span>
          <input v-model="form.displayName" class="input" autocomplete="name" required />
        </label>
        <label class="field">
          <span>Email</span>
          <input v-model="form.email" class="input" autocomplete="email" type="email" required />
        </label>
        <label class="field">
          <span>Mot de passe</span>
          <span style="position: relative">
            <input
              v-model="form.password"
              class="input"
              :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              minlength="8"
              pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
              title="8 caractères minimum, avec au moins une lettre et un chiffre."
              :type="showPassword ? 'text' : 'password'"
              style="padding-right: 44px"
              required
            />
            <button
              class="btn icon-btn"
              type="button"
              :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              style="position: absolute; right: 1px; top: 1px; border: 0; box-shadow: none"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </span>
        </label>

        <p v-if="authStore.error" class="muted" style="color: var(--danger)">
          {{ authStore.error }}
        </p>

        <button class="btn primary" type="submit" :disabled="authStore.loading">
          {{
            authStore.loading
              ? 'Chargement...'
              : mode === 'login'
                ? 'Se connecter'
                : "S'inscrire"
          }}
        </button>
        <button
          class="btn"
          type="button"
          :disabled="authStore.loading"
          @click="mode = mode === 'login' ? 'register' : 'login'"
        >
          {{ mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte' }}
        </button>
      </form>
    </section>
  </main>
</template>
