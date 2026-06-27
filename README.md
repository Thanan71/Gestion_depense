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
- `src/services` : authentification, stockage, sauvegarde, statistiques et synchronisation
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
- Connexion, inscription et déconnexion avec session HttpOnly côté Netlify Functions.
- Données isolées par utilisateur : chaque table métier possède un `user_id`, et le navigateur
  persiste aussi les stores dans des clés `localStorage` séparées par utilisateur.
- PostgreSQL Netlify configuré côté serveur avec schéma SQL, healthcheck, endpoint résumé et
  synchronisation des données applicatives dans les tables métiers.

## Commandes

```bash
npm install
npm run dev
npm run dev:netlify
npm run build
npm run test:unit
npm run test:e2e
npm run lint
npm run format
npm run check
npm run db:health
npm run db:migrate
npm run db:verify-action
```

## PostgreSQL

Les chaînes de connexion restent côté serveur uniquement dans `.env` ou dans les variables
d'environnement Netlify. Elles ne doivent jamais être préfixées par `VITE_`, sinon Vite les expose
au navigateur.

- `DATABASE_READONLY_URL` : utilisée pour les healthchecks et lectures serverless.
- `DATABASE_URL` : utilisée pour les migrations et futures écritures.
- `VITE_SYNC_ENABLED=true` et `VITE_SYNC_PROVIDER=postgres` : activent la synchronisation du
  navigateur vers PostgreSQL via Netlify Functions.
- `database/schema.sql` : schéma principal, utilisateurs, sessions et tables métier isolées.
- `netlify/functions/auth-register.ts`, `auth-login.ts`, `auth-me.ts`, `auth-logout.ts` :
  endpoints d'authentification par email/mot de passe.
- `netlify/functions/app-data.ts` : lit/écrit les stores de l'utilisateur connecté dans les tables PostgreSQL normalisées
  (`accounts`, `categories`, `transactions`, `budgets`, `goals`, `subscriptions`, `debts`,
  `settings`, `app_users`).
- `netlify/functions/db-health.ts` : vérifie la connexion.
- `netlify/functions/summary.ts` : expose un résumé agrégé.

La synchronisation est automatique :

- si PostgreSQL contient déjà des données pour l'utilisateur connecté, elles hydratent les stores
  Pinia puis le `localStorage` ;
- si PostgreSQL est vide pour cet utilisateur, l'état local est envoyé en base au démarrage ;
- ensuite chaque changement local est sauvegardé dans les tables PostgreSQL via Netlify Functions.

Le site doit être lancé avec `npm run dev:netlify` pour tester l'authentification et la base en
local, car Vite seul ne sert pas les Netlify Functions.

Les variables `VITE_*` sont publiques par définition dans Vite. `netlify.toml` les exclut donc du
scan de secrets Netlify via `SECRETS_SCAN_OMIT_KEYS`, tout en laissant les vraies variables serveur
comme `DATABASE_URL` et `DATABASE_READONLY_URL` protégées par le scan.

## Roadmap

1. Fondation : projet Vite, thème, layout, navigation, PWA.
2. Données : types, stores, persistance locale, sauvegarde JSON.
3. Fonctionnel : CRUD dépenses, revenus, catégories et comptes.
4. Analyse : dashboard, Chart.js, filtres et recherche.
5. Avancé : budgets, objectifs, abonnements, dettes.
6. Expérience : notifications, offline, import/export, dialogues et toasts.
7. Qualité : tests unitaires, E2E, accessibilité et performance.
8. Déploiement : variables d'environnement, Netlify, domaine et monitoring.
