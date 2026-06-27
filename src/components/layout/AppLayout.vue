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
  Moon,
  PiggyBank,
  ReceiptText,
  Settings,
  Shapes,
  Target,
  UserRound,
  WalletCards
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import GlobalSearch from '@/components/navigation/GlobalSearch.vue'
import ToastStack from '@/components/notifications/ToastStack.vue'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { toggleTheme } = useTheme()

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
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark"><PiggyBank :size="20" /></span>
        <span>Gestion dépense</span>
      </RouterLink>

      <nav class="nav-list" aria-label="Navigation principale">
        <RouterLink v-for="link in links" :key="link.to" class="nav-link" :to="link.to">
          <component :is="link.icon" aria-hidden="true" />
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <h1>{{ pageTitle }}</h1>
        <div class="topbar-actions">
          <GlobalSearch />
          <button class="btn icon-btn" type="button" title="Changer le thème" @click="toggleTheme">
            <Moon :size="18" />
          </button>
          <RouterLink class="btn primary" to="/expenses/new">
            <Flag :size="18" />
            <span>Ajouter</span>
          </RouterLink>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
    <ToastStack />
  </div>
</template>
