# Image de base Python
FROM python:3.11-slim

# Définition du répertoire de travail
WORKDIR /app

# Installation des dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    libldap2-dev \
    libsasl2-dev \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copie des requirements
COPY requirements.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY . .

# Configuration des variables d'environnement
ENV MODULE_NAME="app.main" \
    VARIABLE_NAME="app" \
    PORT=8000

# Exposition du port
EXPOSE ${PORT}

# Commande de démarrage avec des paramètres de sécurité
CMD ["uvicorn", "${MODULE_NAME}:${VARIABLE_NAME}", "--host", "0.0.0.0", "--port", "${PORT}", "--proxy-headers", "--forwarded-allow-ips", "*"]