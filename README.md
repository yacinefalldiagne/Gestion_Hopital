# Système de Gestion d'Images Médicales DICOM

## Description du projet

Ce projet vise à moderniser la gestion des données d'imagerie médicale au sein des établissements de santé sénégalais. Il s'agit d'une solution web complète et intégrée pour la gestion optimale des images DICOM, offrant aux professionnels de santé des outils performants et intuitifs pour améliorer l'efficacité du processus de diagnostic médical.

## 🎯 Objectifs

- **Modernisation complète** de la gestion des données d'imagerie médicale
- **Amélioration de l'efficacité** du processus de diagnostic médical
- **Assurance de la traçabilité** et sécurité optimale des données patients
- **Facilitation de la collaboration** entre professionnels de santé
- **Conformité aux normes** DICOM et RGPD

## ✨ Fonctionnalités principales

### Gestion des Patients
- Création, modification et suppression complète des dossiers patients
- Recherche multicritères (nom, prénom, numéro de dossier, date de naissance)
- Historique complet des examens avec vue chronologique

### Gestion des Images DICOM
- Import et stockage sécurisé des images DICOM
- Organisation hiérarchique (patient → étude → série → image)
- Système de métadonnées complètes et recherche avancée
- Support de toutes les modalités d'imagerie (radiographie, scanner, IRM, échographie)

### Visualisation Médicale Avancée
- Visualiseur DICOM intégré utilisant CornerstoneJS
- Outils de manipulation avancés :
  - Zoom et navigation
  - Ajustement du contraste
  - Outils de mesure
  - Annotations médicales

### Télé-radiologie
- Partage sécurisé d'examens entre médecins
- Consultation à distance depuis n'importe quel lieu sécurisé
- Collaboration entre spécialistes

### Planification et Rendez-vous
- Gestion du planning des examens
- Rappels automatiques aux patients
- Optimisation intelligente des créneaux

### Gestion Documentaire
- Stockage de documents non-DICOM
- Support de tous les formats médicaux standards
- Catégorisation et étiquetage automatique

## 🛠️ Technologies utilisées

### Frontend
- **React.js** - Framework principal pour l'interface utilisateur
- **Vite** - Outil de build et développement
- **Tailwind CSS** - Framework CSS utilitaire
- **CornerstoneJS** - Visualisation des images DICOM

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express.js** - Framework web avec architecture MVC
- **JWT** - Authentification sécurisée
- **bcrypt** - Hachage des mots de passe

### Base de données
- **MongoDB** - Base de données principale
- **Mongoose** - ODM pour MongoDB
- **GridFS** - Stockage des fichiers volumineux

## 🏗️ Architecture

Le système suit une architecture client-serveur en trois tiers :

1. **Couche de présentation** : Interface web React.js
2. **Couche logique métier** : API REST Node.js/Express
3. **Couche de données** : MongoDB avec GridFS

## 👥 Utilisateurs et rôles

### Secrétaire Médicale
- Gestion administrative des dossiers patients
- Planification et gestion des rendez-vous
- Communication avec les patients
- Droits : lecture/écriture dossiers administratifs, gestion planning

### Médecin
- Accès complet aux images DICOM avec outils de visualisation
- Rédaction et modification des rapports médicaux
- Consultation de l'historique médical complet
- Partage d'examens en télé-radiologie
- Droits : accès complet aux données médicales et diagnostiques

### Patient
- Consultation de son dossier médical personnel
- Téléchargement des comptes rendus d'examen
- Consultation des rendez-vous programmés
- Droits : lecture seule de ses propres données

## 🔒 Sécurité

- **Authentification forte** avec JWT
- **Chiffrement des données** en transit et au repos
- **Système d'audit trail** complet
- **Conformité RGPD** pour la protection des données personnelles
- **Gestion granulaire des rôles** et permissions
- **Sessions sécurisées** avec expiration automatique

## 📱 Compatibilité

- Interface responsive adaptée aux :
  - Ordinateurs de bureau
  - Tablettes
  - Smartphones
- Compatible avec tous les navigateurs web modernes

## 🚀 Installation et configuration

### Prérequis
- Node.js (version LTS)
- MongoDB
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone https://github.com/yacinefalldiagne/Gestion_Hopital.git

# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend
cd ../frontend
npm install
```

### Configuration
1. Configurer les variables d'environnement
2. Configurer la connexion MongoDB
3. Configurer les paramètres de sécurité JWT

### Lancement
```bash
# Démarrer le backend
cd backend
npm start

# Démarrer le frontend
cd frontend
npm run dev
```

## 📋 Phases de développement

### Phase 1 : Analyse et Conception Détaillée
- Analyse approfondie des besoins utilisateurs
- Conception de l'architecture technique
- Maquettage des interfaces utilisateur
- Validation des spécifications

### Phase 2 : Développement Backend
- Mise en place de l'infrastructure technique
- Développement de l'API REST
- Intégration avec MongoDB
- Tests unitaires backend

### Phase 3 : Développement Frontend
- Développement des interfaces React
- Intégration CornerstoneJS
- Développement des fonctionnalités métier
- Tests d'intégration

## 📚 Documentation

- Code source avec historique Git complet
- Documentation technique détaillée
- Commentaires de code respectant les standards
- Architecture clairement documentée

## ⚠️ Limites du projet

- Pas d'acquisition directe depuis les équipements d'imagerie
- Maintenance matérielle non incluse
- Formation limitée à une formation de base
- Intégration SIH non incluse dans la phase initiale

## 🤝 Contributeurs

**Équipe de développement :**
- Aminata BA
- Awa CISS
- Yacine FALL DIAGNE
- Dié SYLLA

---

*Ce projet s'inscrit dans le cadre de la modernisation du système de santé sénégalais et vise à améliorer la qualité des soins grâce aux technologies numériques.*