# Débouchage Express — App terrain

Version allégée de l'app LTDB, centrée sur le **mode tout-terrain** : photo avant (+ travaux supplémentaires) → photo après → rapport → facture → envoi mail + SMS. Aucun module SEO / Google Ads / site marketing.

Stack : **Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Supabase · Vercel · Resend** (email) · **Brevo/Twilio** (SMS).

---

## 1. Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés
```

## 2. Base de données (Supabase)

```bash
npm run prisma:generate
npm run prisma:push          # crée les tables
npm run prisma:seed          # NAP + tarifs PLACEHOLDER
```

> ⚠️ Le seed insère des **placeholders NAP** (`[ADRESSE À COMPLÉTER]`, SIRET, TVA, tél…). À remplacer dès réception des infos Débouchage Express, soit via Prisma Studio (`npm run prisma:studio`), soit en éditant `prisma/seed.ts`.

## 3. Storage Supabase

Créer un bucket **public** nommé comme `SUPABASE_BUCKET` (`debex` par défaut) :
Dashboard Supabase → Storage → New bucket → cocher *Public*. Les photos et PDF y sont déposés.

## 4. Lancer

```bash
npm run dev   # http://localhost:3000
```

---

## Parcours mode tout-terrain

| Étape | Écran | Action |
|---|---|---|
| 1 | Client & prestation | nom, tél, email, adresse, type |
| 2 | Avant | photos AVANT (appareil photo mobile) + **travaux supplémentaires** |
| 3 | Après | photos APRÈS |
| 4 | Valider | génère **rapport PDF** + **facture PDF** |
| → | Détail intervention | **envoi mail** (PJ rapport+facture) et **SMS** (liens) |

---

## Intégrations — où brancher les clés

| Service | Fichier | Variable |
|---|---|---|
| Email | `lib/resend.ts` | `RESEND_API_KEY`, `EMAIL_FROM` |
| SMS | `lib/sms.ts` | `SMS_PROVIDER` = `brevo` \| `twilio` \| `console` |
| Storage / DB | `lib/supabase.ts`, `lib/prisma.ts` | `DATABASE_URL`, `SUPABASE_*` |

- **SMS** : `SMS_PROVIDER=console` en dev (log uniquement, aucun envoi réel). Passer à `brevo` (clé `BREVO_API_KEY` + `SMS_SENDER`) ou `twilio` en prod.
- **Email** : domaine à vérifier dans Resend pour `EMAIL_FROM`. Sinon `onboarding@resend.dev` en test.

---

## Conventions MONDOR respectées

- **Prix** → table `Tarif` uniquement, jamais hardcodé (règle R2).
- **NAP / téléphone** → table `Parametre`, lu au render (règles R1/R3).
- Next.js 14 App Router · Prisma · Supabase · Vercel · Tailwind (stack immuable R6).

## Point compta à valider

Convention sprint 1 : **les prix saisis sont traités en HT**, la TVA (`TAUX_TVA`, 10 % par défaut) est ajoutée par-dessus sur la facture. Si la grille Débouchage Express est en TTC, basculer le calcul dans `app/api/facture/[id]/route.ts`.

---

## Déploiement Vercel

1. `git push` sur le repo GitHub (`3snv83136-coder`).
2. Importer dans Vercel, ajouter les variables d'env du `.env.example`.
3. Build command : `npm run build` (inclut `prisma generate`).
