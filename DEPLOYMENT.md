# 🚀 Guide de Déploiement en Production - Teranga Shop Dakar

Ce guide explique pas à pas comment déployer l'application e-commerce **Teranga Shop Dakar** sur un serveur de production (VPS Linux, Render, Railway, ou hébergement Node.js cPanel).

---

## 1. Prérequis Serveur

*   **Node.js** : Version 20.x ou 22.x LTS installée.
*   **npm** : Version 10 ou supérieure.
*   **Système d'exploitation** : Ubuntu 22.04 LTS / Debian 12 (ou tout environnement Node.js supporté).
*   **Nom de domaine** : Exemple `boutique.sn` ou `terangashop.com`.

---

## 2. Configuration des Variables d'Environnement

Sur le serveur, copiez le fichier d'exemple pour créer le fichier `.env` de production :

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec des valeurs sécurisées :

```ini
# Environnement
NODE_ENV=production
PORT=5000
CLIENT_URL=https://votredomaine.sn

# Sécurité (IMPORTANT : Générez une clé secrète longue et aléatoire)
JWT_SECRET=generer_une_cle_secrete_tres_longue_et_aleatoire_64_caracteres_min
JWT_EXPIRES_IN=7d

# Base de données
DB_FILE_PATH=database.sqlite

# Mode de Paiement (Passez à 'live' pour les vrais paiements)
PAYMENT_MODE=live

# Wave Sénégal API (Identifiants officiels fournis par Wave Business)
WAVE_API_KEY=votre_cle_api_wave_live
WAVE_BUSINESS_ID=votre_business_id_wave
WAVE_WEBHOOK_SECRET=votre_webhook_secret_wave

# Orange Money Sénégal API (Identifiants officiels Orange Money Marchand)
ORANGE_MONEY_CLIENT_ID=votre_client_id_om
ORANGE_MONEY_CLIENT_SECRET=votre_client_secret_om
ORANGE_MONEY_MERCHANT_KEY=votre_cle_marchand_om

# Coordonnées Boutique
STORE_NAME="Teranga Shop Dakar"
STORE_PHONE="+221 77 123 45 67"
STORE_WHATSAPP="221771234567"
STORE_EMAIL="contact@votredomaine.sn"
STORE_ADDRESS="Rue Aimé Césaire, Point E, Dakar, Sénégal"
DEFAULT_CURRENCY="FCFA"
```

> [!CAUTION]
> Ne commitez JAMAIS le fichier `.env` dans un dépôt Git public ou partagé.

---

## 3. Installation et Construction du Projet

Sur votre serveur :

```bash
# 1. Installer les dépendances
npm ci --omit=dev  # ou npm install

# 2. Construire le frontend optimisé pour la production
npm run build

# 3. Initialiser la base de données relationnelle
npm run db:seed
```

---

## 4. Création Sécurisée du Compte Administrateur de la Propriétaire

Exécutez le script interactif :

```bash
npm run create-admin
```

Le script vous demandera :
1. Le prénom de la propriétaire (ex: Awa)
2. Le nom de famille (ex: Ndiaye)
3. L'adresse email professionnelle de connexion
4. Le numéro de téléphone / WhatsApp
5. Le mot de passe sécurisé (minimum 8 caractères)

Le mot de passe sera automatiquement haché avec un sel robuste via **bcrypt** avant enregistrement en base.

---

## 5. Gestionnaire de Processus (PM2 sur VPS)

Pour maintenir l'application en ligne en continu et redémarrer automatiquement en cas de reboot du serveur :

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start src/server/index.js --name "teranga-shop"

# Configurer le démarrage automatique au boot du serveur
pm2 startup
pm2 save
```

Commandes utiles PM2 :
```bash
pm2 status            # Voir l'état du serveur
pm2 logs teranga-shop # Consulter les journaux en direct
pm2 restart teranga-shop # Redémarrer
```

---

## 6. Configuration du Reverse Proxy Nginx & Certificat SSL (HTTPS)

### Configuration Nginx (`/etc/nginx/sites-available/terangashop`)

```nginx
server {
    listen 80;
    server_name votredomaine.sn www.votredomaine.sn;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez le site et rechargez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/terangashop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Installation du Certificat SSL Gratuit Let's Encrypt (HTTPS) :
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d votredomaine.sn -d www.votredomaine.sn
```

---

## 7. Sauvegardes de la Base de Données

La base de données relationnelle est contenue dans le fichier `database.sqlite`.

Pour créer une sauvegarde quotidienne automatique via cron :

```bash
crontab -e
```

Ajoutez la ligne suivante (sauvegarde chaque nuit à 02h00) :
```bash
0 2 * * * cp /chemin/vers/commerces/database.sqlite /chemin/vers/backups/teranga_db_$(date +\%Y\%m\%d).sqlite
```

---

## 8. Déploiement en 1 Clic sur Plateformes Cloud (Render / Railway)

1. Connectez votre dépôt Git à **Render** ou **Railway**.
2. Sélectionnez **Web Service** (Node.js).
3. **Build Command** : `npm install && npm run build`
4. **Start Command** : `node src/server/index.js`
5. Dans l'onglet **Environment Variables**, renseignez les variables définies dans `.env.example`.
6. Attachez un disque persistant (*Persistent Volume*) monté sur `/app/uploads` et pour `database.sqlite` afin de conserver les photos ajoutées et les commandes.
