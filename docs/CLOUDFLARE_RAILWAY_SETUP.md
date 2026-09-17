# 🚀 Guide de Déploiement : Railway + PostgreSQL + Cloudflare + Domaine Personnalisé

Ce guide vous explique pas à pas comment déployer **Salma Shop** sur une infrastructure haute performance, 100% disponible (sans aucune mise en veille ni erreur 503), avec base de données PostgreSQL gérée, domaine personnalisé et protection Cloudflare.

---

## 🏗️ Pourquoi cette architecture ?

| Composant | Rôle & Avantage |
| :--- | :--- |
| **Railway** | Hébergement 24h/24 permanent, sans endormissement, redémarrage automatique en cas d'erreur. |
| **PostgreSQL (Railway)** | Base de données relationnelle robuste, transactions fiables, sauvegardes automatiques. |
| **Cloudflare** | DNS ultra-rapide, CDN mondial (mise en cache des images et assets au Sénégal), protection anti-DDoS, SSL/HTTPS automatique. |
| **Domaine Personnalisé** | Votre propre adresse professionnelle (ex: `salmashop.sn` ou `boutiquesalma.com`). |

---

## 📋 Étape 1 : Créer le Projet et la Base PostgreSQL sur Railway

1. Rendez-vous sur [Railway.com](https://railway.com/) et connectez-vous avec votre compte **GitHub**.
2. Cliquez sur **"+ New Project"** puis sélectionnez **"Deploy from GitHub repo"**.
3. Choisissez le dépôt **`fallvoyta-ux/salma-shop`** (ou votre fork).
4. Une fois le projet créé dans votre tableau de bord Railway :
   - Cliquez sur le bouton **"+ New"** (ou clic droit dans l'espace de travail).
   - Sélectionnez **"Database"** ➜ **"Add PostgreSQL"**.
5. **Liaison automatique de la base :**
   - Cliquez sur votre service Node.js (Salma Shop).
   - Allez dans l'onglet **"Variables"**.
   - Cliquez sur **"New Variable"** ➜ **"Add Reference"** et sélectionnez la variable `DATABASE_URL` de votre service PostgreSQL.
   *(Dans la plupart des cas, Railway lie automatiquement `DATABASE_URL` quand une base PostgreSQL est ajoutée au même projet).*

> **💡 Magie de l'initialisation automatique :**
> Dès le premier démarrage, le serveur détecte `DATABASE_URL`, applique automatiquement `src/server/db/schema.postgres.sql` pour créer toutes les tables et exécute le seed initial pour créer vos catégories, produits, comptes de livraison et votre compte administrateur.

---

## 🔐 Étape 2 : Configurer les Variables d'Environnement (Railway)

Dans le service de votre application sur Railway, allez dans **"Variables"** et configurez :

| Variable | Valeur recommandée | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Active le mode optimisé |
| `PORT` | `5000` *(ou laissé par défaut)* | Port géré par Railway |
| `JWT_SECRET` | *(générez une longue phrase secrète)* | Clé de signature des sessions |
| `STORE_NAME` | `Salma Shop` | Nom de la boutique |
| `STORE_PHONE` | `+221 77 201 86 97` | Téléphone officiel |
| `STORE_WHATSAPP` | `221772018697` | Numéro WhatsApp officiel |
| `PAYMENT_MODE` | `test` *(puis `live` en production)* | Mode de paiement Wave / OM |

---

## 🌐 Étape 3 : Ajouter votre Domaine Personnalisé sur Railway

1. Dans Railway, cliquez sur votre service **Salma Shop**.
2. Rendez-vous dans **"Settings"** ➜ section **"Domains"** (ou **"Networking"**).
3. Cliquez sur **"Custom Domain"**.
4. Saisissez votre domaine ou sous-domaine (ex : `shop.votredomaine.com` ou `votredomaine.com`).
5. Railway va vous afficher une adresse cible DNS CNAME (ex : `salma-shop-production-xxxx.up.railway.app`). **Copiez cette adresse.**

---

## 🛡️ Étape 4 : Configurer le DNS et la Protection sur Cloudflare

1. Connectez-vous sur votre compte [Cloudflare](https://dash.cloudflare.com/).
2. Sélectionnez votre domaine, puis rendez-vous dans le menu **"DNS"** ➜ **"Records"**.
3. Cliquez sur **"Add record"** :
   - **Type** : `CNAME`
   - **Name** : `@` *(pour le domaine racine)* ou `shop` *(si sous-domaine)*
   - **Target** : l'adresse CNAME fournie par Railway (ex : `salma-shop-production-xxxx.up.railway.app`)
   - **Proxy status** : **Proxied (Nuage Orange ☁️)**
   - Cliquez sur **"Save"**.

4. **Sécurité SSL/TLS Cloudflare :**
   - Allez dans **"SSL/TLS"** ➜ **"Overview"**.
   - Sélectionnez le mode **"Full"** (ou **"Full (strict)"**).
   - Allez dans **"SSL/TLS"** ➜ **"Edge Certificates"** :
     - Activez l'option **"Always Use HTTPS"**.
     - Activez **"Automatic HTTPS Rewrites"**.

5. **Optimisation Vitesse et Cache (Optionnel mais recommandé) :**
   - Allez dans **"Speed"** ➜ **"Optimization"** : activez la minification et la compression Brotli.

---

## ✅ Étape 5 : Vérification Finale

1. Ouvrez votre navigateur sur votre domaine (ex : `https://shop.votredomaine.com`).
2. Vérifiez le cadenas HTTPS vert/sécurisé 🔒 fourni par Cloudflare.
3. Testez l'endpoint de diagnostic : `https://shop.votredomaine.com/api/health`.
   - Il doit retourner :
   ```json
   {
     "status": "ok",
     "store": "Salma Shop",
     "paymentMode": "test",
     "timestamp": "..."
   }
   ```
4. Testez la commande avec validation Wave : elle redirige instantanément vers le numéro officiel de Salma Shop (`+221 77 201 86 97`).
5. Connectez-vous au panneau d'administration sur `/admin` avec vos identifiants pour gérer les commandes, les stocks et les prix.

---

🎉 **Votre boutique Salma Shop est désormais hébergée sur une infrastructure de classe mondiale, disponible 24h/24 et 7j/7 sans interruption !**
