from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Module, Quiz, Question, Answer, UserRole, ModuleStatus
from passlib.context import CryptContext
import os

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cybersec_training")

# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    # Création du moteur SQLAlchemy
    engine = create_engine(DATABASE_URL)
    
    # Création des tables
    Base.metadata.create_all(bind=engine)
    
    # Création d'une session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Création des utilisateurs de test
        admin_user = User(
            email="admin@example.com",
            hashed_password=pwd_context.hash("admin123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
            last_login=datetime.utcnow()
        )

        employee_user = User(
            email="employee@example.com",
            hashed_password=pwd_context.hash("employee123"),
            full_name="Test Employee",
            role=UserRole.EMPLOYEE,
            last_login=datetime.utcnow()
        )

        db.add_all([admin_user, employee_user])
        db.commit()

        # Création des modules de formation
        modules = [
            Module(
                title="Introduction à la Cybersécurité",
                description="Concepts fondamentaux de la sécurité informatique",
                content_type="video",
                content_url="/content/intro-cybersecurity.mp4",
                order=1,
                duration_minutes=30
            ),
            Module(
                title="Sécurité des Mots de Passe",
                description="Bonnes pratiques pour la gestion des mots de passe",
                content_type="text",
                content_url="/content/password-security.html",
                order=2,
                duration_minutes=45
            ),
            Module(
                title="Phishing et Social Engineering",
                description="Comment identifier et éviter les attaques de phishing",
                content_type="video",
                content_url="/content/phishing-awareness.mp4",
                order=3,
                duration_minutes=60
            )
        ]

        db.add_all(modules)
        db.commit()

        # Création des quiz
        for module in modules:
            quiz = Quiz(
                module_id=module.id,
                title=f"Quiz - {module.title}",
                description=f"Évaluez vos connaissances sur {module.title}",
                passing_score=70.0
            )
            db.add(quiz)
            db.commit()

            # Questions pour chaque quiz
            if module.order == 1:  # Quiz Introduction
                questions = [
                    {
                        "text": "Qu'est-ce que la cybersécurité ?",
                        "type": "multiple_choice",
                        "answers": [
                            {"text": "La protection des systèmes informatiques contre les menaces", "correct": True},
                            {"text": "Un type de virus informatique", "correct": False},
                            {"text": "Un logiciel antivirus", "correct": False}
                        ]
                    },
                    {
                        "text": "La confidentialité est un pilier de la cybersécurité",
                        "type": "true_false",
                        "answers": [
                            {"text": "Vrai", "correct": True},
                            {"text": "Faux", "correct": False}
                        ]
                    }
                ]
            elif module.order == 2:  # Quiz Mots de passe
                questions = [
                    {
                        "text": "Quelle est la longueur minimale recommandée pour un mot de passe sécurisé ?",
                        "type": "multiple_choice",
                        "answers": [
                            {"text": "12 caractères", "correct": True},
                            {"text": "6 caractères", "correct": False},
                            {"text": "8 caractères", "correct": False}
                        ]
                    },
                    {
                        "text": "Il est recommandé d'utiliser le même mot de passe pour tous ses comptes",
                        "type": "true_false",
                        "answers": [
                            {"text": "Vrai", "correct": False},
                            {"text": "Faux", "correct": True}
                        ]
                    }
                ]
            else:  # Quiz Phishing
                questions = [
                    {
                        "text": "Quels sont les signes d'un email de phishing ?",
                        "type": "multiple_choice",
                        "answers": [
                            {"text": "Fautes d'orthographe et urgence dans le message", "correct": True},
                            {"text": "Email provenant d'un ami", "correct": False},
                            {"text": "Signature professionnelle", "correct": False}
                        ]
                    },
                    {
                        "text": "Le phishing cible uniquement les entreprises",
                        "type": "true_false",
                        "answers": [
                            {"text": "Vrai", "correct": False},
                            {"text": "Faux", "correct": True}
                        ]
                    }
                ]

            for q_data in questions:
                question = Question(
                    quiz_id=quiz.id,
                    question_text=q_data["text"],
                    question_type=q_data["type"]
                )
                db.add(question)
                db.commit()

                for a_data in q_data["answers"]:
                    answer = Answer(
                        question_id=question.id,
                        answer_text=a_data["text"],
                        is_correct=a_data["correct"]
                    )
                    db.add(answer)

            db.commit()

    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()