## Objectif

Fiabiliser le chargement des données Supabase sur **/home** et **/profile**, et harmoniser leur mise en page avec la navigation top-tabs horizontale (TopTabs).

---

## Constats actuels

**/home (`src/routes/home.tsx`)**
- Suggestions de communautés chargées dans un `useEffect` sans état `loading`/`error` → écran vide pendant la latence, aucun feedback en cas d'échec.
- Ne montre pas si l'utilisateur est déjà membre (pas de filtre "à rejoindre" vs "rejointes").
- Aucune dernière conversation PsyBot affichée (alors que la table `chat_conversations` existe).
- Le hero affiche "Bonjour {firstName}" mais reste vide pour les comptes anonymes (pas de fallback élégant).

**/profile (`src/routes/profile.tsx`)**
- Stat "communautés rejointes" via `useEffect` sans gestion de chargement/erreur.
- N'affiche pas : nombre de conversations, statut expert (en attente / approuvé), date d'inscription.
- Bouton "Paramètres" est `disabled` → incohérent.
- Pas de skeleton pendant le chargement du profil.

**Cohérence visuelle**
- Les deux pages utilisent `container mx-auto px-4 py-10`, mais d'autres routes (communautés) utilisent des paddings différents → uniformiser via un wrapper commun.
- Pas de breadcrumb / titre de page partagé sous les top-tabs.

---

## Plan d'implémentation

### 1. Hook partagé `useDashboardData`
Nouveau fichier `src/hooks/useDashboardData.ts` utilisant **TanStack Query** (`useQuery`) pour :
- `communities-suggestions` : 4 communautés non rejointes par l'utilisateur (jointure via `community_members`).
- `communities-joined` : communautés où l'utilisateur est membre (id, name).
- `recent-conversations` : 3 dernières `chat_conversations` triées par `last_message_at`.
- `user-stats` : count `community_members`, count `chat_conversations`, `expert_applications.status` si applicable.

Avantages : cache, retry auto, états `isLoading`/`error` standardisés, pas de race conditions.

### 2. Refonte `/home`
- Remplacer `useEffect + useState` par les hooks Query.
- Ajouter section **"Reprendre une conversation"** listant les 3 dernières discussions PsyBot avec lien vers `/chat`.
- Section communautés : afficher uniquement les **suggestions** (pas déjà rejointes), avec bouton "Rejoindre" (mutation Supabase) ou lien si déjà membre.
- Skeletons (`<Skeleton />`) pendant chargement, message d'erreur discret avec bouton "Réessayer".
- Fallback hero : "Bonjour 🌿" si anonyme/sans prénom.

### 3. Refonte `/profile`
- Migrer vers `useQuery` pour profil + stats (3 cartes : communautés, conversations, langue).
- Si utilisateur a une `expert_application` → afficher carte de statut (pending/approved/rejected) avec lien vers `/dashboard`.
- Activer bouton "Paramètres" (lien vers une route placeholder ou ouverture d'un Sheet d'édition profil simple : prénom/nom/langue).
- Skeleton avatar+infos pendant chargement.

### 4. Layout commun `AppShell`
Nouveau `src/components/AppShell.tsx` :
```
<div className="min-h-screen bg-background">
  <TopTabs />
  <main className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
    {children}
  </main>
</div>
```
Utilisé par `/home`, `/profile` (et migrable plus tard vers communautés/search) pour garantir cohérence des paddings et largeurs max.

### 5. Petits correctifs UX
- TopTabs : ajouter une ombre au scroll (`shadow-sm` quand `scrollY > 0`) — optionnel, à confirmer.
- Toast d'erreur (sonner) si une requête échoue plutôt que silence.

---

## Détails techniques

- **Pas de modification du schéma Supabase** ni des RLS — toutes les requêtes utilisées sont déjà couvertes par les policies existantes.
- Utilisation du client browser `@/integrations/supabase/client` (pas de server function nécessaire ici, RLS suffit).
- TanStack Query est déjà câblé dans `__root.tsx` (QueryClientProvider).
- Suggestions communautés : requête `select id,name,description,image_url` filtrée côté client par exclusion des IDs joints (suffisant pour 4 items + petit volume initial).

## Fichiers touchés

- **Nouveau** : `src/hooks/useDashboardData.ts`
- **Nouveau** : `src/components/AppShell.tsx`
- **Modifié** : `src/routes/home.tsx`
- **Modifié** : `src/routes/profile.tsx`

## Hors périmètre

- Pas de refonte des routes communautés/chat/search (celles-ci sont déjà fonctionnelles).
- Pas de nouvelle table ni migration SQL.
- Pas de changement de la palette ou des tokens de design.
