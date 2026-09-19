# 🇸🇳 Salma Shop - Chic Ladies | Vente Articles Divers Dakar

Application e-commerce professionnelle, moderne et fonctionnelle, conçue pour **Salma Shop (Chic Ladies)** à Dakar, Sénégal :
* **Slogans officiels** : *« Se vêtir à tous prix 💜 »* & *« S'habiller selon son Budget 🌹 »*
* **Contact & WhatsApp officiel** : **+221 77 201 86 97**
* Devises en **FCFA**, paiements **Wave**, **Orange Money**, **Carte Bancaire**, zones de livraison locales, commandes directes via **WhatsApp**, gestion des stocks et espace administrateur complet sans toucher au code.

---

## 🌟 Fonctionnalités Principales

### 🛍️ Côté Client & Boutique
*   **Page d'Accueil Haut de Gamme** : Bannière d'annonce configurable, Hero section Dakar chic avec call-to-actions, univers de catégories, produits vedettes, promotions en cours, garanties de service et avis clients.
*   **Catalogue & Recherche** : Recherche textuelle instantanée (par nom, catégorie, référence SKU), filtres dynamiques (prix min/max, disponibilité en stock, promotions), tri (plus récent, prix croissant/décroissant, popularité), et pagination.
*   **Fiches Produits Détaillées** : Galerie photos multi-images avec sélecteur de miniatures, prix en FCFA avec réduction calculée automatiquement, badge de stock en temps réel, caractéristiques techniques, avis clients avec notes étoiles et formulaire de dépôt d'avis.
*   **Commander via WhatsApp 💬** : Bouton direct générant un message pré-rempli avec le nom de l'article, la référence SKU, la quantité et le prix pour commander en un clic.
*   **Panier Réactif & Persistant** : Tiroir latéral (*Cart Drawer*) et page panier complète, ajustement des quantités, calcul automatique du sous-total et barre de progression pour la gratuité de livraison à Dakar.
*   **Tunnel de Commande (Checkout)** : Processus en 5 étapes avec validation des coordonnées, sélection des zones de livraison configurables (Dakar Centre, Almadies, Banlieue, Régions), récapitulatif clair et choix du moyen de paiement.
*   **Moyens de Paiement Adaptés au Sénégal** :
    *   **Wave Sénégal** (QR Code / Redirection mobile instantanée)
    *   **Orange Money Sénégal** (USSD / validation mobile)
    *   **Carte Bancaire** (Visa, Mastercard sécurisées)
    *   **Paiement en Espèces à la Livraison**
*   **Confirmation & Suivi de Commande** : Numéro unique séquentiel (ex: `CMD-2026-000004`), suivi chronologique en temps réel (En attente → Confirmée → En préparation → Expédiée → Livrée), confirmation par WhatsApp en un clic et impression de facture/reçu.
*   **Espace Client Sécurisé** : Inscription, connexion, mise à jour du profil et adresses, historique complet des commandes passées et modification du mot de passe.

---

### 👑 Côté Administration (`/admin`)
La propriétaire peut gérer l'intégralité de sa boutique **sans toucher à une seule ligne de code** :
*   **Tableau de Bord & Statistiques en Direct** :
    *   Chiffre d'affaires total, ventes du jour, de la semaine et du mois.
    *   Nombre de commandes (totales et en attente).
    *   Panier moyen calculé en temps réel.
    *   Nombre de clients enregistrés.
    *   Graphique d'évolution des ventes sur les 7 derniers jours.
    *   Tableau des alertes de stock faible avec bouton de réapprovisionnement express.
*   **Gestion des Produits & Stocks** :
    *   Création et modification avec formulaire complet.
    *   Téléversement de plusieurs photos (formats JPG, PNG, WebP) et sélection de la photo principale.
    *   Définition du stock et du seuil d'alerte.
    *   Décrémentation atomique automatique du stock à chaque commande.
    *   **Réapprovisionnement automatique** du stock si une commande est annulée.
    *   Activation / désactivation rapide en un clic.
*   **Gestion des Catégories** : Création, modification, photo de couverture et ordre d'affichage.
*   **Gestion des Commandes** :
    *   Filtrage par statut de commande et statut de paiement.
    *   Consultation des coordonnées complètes du client et de l'adresse de livraison.
    *   Mise à jour du statut de traitement (`En attente`, `Confirmée`, `En préparation`, `Expédiée`, `En livraison`, `Livrée`, `Annulée`).
    *   Validation manuelle ou automatique du paiement.
    *   Impression de facture / bon de livraison.
*   **Gestion des Clients** : Répertoire complet avec historique des dépenses et commandes.
*   **Modération des Avis** : Approbation, masquage ou suppression des commentaires clients.
*   **Zones & Tarifs de Livraison** : Création et modification des zones géographiques, des tarifs en FCFA et des délais estimés.
*   **Paramètres du Magasin** : Nom du magasin, slogan, coordonnées, téléphone, numéro WhatsApp pour les commandes, devise, texte de la bannière promo haute et seuil de gratuité de livraison.

---

## 🛠️ Stack Technique

*   **Frontend** : React 18, Vite, Vanilla CSS Design System (variables HSL, micro-animations, mobile-first, zéro dépendance CSS tierce).
*   **Backend** : Node.js, Express.js (Architecture REST modulaire).
*   **Base de Données** : SQLite relationnel (`node:sqlite` natif Node 22) avec contraintes d'intégrité, clés étrangères (`PRAGMA foreign_keys = ON`), et transactions ACID.
*   **Sécurité** : Hachage bcrypt, jetons JWT, requêtes préparées 100% anti-injection SQL, rate-limiting anti brute-force, validation des fichiers uploadés.

---

## 🚀 Démarrage Rapide en Local

### 1. Installation des dépendances
```bash
npm install
```

### 2. Initialisation et peuplement de la base de données
```bash
npm run db:seed
```

### 3. Exécution des tests automatisés
```bash
npm test
node src/server/tests/test_full_journey.js
```

### 4. Lancement de l'application
```bash
# Lancement du serveur complet (API + Frontend)
npm start

# Ou en mode développement avec rechargement à chaud Vite
npm run dev
```

L'application est accessible sur :
*   **Boutique Publique** : `http://localhost:5000` (ou `http://localhost:5173` en dev)
*   **Espace Administration** : `http://localhost:5000/admin/login`

---

## 🔑 Accès et Comptes Utilisateurs

| Rôle | Email | Mot de Passe |
| :--- | :--- | :--- |
| **Cliente Démo** | `client@salmashop.sn` | `ClientSalma123!` |

> [!NOTE]
> Le compte administrateur doit être créé et géré de façon sécurisée (via `npm run create-admin` ou les variables d'environnement) sans exposer de mot de passe par défaut dans le dépôt.

---

## 📦 Création d'un Nouveau Compte Administrateur

Pour permettre à la propriétaire de configurer son propre compte administrateur sécurisé :
```bash
npm run create-admin
```
Le script demande de manière interactive le nom, prénom, email, téléphone et mot de passe, puis enregistre le compte avec le mot de passe haché par bcrypt.
