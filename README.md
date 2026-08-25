<<<<<<< HEAD
# interact
=======
# 🌟 Interact Club Platform — Mobile PWA

Application mobile web progressive (PWA) officielle de gestion pour les clubs **Interact** (parrainés par le Rotary International).

Conçue avec une approche **Mobile-First & Responsive**, un design épuré **Dark Neon** (Bleu Royal `#003366` et Or Interact `#F7A81B`), un contrôle d'accès granulaire **RBAC**, un moteur de détection automatique des retards avec sanctions disciplinaires (**Protocole**), et un **Assistant IA** connecté à Google Gemini (`gemini-3.6-flash`).

---

## 🚀 Fonctionnalités Clés

### 1. 📱 Expérience Mobile-First PWA (iOS / Android)
- **Barre de navigation inférieure (Bottom Tab Bar)** avec 6 onglets ergonomiques.
- **Support Hors-ligne & PWA Installable** via `sw.js` et `manifest.json`.
- **Safe Area Insets** optimisés pour encoches iPhone / Dynamic Island et barres système Android.

### 2. 👑 Matrice de Rôles & Permissions (RBAC)
- **Président & Vice-Président** : Accès Super-Admin complet (lecture / écriture sur tout le club).
- **Secrétaire** : Gestion de la matrice RH, historique et affectation des rôles/commissions.
- **Responsable Protocole** : Modération disciplinaire, validation des excuses et ajustement de sévérité.
- **Chefs & Co-Chefs de Commission** : Création et pilotage des actions et tâches de leur commission.
- **Représentant** : Suivi des comités de séminaires et formations.
- **Membres & Recrues** : Consultation des actions, suivi de leurs tâches et validation To-Do.
- **🎭 Simulateur de Rôles** : Basculement instantané dans l'onglet Profil pour tester tous les profils sans re-connexion.

### 3. 👥 Arborescence Club -> Commissions -> Actions -> Tâches
- Commissions dynamiques (Action Sociale, Relations Publiques, Séminaires...).
- Jauges de progression calculées en temps réel (% de tâches accomplies par action).
- Formulaires de création d'actions et de tâches directement dans l'interface.

### 4. 📋 To-Do Board avec Tri par Urgence
- 🔴 **Critique / Retard** : Deadlines dépassées.
- 🟠 **Haute Urgence** : Échéance dans moins de 24 heures.
- 🟡 **En cours** : Tâches standard.
- 🟢 **Terminées** : Historique des tâches validées.

### 5. ⚖️ Moteur de Sanctions Automatique (Protocole Watchdog)
- Scanner d'échéances automatique (`currentTime > task.deadline` & `task.status !== 'completed'`).
- Génération instantanée de sanctions dans `/clubs/{clubId}/sanctions/` avec calcul des heures de retard et incrémentation des *strikes*.
- Workflow d'exemption officielle (*Pardon/Excuse*) et gradation (Légère vs Sévère).

### 6. 🤖 Assistant IA Interact (Google Gemini 3.6 Flash)
- Connecté à l'API REST Google Gemini (`gemini-3.6-flash`).
- Puces d'actions rapides (Quick Prompts) :
  - Fiches de postes et traditions du Rotary.
  - Rédaction et correction de lettres de motivation pour le Bureau.
  - Plans d'action sociale et logistique clé en main.
  - Modèles de dossiers de sponsoring et partenariat.
  - Comptes-rendus types de réunions statutaires.
- Bouton de copie en 1 clic et mise en page Markdown riche.

---

## 🗄️ Structure des Fichiers

```
INTERACT/
├── index.html               # Coque SPA Mobile-First avec 6 onglets
├── manifest.json            # Manifeste PWA
├── sw.js                    # Service Worker (Cache & Offline)
├── css/
│   └── styles.css           # Thème Dark Neon, Glassmorphism & Couleurs Interact
├── js/
│   ├── firebase-config.js   # Initialisation Firebase & DBStore réactif
│   ├── auth.js              # Authentification, session & matrice RBAC
│   ├── commissions.js       # Gestion de la hiérarchie Commissions > Actions
│   ├── tasks.js             # Suivi des tâches To-Do & urgence
│   ├── protocol.js          # Moteur de sanctions Watchdog & Matrice RH
│   ├── ai-assistant.js      # Assistant IA Gemini 3.6 Flash
│   └── app.js               # Routeur SPA, modales, toasts & initialisation
└── icons/
    ├── icon.svg             # Logo Interact vectoriel
    ├── icon-192.png         # Icône PWA 192x192
    └── icon-512.png         # Icône PWA 512x512
```

---

## 💻 Démarrage Local

Pour lancer l'application localement sur votre machine :

```bash
# Avec Python
python -m http.server 8080

# Ouvrir dans votre navigateur
http://localhost:8080
```

---

## 🛠️ Configuration Firebase & Gemini

- **Firebase Web API Key** : `AIzaSyB_sLq0RLPplqNR9kQXx3wWyzQGgx_zdso`
- **Realtime Database** : Synchronisation temps réel avec fallback local `DBStore`.
- **Google Gemini API Key** : Configurée par défaut avec possibilité de saisie personnalisée dans l'onglet *Profil & Paramètres*.
