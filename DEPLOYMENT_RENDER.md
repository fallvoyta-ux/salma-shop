# Guide de Déploiement Production Render — Salma Shop
> **Global Business Services Grp SF (Groupe Salma Fall)**  
> *« La Qualité fait la Différence 💜🕊️🌹 »*

Tout a été configuré dans votre projet pour rendre le déploiement sur **Render** entièrement automatisé et sans friction.

---

## ⚡ Option 1 : Déploiement 100% Automatique en 1 Clic (Recommandé)

Grâce au fichier [`render.yaml`](file:///c:/Users/HP/Desktop/commerces/render.yaml) configuré à la racine de votre projet, Render crée **automatiquement** :
1. **La base de données PostgreSQL managée** (`salmashop-db`).
2. **Le Web Service Node.js** (`salmashop`) avec installation propre des dépendances et compilation frontend automatique (`buildCommand: npm ci && npm run build`).
3. **La liaison automatique de `DATABASE_URL`** entre la base et le serveur.
4. **Les variables de sécurité** (`JWT_SECRET`, `ADMIN_DEFAULT_EMAIL`, etc.).

### Marche à suivre :
1. Poussez votre code sur votre dépôt GitHub (`git push origin main`).
2. Rendez-vous sur [https://dashboard.render.com](https://dashboard.render.com).
3. Cliquez sur **New +** ➔ **Blueprint**.
4. Sélectionnez votre dépôt GitHub `salma-shop`.
5. Render détecte `render.yaml` et affiche le plan d'infrastructure complet.
6. Cliquez sur **Apply** : **C'est tout !**
   - La base PostgreSQL est provisionnée.
   - Le serveur démarre, crée les tables SQL et peuple le catalogue de produits automatiquement.

---

## 🖼️ Stockage des Images Produits : Zéro Configuration Requise

**Bonne nouvelle : vous n'avez même plus besoin de créer un compte Cloudinary !**
- Le serveur intègre désormais un **système de persistance automatique en base de données** (table SQL `uploaded_files`).
- Quand l'administratrice ajoute des photos de produits dans `/admin`, elles sont sauvegardées de façon permanente dans votre base PostgreSQL.
- Même si le conteneur gratuit de Render redémarre, **aucune image n'est perdue** : le serveur les restaure instantanément depuis la base de données.
- *(Optionnel : si vous souhaitez utiliser Cloudinary plus tard pour un CDN mondial, il vous suffira d'ajouter la variable `CLOUDINARY_URL` dans Render sans changer une seule ligne de code).*

---

## 🔑 Variables Configurées Automatiquement

Votre fichier `render.yaml` pré-remplit déjà l'environnement de production :

| Variable | Valeur Définie | Description |
|---|---|---|
| `NODE_ENV` | `production` | Optimisations de vitesse et sécurité strictes |
| `DATABASE_URL` | *(Lié automatiquement à Postgres Render)* | Sauvegarde permanente de toutes les données et images |
| `PAYMENT_MODE` | `test` | Ouverture immédiate en validation manuelle Wave / Orange Money |
| `JWT_SECRET` | *(Généré automatiquement par Render : `generateValue: true`)* | Secret cryptographique privé géré par Render |
| `ADMIN_DEFAULT_EMAIL` | *(À renseigner dans le Dashboard Render, ex: `contact@salmashop.sn`)* | Email de connexion de l'administratrice |
| `ADMIN_DEFAULT_PASSWORD` | *(À renseigner dans le Dashboard Render, mot de passe fort min 10 car.)* | Mot de passe administrateur initial |
| `STORE_NAME` | `Global Business Services Grp SF` | Nom officiel de la boutique |
| `STORE_PHONE` | `+221 77 201 86 97` | Téléphone officiel pour les règlements clients |
| `STORE_WHATSAPP` | `221772018697` | Numéro de réception des commandes |
| `WAVE_BUSINESS_ID` | `M_5iS6VUrJnTx-` | Identifiant marchand Wave du Groupe Salma Fall |

---

## 💳 Comment Encaisser les Ventes au Sénégal (Dès Aujourd'hui)

### Phase 1 : Validation Manuelle (Ouverture Immédiate)
La boutique fonctionne dès son déploiement avec les 3 modes de paiement :
- **Wave** : Le client valide sa commande et clique sur le lien marchand officiel du Groupe SALMA FALL (`https://pay.wave.com/m/M_5iS6VUrJnTx-/c/sn/`).
- **Orange Money** : Le client scanne le QR code officiel affiché à l'écran ou effectue un transfert direct vers le **`+221 77 201 86 97`**.
- **Espèces** : Le client règle directement le livreur à la réception à Dakar.
- **Rôle de Mme Salma Fall** :
  1. Dès réception de l'argent sur son téléphone, elle se connecte sur `https://salmashop.onrender.com/admin`.
  2. Dans l'onglet **Commandes**, elle passe le statut de paiement à **« Payé »** et la commande à **« Confirmée »**.
  3. Le client suit en temps réel l'avancement avec son code secret privé sur `/order-tracking`.

### Phase 2 : Automatisation API (Quand vous aurez les contrats marchands)
Dès que Wave Business ou Orange Money vous fourniront vos accès développeur :
1. Dans Render ➔ **Environment** :
   - Passez `PAYMENT_MODE` = `live`
   - Ajoutez `WAVE_WEBHOOK_SECRET` = `whsec_...` (obligatoire en mode live)
   - Ajoutez `WAVE_API_KEY` = `wave_ci_...`
2. Les commandes Wave seront alors validées automatiquement en temps réel par webhook signé.

---

## ⚡ Astuce UptimeRobot : Éviter la Mise en Veille (Gratuit)

Le plan gratuit de Render met le serveur en veille après 15 minutes d'inactivité. Pour garder la boutique ultra-rapide 24h/24 :
1. Créez un compte gratuit sur [https://uptimerobot.com](https://uptimerobot.com).
2. Ajoutez un moniteur **HTTP(s)** :
   - **URL** : `https://salmashop.onrender.com/api/health`
   - **Intervalle** : Toutes les 10 minutes.
3. Le serveur restera éveillé en permanence et s'ouvrira instantanément pour chaque visiteuse dakaroise.

---

## 🔍 Diagnostic Pré-Déploiement

À tout moment en local, vous pouvez exécuter :
```bash
npm run check:prod
```
Elle valide l'intégrité de la configuration, des tables et de l'environnement de production.
