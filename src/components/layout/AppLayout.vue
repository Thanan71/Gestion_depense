<script setup lang="ts">
import {
  Banknote,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  FileText,
  Flag,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  ReceiptText,
  Settings,
  Shapes,
  Target,
  UserRound,
  WalletCards,
  X
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import GlobalSearch from '@/components/navigation/GlobalSearch.vue'
import ToastStack from '@/components/notifications/ToastStack.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/useAuthStore'

const route = useRoute()
const { toggleTheme } = useTheme()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const logout = async () => {
  await authStore.logout()
  window.location.href = '/login'
}

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Dépenses', icon: ReceiptText },
  { to: '/income', label: 'Revenus', icon: Banknote },
  { to: '/categories', label: 'Catégories', icon: Shapes },
  { to: '/accounts', label: 'Comptes', icon: PiggyBank },
  { to: '/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/statistics', label: 'Statistiques', icon: BarChart3 },
  { to: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { to: '/goals', label: 'Objectifs', icon: Target },
  { to: '/subscriptions', label: 'Abonnements', icon: CreditCard },
  { to: '/debts', label: 'Dettes', icon: CircleDollarSign },
  { to: '/reports', label: 'Rapports', icon: FileText },
  { to: '/settings', label: 'Paramètres', icon: Settings },
  { to: '/profile', label: 'Profil', icon: UserRound },
  { to: '/about', label: 'À propos', icon: Info }
]

const pageTitle = computed(
  () => links.find((link) => link.to === route.path)?.label ?? 'Gestion dépense'
)

const bottomLinks = links.filter((link) => ['/', '/expenses', '/budgets'].includes(link.to))

const isLinkActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>

<template>
  <div class="app-shell">
    <button
      class="mobile-menu-overlay mobile-only"
      :class="{ 'is-open': mobileMenuOpen }"
      type="button"
      aria-label="Fermer le menu"
      @click="mobileMenuOpen = false"
    />

    <aside class="sidebar" :class="{ 'is-open': mobileMenuOpen }">
      <div class="sidebar-header">
        <RouterLink class="brand" to="/">
          <span class="brand-mark"><PiggyBank :size="20" /></span>
          <span>Gestion dépense</span>
        </RouterLink>
        <button
          class="btn icon-btn mobile-only"
          type="button"
          title="Fermer le menu"
          aria-label="Fermer le menu"
          @click="mobileMenuOpen = false"
        >
          <X :size="18" />
        </button>
      </div>

      <RouterLink class="brand desktop-brand" to="/">
        <span class="brand-mark"><PiggyBank :size="20" /></span>
        <span>Gestion dépense</span>
      </RouterLink>

      <nav class="nav-list" aria-label="Navigation principale">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          class="nav-link"
          :class="{ 'is-active': isLinkActive(link.to) }"
          :to="link.to"
        >
          <component :is="link.icon" aria-hidden="true" />
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button
          class="btn icon-btn mobile-only"
          type="button"
          title="Menu"
          aria-label="Ouvrir le menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = true"
        >
          <Menu :size="18" />
        </button>
        <h1>{{ pageTitle }}</h1>
        <div class="topbar-actions">
          <GlobalSearch />
          <button class="btn icon-btn" type="button" title="Changer le thème" @click="toggleTheme">
            <Moon :size="18" />
          </button>
          <button class="btn icon-btn" type="button" title="Déconnexion" @click="logout">
            <LogOut :size="18" />
          </button>
          <RouterLink class="btn primary desktop-action" to="/expenses/new">
            <Flag :size="18" />
            <span>Ajouter</span>
          </RouterLink>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
    <nav class="mobile-bottom-nav mobile-only" aria-label="Navigation mobile">
      <RouterLink
        v-for="link in bottomLinks.slice(0, 2)"
        :key="link.to"
        class="bottom-nav-link"
        :class="{ 'is-active': isLinkActive(link.to) }"
        :to="link.to"
      >
        <component :is="link.icon" aria-hidden="true" />
        <span>{{ link.label }}</span>
      </RouterLink>
      <RouterLink
        class="bottom-nav-link add"
        :class="{ 'is-active': route.path === '/expenses/new' }"
        to="/expenses/new"
      >
        <Flag aria-hidden="true" />
        <span>Ajouter</span>
      </RouterLink>
      <RouterLink
        v-for="link in bottomLinks.slice(2)"
        :key="link.to"
        class="bottom-nav-link"
        :class="{ 'is-active': isLinkActive(link.to) }"
        :to="link.to"
      >
        <component :is="link.icon" aria-hidden="true" />
        <span>{{ link.label }}</span>
      </RouterLink>
      <button
        class="bottom-nav-link"
        type="button"
        aria-label="Ouvrir le menu"
        :aria-expanded="mobileMenuOpen"
        @click="mobileMenuOpen = true"
      >
        <Menu aria-hidden="true" />
        <span>Menu</span>
      </button>
    </nav>
    <ToastStack />
  </div>
</template>
