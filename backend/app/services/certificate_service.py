from datetime import datetime
from typing import Optional
import os
import uuid
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session
from app.models import User, Module, Certificate
from app.config import settings
import qrcode
import logging

logger = logging.getLogger(__name__)

class CertificateService:
    def __init__(self, db: Session):
        self.db = db
        self.certificates_dir = settings.CERTIFICATES_DIR
        self._ensure_certificates_directory()

    def _ensure_certificates_directory(self):
        """Assure que le répertoire des certificats existe."""
        if not os.path.exists(self.certificates_dir):
            os.makedirs(self.certificates_dir)

    def generate_certificate(self, user: User, module: Module, score: float) -> str:
        """Génère un certificat PDF pour un module complété."""
        try:
            # Création d'un identifiant unique pour le certificat
            certificate_id = str(uuid.uuid4())
            
            # Création de l'image du certificat
            certificate_image = self._create_certificate_image(
                user.first_name,
                user.last_name,
                module.title,
                score,
                certificate_id
            )
            
            # Sauvegarde du certificat
            certificate_path = os.path.join(
                self.certificates_dir,
                f"certificate_{certificate_id}.png"
            )
            certificate_image.save(certificate_path, "PNG")
            
            # Création de l'entrée dans la base de données
            certificate = Certificate(
                id=certificate_id,
                user_id=user.id,
                module_id=module.id,
                score=score,
                file_path=certificate_path,
                issued_at=datetime.utcnow()
            )
            
            self.db.add(certificate)
            self.db.commit()
            
            return certificate_path

        except Exception as e:
            logger.error(f"Erreur lors de la génération du certificat: {str(e)}")
            raise

    def verify_certificate(self, certificate_id: str) -> Optional[dict]:
        """Vérifie l'authenticité d'un certificat."""
        try:
            certificate = (
                self.db.query(Certificate)
                .filter(Certificate.id == certificate_id)
                .first()
            )
            
            if not certificate:
                return None
            
            user = self.db.query(User).filter(User.id == certificate.user_id).first()
            module = self.db.query(Module).filter(Module.id == certificate.module_id).first()
            
            return {
                "certificate_id": certificate.id,
                "user_name": f"{user.first_name} {user.last_name}",
                "module_title": module.title,
                "score": certificate.score,
                "issued_at": certificate.issued_at.isoformat(),
                "is_valid": True
            }

        except Exception as e:
            logger.error(f"Erreur lors de la vérification du certificat: {str(e)}")
            return None

    def _create_certificate_image(self, first_name: str, last_name: str, 
                                module_title: str, score: float, 
                                certificate_id: str) -> Image:
        """Crée l'image du certificat avec un design professionnel."""
        # Création d'une image avec un fond blanc
        width, height = 2000, 1414  # Format A4 paysage à 300 DPI
        image = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(image)

        try:
            # Chargement des polices
            title_font = ImageFont.truetype("arial.ttf", 120)
            name_font = ImageFont.truetype("arial.ttf", 80)
            text_font = ImageFont.truetype("arial.ttf", 50)
            small_font = ImageFont.truetype("arial.ttf", 30)

        except OSError:
            # Fallback sur la police par défaut si Arial n'est pas disponible
            title_font = ImageFont.load_default()
            name_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Couleurs
        primary_color = (30, 64, 175)  # Bleu foncé
        secondary_color = (96, 165, 250)  # Bleu clair

        # Bordure décorative
        draw.rectangle([50, 50, width-50, height-50], outline=primary_color, width=10)
        draw.rectangle([70, 70, width-70, height-70], outline=secondary_color, width=2)

        # Titre
        draw.text((width/2, 200), "CERTIFICAT", font=title_font, fill=primary_color, anchor="mm")
        draw.text((width/2, 300), "DE RÉUSSITE", font=title_font, fill=primary_color, anchor="mm")

        # Texte principal
        draw.text((width/2, 450), "Ce certificat est décerné à", font=text_font, fill="black", anchor="mm")
        
        # Nom du participant
        full_name = f"{first_name} {last_name}"
        draw.text((width/2, 550), full_name, font=name_font, fill=primary_color, anchor="mm")

        # Module
        draw.text((width/2, 650), "pour avoir complété avec succès le module", 
                 font=text_font, fill="black", anchor="mm")
        draw.text((width/2, 750), f'"{module_title}"', 
                 font=name_font, fill=primary_color, anchor="mm")

        # Score
        draw.text((width/2, 850), f"avec un score de {score}%", 
                 font=text_font, fill="black", anchor="mm")

        # Date
        date_str = datetime.now().strftime("%d/%m/%Y")
        draw.text((width/2, 950), f"Délivré le {date_str}", 
                 font=text_font, fill="black", anchor="mm")

        # Génération du QR code pour la vérification
        verification_url = f"{settings.FRONTEND_URL}/verify-certificate/{certificate_id}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(verification_url)
        qr.make(fit=True)
        qr_image = qr.make_image(fill_color="black", back_color="white")

        # Placement du QR code
        qr_pos = (width - 300, height - 300)
        image.paste(qr_image, qr_pos)

        # Numéro du certificat
        draw.text((width/2, height-100), f"Certificat N° {certificate_id}", 
                 font=small_font, fill="black", anchor="mm")

        return image

    def get_certificate_url(self, certificate_id: str) -> Optional[str]:
        """Récupère l'URL de téléchargement d'un certificat."""
        try:
            certificate = (
                self.db.query(Certificate)
                .filter(Certificate.id == certificate_id)
                .first()
            )
            
            if not certificate:
                return None

            return f"{settings.API_URL}/certificates/{certificate_id}/download"

        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'URL du certificat: {str(e)}")
            return None