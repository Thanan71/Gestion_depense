<script setup lang="ts">
import { useSettingsStore } from '@/stores/useSettingsStore'

const settingsStore = useSettingsStore()

const widgets = [
  ['balance', 'Solde'],
  ['income', 'Revenus'],
  ['expenses', 'Dépenses'],
  ['budget', 'Budget'],
  ['chart', 'Graphiques'],
  ['recent', 'Dernières opérations'],
  ['goals', 'Objectifs'],
  ['alerts', 'Alertes'],
  ['subscriptions', 'Abonnements']
] as const
</script>

<template>
  <section class="grid">
    <section class="card pad">
      <div class="page-header">
        <div>
          <h1>Paramètres</h1>
          <p class="muted">Devise, langue, thème, format de date, semaine et notifications.</p>
        </div>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Devise</span>
          <select v-model="settingsStore.settings.currency" class="select">
            <option value="EUR">€ Euro</option>
            <option value="USD">$ Dollar</option>
            <option value="GBP">£ Livre</option>
          </select>
        </label>
        <label class="field">
          <span>Langue</span>
          <select v-model="settingsStore.settings.locale" class="select">
            <option value="fr-FR">Français</option>
            <option value="en-US">English</option>
          </select>
        </label>
        <label class="field">
          <span>Thème</span>
          <select v-model="settingsStore.settings.theme" class="select">
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="auto">Auto</option>
          </select>
        </label>
        <label class="field">
          <span>Format de date</span>
          <input v-model="settingsStore.settings.dateFormat" class="input" />
        </label>
        <label class="field">
          <span>Premier jour de semaine</span>
          <select v-model.number="settingsStore.settings.weekStartsOn" class="select">
            <option :value="1">Lundi</option>
            <option :value="0">Dimanche</option>
          </select>
        </label>
      </div>
    </section>

    <section class="card pad">
      <div class="section-title">
        <h2>Notifications</h2>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Budget dépassé</span>
          <input v-model="settingsStore.settings.notifications.budgetExceeded" type="checkbox" />
        </label>
        <label class="field">
          <span>Nouvelle dépense</span>
          <input v-model="settingsStore.settings.notifications.newExpense" type="checkbox" />
        </label>
        <label class="field">
          <span>Objectif atteint</span>
          <input v-model="settingsStore.settings.notifications.goalReached" type="checkbox" />
        </label>
        <label class="field">
          <span>Abonnement demain</span>
          <input v-model="settingsStore.settings.notifications.subscriptionTomorrow" type="checkbox" />
        </label>
      </div>
    </section>

    <section class="card pad">
      <div class="section-title">
        <h2>Widgets dashboard</h2>
      </div>
      <div class="form-grid">
        <label v-for="[id, label] in widgets" :key="id" class="field">
          <span>{{ label }}</span>
          <input
            type="checkbox"
            :checked="(settingsStore.settings.dashboardWidgets ?? []).includes(id)"
            @change="settingsStore.toggleWidget(id)"
          />
        </label>
      </div>
    </section>
  </section>
</template>
