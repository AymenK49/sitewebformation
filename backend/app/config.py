from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Paramètres de l'application
    APP_NAME: str = "Plateforme de Formation Cybersécurité"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    VERSION: str = "1.0.0"

    # Sécurité
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Base de données
    DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost"
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]

    # Rate Limiting
    RATE_LIMIT_PER_SECOND: int = 10
    RATE_LIMIT_BURST: int = 20

    # LDAP
    LDAP_HOST: Optional[str] = None
    LDAP_PORT: Optional[int] = 389
    LDAP_USE_SSL: bool = False
    LDAP_BASE_DN: Optional[str] = None
    LDAP_USER_DN_TEMPLATE: Optional[str] = None

    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # Stockage des fichiers
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_UPLOAD_EXTENSIONS: list = [".pdf", ".mp4", ".jpg", ".png"]

    # Certificats
    CERTIFICATE_TEMPLATE_PATH: str = "templates/certificate.html"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = "app.log"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Configuration des messages d'erreur
ERROR_MESSAGES = {
    "AUTHENTICATION_REQUIRED": "Authentification requise",
    "INVALID_CREDENTIALS": "Identifiants invalides",
    "INVALID_TOKEN": "Token invalide ou expiré",
    "INSUFFICIENT_PERMISSIONS": "Permissions insuffisantes",
    "USER_NOT_FOUND": "Utilisateur non trouvé",
    "EMAIL_ALREADY_EXISTS": "Cette adresse email est déjà utilisée",
    "INVALID_PASSWORD_FORMAT": "Le mot de passe ne respecte pas les critères de sécurité",
    "RATE_LIMIT_EXCEEDED": "Trop de requêtes, veuillez réessayer plus tard",
    "INVALID_FILE_TYPE": "Type de fichier non autorisé",
    "FILE_TOO_LARGE": "Fichier trop volumineux",
    "DATABASE_ERROR": "Erreur de base de données",
    "LDAP_ERROR": "Erreur de connexion LDAP",
    "EMAIL_ERROR": "Erreur lors de l'envoi de l'email",
    "INVALID_MODULE_STATUS": "Statut de module invalide",
    "QUIZ_ALREADY_COMPLETED": "Quiz déjà complété",
    "CERTIFICATE_GENERATION_ERROR": "Erreur lors de la génération du certificat"
}

# Configuration de la validation des mots de passe
PASSWORD_VALIDATION = {
    "MIN_LENGTH": 12,
    "REQUIRE_UPPERCASE": True,
    "REQUIRE_LOWERCASE": True,
    "REQUIRE_NUMBERS": True,
    "REQUIRE_SPECIAL_CHARS": True,
    "SPECIAL_CHARS": "!@#$%^&*()_+-=[]{}|;:,.<>?"
}

# Configuration des tentatives de connexion
LOGIN_ATTEMPTS = {
    "MAX_ATTEMPTS": 5,
    "LOCKOUT_DURATION": 15  # minutes
}

# Configuration des notifications
NOTIFICATION_SETTINGS = {
    "REMINDER_INTERVAL_DAYS": 7,
    "COMPLETION_THRESHOLD": 80,  # pourcentage
    "INACTIVITY_THRESHOLD_DAYS": 30
}