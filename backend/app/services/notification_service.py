from datetime import datetime, timedelta
from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from sqlalchemy.orm import Session
from app.models import User, Module, UserProgress
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Configuration de FastMail
mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_TLS=settings.MAIL_TLS,
    MAIL_SSL=settings.MAIL_SSL,
    USE_CREDENTIALS=True
)

fastmail = FastMail(mail_config)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    async def send_reminder_emails(self):
        """Envoie des emails de rappel aux utilisateurs ayant des modules non complétés."""
        try:
            # Récupération des utilisateurs actifs
            users = self.db.query(User).filter(User.is_active == True).all()
            
            for user in users:
                incomplete_modules = self._get_incomplete_modules(user)
                if incomplete_modules:
                    await self._send_reminder_email(user, incomplete_modules)
                    logger.info(f"Email de rappel envoyé à {user.email}")

        except Exception as e:
            logger.error(f"Erreur lors de l'envoi des emails de rappel: {str(e)}")
            raise

    async def send_completion_notification(self, user: User, module: Module):
        """Envoie une notification de félicitations lorsqu'un module est complété."""
        try:
            message = MessageSchema(
                subject="Formation Cybersécurité - Module complété",
                recipients=[user.email],
                body=self._get_completion_email_template(user.first_name, module.title),
                subtype="html"
            )
            
            await fastmail.send_message(message)
            logger.info(f"Email de félicitations envoyé à {user.email} pour le module {module.title}")

        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email de félicitations: {str(e)}")
            raise

    async def send_certificate_email(self, user: User, module: Module, certificate_url: str):
        """Envoie le certificat par email après la réussite d'un module."""
        try:
            message = MessageSchema(
                subject="Formation Cybersécurité - Votre certificat",
                recipients=[user.email],
                body=self._get_certificate_email_template(
                    user.first_name,
                    module.title,
                    certificate_url
                ),
                subtype="html"
            )
            
            await fastmail.send_message(message)
            logger.info(f"Email avec certificat envoyé à {user.email}")

        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email avec certificat: {str(e)}")
            raise

    def _get_incomplete_modules(self, user: User) -> List[Module]:
        """Récupère la liste des modules non complétés par l'utilisateur."""
        all_modules = self.db.query(Module).filter(Module.is_active == True).all()
        completed_modules = (
            self.db.query(UserProgress)
            .filter(
                UserProgress.user_id == user.id,
                UserProgress.is_completed == True
            )
            .all()
        )
        
        completed_module_ids = {progress.module_id for progress in completed_modules}
        return [module for module in all_modules if module.id not in completed_module_ids]

    def _get_reminder_email_template(self, first_name: str, modules: List[Module]) -> str:
        """Génère le template HTML pour l'email de rappel."""
        modules_list = "\n".join(
            f"<li>{module.title}</li>" for module in modules
        )

        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour {first_name},</h2>
                <p>Nous avons remarqué que vous n'avez pas encore complété certains modules 
                de votre formation en cybersécurité :</p>
                
                <ul>
                    {modules_list}
                </ul>
                
                <p>Pour maintenir un bon niveau de sécurité dans notre organisation, 
                il est important de compléter ces modules dès que possible.</p>
                
                <p>Connectez-vous à la plateforme pour continuer votre formation :</p>
                <p><a href="{settings.FRONTEND_URL}" 
                    style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
                    Accéder à la formation
                </a></p>
                
                <p>Cordialement,<br>L'équipe Formation</p>
            </body>
        </html>
        """

    def _get_completion_email_template(self, first_name: str, module_title: str) -> str:
        """Génère le template HTML pour l'email de félicitations."""
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Félicitations {first_name} !</h2>
                <p>Vous avez complété avec succès le module :</p>
                <h3 style="color: #4CAF50;">{module_title}</h3>
                
                <p>Continuez sur votre lancée ! D'autres modules vous attendent 
                pour parfaire vos connaissances en cybersécurité.</p>
                
                <p><a href="{settings.FRONTEND_URL}/dashboard" \
                    style="background-color: #4CAF50; color: white; padding: 10px 20px; \
                    text-decoration: none; border-radius: 5px;">\
                    Voir mon tableau de bord\
                </a></p>
                \
                <p>Cordialement,<br>L'équipe Formation</p>\
            </body>\
        </html>\
        """

    def _get_certificate_email_template(self, first_name: str, module_title: str, certificate_url: str) -> str:
        """Génère le template HTML pour l'email avec certificat."""
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Félicitations {first_name} !</h2>
                <p>Vous avez brillamment réussi le module :</p>
                <h3 style="color: #4CAF50;">{module_title}</h3>
                
                <p>Vous trouverez ci-joint votre certificat de réussite.</p>
                
                <p>Vous pouvez également télécharger votre certificat en cliquant sur le lien suivant :</p>
                <p><a href="{certificate_url}" \
                    style="background-color: #4CAF50; color: white; padding: 10px 20px; \
                    text-decoration: none; border-radius: 5px;">\
                    Télécharger mon certificat\
                </a></p>
                \
                <p>Continuez à développer vos compétences en cybersécurité !</p>
                \
                <p>Cordialement,<br>L'équipe Formation</p>\
            </body>\
        </html>\
        """