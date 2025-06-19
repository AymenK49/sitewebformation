# Plateforme de Formation en Cybersécurité

Une plateforme web interactive pour la formation en cybersécurité des employés, construite avec React, Node.js, et PostgreSQL.

## Fonctionnalités

- Authentification sécurisée (LDAP/Email)
- Dashboard personnalisé pour employés et administrateurs
- Modules de formation interactifs
- Quiz et évaluations
- Génération de certificats
- Système de notifications
- Interface d'administration complète

## Architecture

- Frontend: React + TailwindCSS
- Backend: Node.js + Express
- Base de données: PostgreSQL
- Reverse Proxy: Nginx

## Structure du Projet

```
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Custom hooks React
│   │   ├── context/        # Contextes React
│   │   ├── services/       # Services API
│   │   └── utils/          # Utilitaires
│   └── public/             # Assets statiques
├── backend/                # Serveur Node.js
│   ├── src/
│   │   ├── controllers/    # Contrôleurs
│   │   ├── models/         # Modèles de données
│   │   ├── routes/         # Routes API
│   │   ├── middleware/     # Middleware personnalisé
│   │   ├── services/       # Services métier
│   │   └── utils/          # Utilitaires
│   └── tests/              # Tests unitaires
├── db/                     # Scripts SQL et migrations
└── docker/                 # Configuration Docker
    ├── frontend/
    ├── backend/
    ├── nginx/
    └── postgres/
```

## Prérequis

- Docker
- Docker Compose
- Node.js >= 18 (pour le développement)

## Installation

1. Cloner le repository
```bash
git clone [url-du-repo]
cd cybersecurity-training-platform
```

2. Configuration
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

3. Démarrage
```bash
docker-compose up -d
```

4. Accès
- Application: http://localhost:3000
- API: http://localhost:8000
- Adminer: http://localhost:8080

## Déploiement sur Ubuntu 24.04

1. Installer les dépendances
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
```

2. Configurer Docker
```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

3. Déployer l'application
```bash
git clone [url-du-repo]
cd cybersecurity-training-platform
cp .env.example .env
# Éditer .env avec les paramètres de production
docker-compose -f docker-compose.prod.yml up -d
```

## Sécurité

- Authentification JWT
- Rate limiting sur l'API
- Validation des données
- Logging des accès
- HTTPS forcé en production
- Protection contre les injections SQL
- Sanitization des entrées utilisateur

## Maintenance

### Backup de la base de données
```bash
docker-compose exec db pg_dump -U postgres cybersec > backup.sql
```

### Mise à jour
```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository.

## Licence

MIT