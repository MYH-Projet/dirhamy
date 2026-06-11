# Dirhamy - Application de Gestion Financière

## 📝 Présentation du Projet
**Dirhamy** est une application mobile de gestion financière moderne et intuitive développée avec **Flutter**. Ce projet a été réalisé dans le cadre de notre projet académique de développement mobile.
L'objectif de Dirhamy est de permettre aux utilisateurs de suivre leurs revenus et dépenses, de définir des budgets et de garder un œil sur leur santé financière.

## 🎯 Sujet Choisi : Application de Gestion Financière (Sujet 6)
L'application répond à toutes les exigences du sujet et inclut les fonctionnalités suivantes :
- ✅ **Authentification :** Inscription et connexion sécurisées avec JWT.
- ✅ **Gestion des Transactions :** Ajout, modification et suppression de revenus, dépenses et transferts (CRUD complet).
- ✅ **Catégories & Budgets :** Classification personnalisée avec suivi des limites budgétaires.
- ✅ **Statistiques :** Visualisation claire des dépenses, des revenus et des soldes de comptes actuels.
- 🔄 **Synchronisation Bidirectionnelle :** Système de synchronisation robuste entre la base de données locale (SQLite) et le serveur distant, garantissant l'intégrité des données même après une perte de connexion.
- 🚧 **Chat IA (En Cours de Développement) :** Assistant financier intégré pour vous donner des conseils personnalisés sur vos budgets et transactions.
- ✅ **Interface Moderne & Responsive :** Design attractif, composants personnalisés et animations fluides.

## 🏗 Architecture MVC
Afin d'assurer un code propre, lisible et maintenable, le projet respecte rigoureusement le design pattern **MVC (Modèle-Vue-Contrôleur)** :

- 📁 **Models (`lib/models/`) :** Représentent les structures de données (Transaction, Categorie, Compte, Utilisateur) et définissent le schéma de la base de données SQLite locale (`dbContext.dart`).
- 📁 **Views (`lib/views/`) :** Contiennent l'ensemble des interfaces graphiques (UI). Les écrans sont développés avec les widgets Flutter et n'incluent pas de logique métier complexe.
- 📁 **Controllers (`lib/controllers/`) :** Gèrent la logique métier, la manipulation des données, la communication avec l'API REST via les *services*, et notifient les vues des changements d'état de l'application (via `ChangeNotifier`).
- 📁 **Services (`lib/services/`) :** Encapsulent la logique réseau et les requêtes HTTP vers le backend.

## 📸 Captures d'Écran

| Connexion | Tableau de bord | Ajout Transaction | Budget & Limites |
| :---: | :---: | :---: | :---: |
| ![Login](screenshots/login.png) | ![Dashboard](screenshots/dashboard.png) | ![Add Transaction](screenshots/add_transaction.png) | ![Budget](screenshots/budget.png) |

| MAJ Budget | Gestion Catégories | Ajout Catégorie |
| :---: | :---: | :---: |
| ![Update Budget](screenshots/update_budget.png) | ![Categories](screenshots/categories.png) | ![Add Category](screenshots/add_category.png) |

*(Assurez-vous de placer vos images dans un dossier `screenshots` à la racine de ce fichier, nommées comme ci-dessus)*

## 🛠 Technologies et Outils Utilisés
*   **Frontend Mobile :** Flutter (Dart)
*   **Base de Données Locale :** SQLite (package `sqflite`)
*   **Backend / API REST :** Node.js, Express, Prisma (Inclus dans le repo)
*   **Base de Données Distante :** PostgreSQL
*   **Authentification :** JSON Web Tokens (JWT) & `flutter_secure_storage`

## 🚀 Installation et Exécution

### Prérequis
- [Flutter SDK](https://docs.flutter.dev/get-started/install) installé sur votre machine.
- Un émulateur Android/iOS ou un smartphone configuré pour le débogage.

### Étapes d'exécution (Application Mobile)

1. **Cloner le dépôt :**
   ```bash
   git clone <LIEN_DE_VOTRE_DEPOT_GITHUB>
   cd dirhamy/mobile
   ```

2. **Installer les dépendances :**
   ```bash
   flutter pub get
   ```

3. **Configuration de l'environnement :**
   - Créez un fichier `.env` à la racine du dossier `mobile`.
   - Ajoutez l'URL de votre API Backend :
     ```env
     BASE_URL=http://<VOTRE_IP_LOCALE>:3000/api
     ```

4. **Lancer l'application :**
   ```bash
   flutter run
   ```

### Lancement du Backend (Si nécessaire)
Le code source backend complet est fourni dans le dossier `backend/`. Pour tester l'application avec un backend local complet :
```bash
cd dirhamy
docker-compose up --build -d
```

## ✨ Bonnes Pratiques Adoptées
- **Séparation des responsabilités :** Le code réseau, la logique métier et l'interface utilisateur sont strictement séparés.
- **Pull-to-Refresh :** Synchronisation intuitive des données en "tirant" la liste des transactions vers le bas.
- **Gestion de conflits :** Lors de la synchronisation, l'application détecte et permet de résoudre intelligemment les conflits de données entre le serveur et le cache hors-ligne.

---
*Projet développé dans le cadre du module de Développement Mobile - Juin 2026.*
