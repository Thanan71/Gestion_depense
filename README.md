# Gestion dépense

Application Vue 3 locale-first pour suivre dépenses, revenus, budgets, objectifs, abonnements,
dettes et statistiques. Le projet fonctionne d'abord en local avec `localStorage`; une couche de
services isole déjà le stockage pour ajouter plus tard Supabase, Firebase ou une API .NET.

## Stack

- Vue 3, Vite, TypeScript
- Pinia, Vue Router, VueUse, DayJS
- Chart.js
- Vitest, Playwright
- Biome
- PWA, prête pour Netlify

## Architecture

- `src/types` : contrats métier typés
- `src/stores` : stores Pinia par domaine
- `src/services` : stockage, sauvegarde, statistiques et futur sync
- `src/composables` : devise, thème, recherche, import/export et statistiques
- `src/components` : composants par contexte
- `src/pages` : routes applicatives lazy-loadées

## Fonctionnalités locales

- Dashboard configurable par widgets avec solde, revenus, dépenses, budget, graphiques, alertes,
  objectifs, abonnements et opérations récentes.
- CRUD local pour dépenses, revenus, catégories, comptes, budgets, objectifs, abonnements et dettes.
- Recherche globale sur opérations, budgets, objectifs, abonnements et dettes.
- Statistiques par période et par catégorie avec Chart.js.
- Calendrier consolidé dépenses, revenus, budgets, objectifs et abonnements.
- Export JSON, export CSV et import JSON.
- Notifications/toasts et thème clair/sombre/auto.
- PostgreSQL Netlify configuré côté serveur avec schéma SQL, healthcheck et endpoint résumé.

## Commandes

```bash
npm install
npm run dev
npm run build
npm run test:unit
npm run test:e2e
npm run lint
npm run format
npm run check
npm run db:health
npm run db:migrate
```

## PostgreSQL

Les chaînes de connexion restent côté serveur uniquement dans `.env` ou dans les variables
d'environnement Netlify. Elles ne doivent jamais être préfixées par `VITE_`, sinon Vite les expose
au navigateur.

- `DATABASE_READONLY_URL` : utilisée pour les healthchecks et lectures serverless.
- `DATABASE_URL` : utilisée pour les migrations et futures écritures.
- `database/schema.sql` : schéma principal.
- `netlify/functions/db-health.ts` : vérifie la connexion.
- `netlify/functions/summary.ts` : expose un résumé agrégé.

## Roadmap

1. Fondation : projet Vite, thème, layout, navigation, PWA.
2. Données : types, stores, persistance locale, sauvegarde JSON.
3. Fonctionnel : CRUD dépenses, revenus, catégories et comptes.
4. Analyse : dashboard, Chart.js, filtres et recherche.
5. Avancé : budgets, objectifs, abonnements, dettes.
6. Expérience : notifications, offline, import/export, dialogues et toasts.
7. Qualité : tests unitaires, E2E, accessibilité et performance.
8. Déploiement : variables d'environnement, Netlify, domaine et monitoring.
