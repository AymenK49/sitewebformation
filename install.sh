#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Vérification des privilèges root
if [ "$(id -u)" != "0" ]; then
   log_error "Ce script doit être exécuté en tant que root"
   exit 1
fi

# Vérification de la version d'Ubuntu
if ! grep -q 'Ubuntu' /etc/os-release || ! grep -q '24.04' /etc/os-release; then
    log_error "Ce script est conçu pour Ubuntu 24.04 uniquement"
    exit 1
fi

# Mise à jour du système
log_info "Mise à jour du système..."
apt update && apt upgrade -y || {
    log_error "Échec de la mise à jour du système"
    exit 1
}

# Installation des dépendances système
log_info "Installation des dépendances système..."
apt install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    python3-pip \
    nodejs \
    npm \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    unattended-upgrades \
    net-tools || {
    log_error "Échec de l'installation des dépendances"
    exit 1
}

# Configuration du pare-feu
log_info "Configuration du pare-feu..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Configuration de fail2ban
log_info "Configuration de fail2ban..."
cat > /etc/fail2ban/jail.local << EOL
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
EOL

systemctl enable fail2ban
systemctl start fail2ban

# Configuration des mises à jour automatiques
log_info "Configuration des mises à jour automatiques..."
dpkg-reconfigure -f noninteractive unattended-upgrades

# Configuration de Docker
log_info "Configuration de Docker..."
systemctl start docker || { log_error "Échec du démarrage de Docker"; exit 1; }
systemctl enable docker

# Installation de la dernière version de Docker Compose
log_info "Installation de Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Création des répertoires nécessaires
log_info "Création des répertoires..."
mkdir -p /opt/cybersecurity-training
cd /opt/cybersecurity-training

# Configuration des variables d'environnement
log_info "Configuration des variables d'environnement..."

# Génération d'un mot de passe aléatoire pour la base de données
DB_PASSWORD=$(openssl rand -base64 32)

cat > .env << EOL
# Configuration générale
APP_NAME=Cybersecurity Training Platform
APP_ENV=production

# Configuration du backend
BACKEND_PORT=8000
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/cybersecurity
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Configuration de la base de données
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=cybersecurity

# Configuration email
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-email-password
MAIL_FROM=noreply@domain.com
MAIL_PORT=587
MAIL_SERVER=smtp.domain.com
MAIL_TLS=True
MAIL_SSL=False

# Configuration LDAP (optionnel)
LDAP_HOST=ldap.domain.com
LDAP_PORT=389
LDAP_BASE_DN=dc=domain,dc=com
LDAP_USER_DN=ou=users,dc=domain,dc=com
EOL

# Configuration de Nginx avec des paramètres de sécurité renforcés
log_info "Configuration de Nginx..."
cat > /etc/nginx/sites-available/cybersecurity-training << EOL
server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # SSL configuration will be added by certbot

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Security
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Rate limiting
        limit_req zone=one burst=5 nodelay;
        limit_req_zone \$binary_remote_addr zone=one:10m rate=10r/s;

        # Security
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;
    }
}
EOL

# Activation du site Nginx
ln -s /etc/nginx/sites-available/cybersecurity-training /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Configuration SSL avec Certbot
log_info "Configuration SSL..."
certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@domain.com

# Création des scripts de maintenance
log_info "Création des scripts de maintenance..."

# Script de mise à jour
cat > /opt/cybersecurity-training/update.sh << EOL
#!/bin/bash
cd /opt/cybersecurity-training

# Sauvegarde avant mise à jour
tar -czf backup_before_update_\$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.yml

git pull
docker-compose pull
docker-compose build
docker-compose up -d
EOL

chmod +x /opt/cybersecurity-training/update.sh

# Script de sauvegarde
cat > /opt/cybersecurity-training/backup.sh << EOL
#!/bin/bash
BACKUP_DIR=/var/backups/cybersecurity-training
DATE=\$(date +%Y%m%d_%H%M%S)

# Création du répertoire de sauvegarde
mkdir -p \$BACKUP_DIR

# Sauvegarde de la base de données
docker-compose exec -T db pg_dump -U postgres cybersecurity > \$BACKUP_DIR/db_\$DATE.sql

# Sauvegarde des fichiers uploadés et de la configuration
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz \
    /opt/cybersecurity-training/uploads \
    /opt/cybersecurity-training/.env \
    /etc/nginx/sites-available/cybersecurity-training

# Suppression des sauvegardes de plus de 30 jours
find \$BACKUP_DIR -type f -mtime +30 -delete
EOL

chmod +x /opt/cybersecurity-training/backup.sh

# Configuration des tâches cron
log_info "Configuration des tâches cron..."
echo "0 2 * * * root /opt/cybersecurity-training/backup.sh" > /etc/cron.d/cybersecurity-training-backup
echo "0 4 * * * root /usr/bin/certbot renew --quiet" > /etc/cron.d/certbot-renewal

# Vérification finale
log_info "Vérification de l'installation..."

# Vérification des services
services=("docker" "nginx" "fail2ban" "ufw")
for service in "${services[@]}"; do
    if ! systemctl is-active --quiet "$service"; then
        log_error "Le service $service n'est pas actif"
        exit 1
    fi
done

# Vérification des ports
if ! netstat -tuln | grep -q ':80\|:443\|:8000'; then
    log_warn "Les ports HTTP/HTTPS ne semblent pas être ouverts"
fi

# Sauvegarde de la configuration initiale
log_info "Sauvegarde de la configuration initiale..."
tar -czf /root/cybersecurity-training-initial-config-$(date +%Y%m%d).tar.gz \
    /opt/cybersecurity-training/.env \
    /etc/nginx/sites-available/cybersecurity-training \
    /etc/fail2ban/jail.local

log_info "Installation terminée avec succès !"
log_info "Points à vérifier :"
echo "1. Configurer les variables d'environnement dans le fichier .env"
echo "2. Mettre à jour le nom de domaine dans la configuration Nginx"
echo "3. Configurer correctement les paramètres SMTP pour l'envoi d'emails"
echo "4. Configurer LDAP si nécessaire"
echo "5. Vérifier les logs avec 'docker-compose logs'"
echo "6. Vérifier la configuration du pare-feu avec 'ufw status'"
echo "7. Surveiller les tentatives de connexion avec 'fail2ban-client status'"

# Affichage des informations de sécurité
log_info "Informations de sécurité :"
echo "- Mot de passe de la base de données : ${DB_PASSWORD}"
echo "- Les fichiers de configuration sont sauvegardés dans : /root/cybersecurity-training-initial-config-$(date +%Y%m%d).tar.gz"
echo "- Les sauvegardes seront stockées dans : /var/backups/cybersecurity-training/"