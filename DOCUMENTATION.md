# Documentation Technique — Plateforme TSP Intelligence OCP

**Projet PFE — OCP Khouribga, Ligne 107 DEF**
**Rédigé par :** Sara El Idrissi — Process Engineer
**Date :** Mai 2026

---

## Présentation du projet

Ce projet est une plateforme web développée dans le cadre d'un PFE à l'OCP Khouribga. Elle permet de prédire la qualité du TSP produit sur la ligne 107 DEF à partir des paramètres procédé (température, débit, humidité...), de détecter les dérives des capteurs, et de proposer des recommandations aux opérateurs.

La plateforme est composée de deux parties :
- Un **frontend** (interface web) accessible depuis un navigateur
- Un **backend** (serveur API) qui fait tourner les modèles ML

---

## Accès à la plateforme

**Interface principale :**
https://tanstack-start-app.ocpmonitron.workers.dev

**API backend :**
https://ocp-tsp-intelligence-platform-2026-production.up.railway.app

**Documentation API interactive :**
https://ocp-tsp-intelligence-platform-2026-production.up.railway.app/docs

Pour vérifier que le backend fonctionne, ouvrez ce lien dans un navigateur — il doit retourner `{"status":"healthy"}` :
https://ocp-tsp-intelligence-platform-2026-production.up.railway.app/health

---

## Code source

Les deux repos sont publics sur GitHub sous le compte `mariaerrihi2-bot` :

- Frontend : github.com/mariaerrihi2-bot/ocp-monitron-spark
- Backend : github.com/mariaerrihi2-bot/ocp-tsp-intelligence-platform-2026

---

## Technologies utilisées

**Frontend**
- React 18 avec TypeScript (framework TanStack Start)
- Tailwind CSS pour le design
- Déployé sur Cloudflare Workers

**Backend**
- Python 3.11 avec FastAPI
- Modèle GBM (Gradient Boosting) pour la prédiction qualité P2O5
- Optuna pour l'optimisation des paramètres procédé
- Détection de dérive via ADWIN et test de Kolmogorov-Smirnov
- Déployé sur Railway (containerisé avec Docker)

---

## Comment lancer le projet en local

### Frontend

Il faut avoir Node.js version 22 ou plus installé.

```bash
git clone https://github.com/mariaerrihi2-bot/ocp-monitron-spark
cd ocp-monitron-spark
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:3000

Pour déployer sur Cloudflare :
```bash
npm run build
wrangler deploy
```

### Backend

Il faut avoir Python 3.11 ou plus installé.

```bash
git clone https://github.com/mariaerrihi2-bot/ocp-tsp-intelligence-platform-2026
cd ocp-tsp-intelligence-platform-2026
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

L'API est accessible sur http://localhost:8000

Ou avec Docker si Docker Desktop est installé :
```bash
docker-compose up --build
```

---

## Variables d'environnement

**Cloudflare (frontend) — à configurer dans le dashboard Cloudflare Pages :**

| Nom | Valeur |
|-----|--------|
| VITE_API_URL | https://ocp-tsp-intelligence-platform-2026-production.up.railway.app |
| NODE_VERSION | 22 |

**Railway (backend) :**
Aucune variable externe n'est nécessaire. Le backend tourne en autonomie avec ses modèles ML locaux.

---

## Paramètres procédé et seuils qualité

Les paramètres suivants sont surveillés en temps réel. Les valeurs doivent rester dans les bornes pour que la prédiction soit fiable :

| Paramètre | Borne min | Borne max | Unité |
|-----------|-----------|-----------|-------|
| Température réaction | 75 | 105 | °C |
| Pression filtre | 1 | 10 | bar |
| Débit acide H3PO4 | 6 | 28 | m³/h |
| Débit phosphate | 10 | 50 | t/h |
| Température séchage | 80 | 700 | °C |
| Humidité entrée | 1.5 | 8 | % |
| Granulométrie D50 | 1.5 | 6 | mm |
| Ratio acide/phosphate | 0.8 | 1.1 | - |

Spécifications qualité produit fini :

| Paramètre | TSP Standard OCP | TSP Premium Export |
|-----------|------------------|--------------------|
| P2O5 Total | ≥ 44 % | ≥ 45.5 % |
| P2O5 Assimilable | ≥ 41 % | ≥ 43 % |
| Taux de Conversion | ≥ 90 % | ≥ 93 % |
| SO4 Résiduel | ≤ 3 % | ≤ 2 % |
| Fluorures F | ≤ 2 % | ≤ 1.5 % |
| Humidité | ≤ 5 % | ≤ 4 % |

---

## Mise à jour de la plateforme

Quand une modification est faite dans le code et poussée sur GitHub, voici ce qu'il faut faire :

**Frontend :**
```bash
cd ocp-monitron-spark
git pull origin main
npm run build
wrangler deploy
```

**Backend :**
Railway redéploie automatiquement dès qu'un push est fait sur la branche main du repo backend. Rien de plus à faire.

---

## Points importants à savoir

**Réseau OCP :** Le proxy OCP bloque les URLs en `*.pages.dev`. L'URL qui fonctionne sur le réseau OCP est uniquement celle en `workers.dev` :
https://tanstack-start-app.ocpmonitron.workers.dev

**Railway plan gratuit :** Le serveur backend se met en veille après 30 minutes sans activité. La première requête après la mise en veille peut prendre 10 à 15 secondes. Pour un usage en production, il faudra passer sur un plan payant Railway ou héberger le backend sur les serveurs OCP.

**Données temps réel :** Actuellement les données capteurs sont simulées (générées aléatoirement autour des valeurs nominales). Pour connecter les vraies données de la ligne 107 DEF, il faudra brancher le backend au système PI OPC-UA d'OCP — le point de connexion est dans le fichier `app/api/data.py`, fonction `get_current_data`.

**Modèles ML :** Les modèles GBM actuels sont entraînés sur des données simulées. Pour les valider sur les vraies données de production, il faudra réentraîner les modèles avec les données historiques PI et LIMS — le code d'entraînement est dans `app/ml/predictor.py`.

---

## Structure des fichiers importants

```
Frontend (ocp-monitron-spark/src/routes/)
├── app.analyse.tsx          → Page d'analyse et upload CSV
├── app.process-knowledge.tsx → Procédé TSP temps réel
├── app.explain.tsx          → Explication IA pour opérateurs
├── app.dashboard.tsx        → Dashboard principal
└── app.recommendations.tsx  → Recommandations procédé

Backend (ocp-tsp-intelligence-platform-2026/app/)
├── api/data.py              → Données capteurs (à connecter PI)
├── api/predictions.py       → Prédictions qualité TSP
├── ml/predictor.py          → Modèle GBM (à réentraîner)
├── core/process_knowledge.py → Logique métier ligne 107 DEF
└── core/config.py           → Seuils qualité OCP
```

