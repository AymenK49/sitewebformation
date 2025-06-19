from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from app.models import User, Module, UserProgress, QuizAttempt, LoginLog

class StatsService:
    def __init__(self, db: Session):
        self.db = db

    def get_global_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques globales de la plateforme."""
        total_users = self.db.query(func.count(User.id)).scalar()
        active_users = self.db.query(func.count(User.id)).filter(User.is_active == True).scalar()
        total_modules = self.db.query(func.count(Module.id)).scalar()

        # Calcul du taux de complétion global
        total_required_completions = total_users * total_modules
        total_completions = self.db.query(func.count(UserProgress.id))\
            .filter(UserProgress.is_completed == True).scalar()
        completion_rate = (total_completions / total_required_completions * 100) if total_required_completions > 0 else 0

        # Score moyen global
        avg_score = self.db.query(func.avg(QuizAttempt.score)).scalar() or 0

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_modules": total_modules,
            "completion_rate": round(completion_rate, 2),
            "average_score": round(float(avg_score), 2)
        }

    def get_module_stats(self) -> List[Dict[str, Any]]:
        """Récupère les statistiques détaillées par module."""
        modules = self.db.query(Module).all()
        stats = []

        for module in modules:
            # Nombre total d'utilisateurs ayant commencé le module
            started = self.db.query(func.count(UserProgress.id))\
                .filter(UserProgress.module_id == module.id).scalar()

            # Nombre d'utilisateurs ayant complété le module
            completed = self.db.query(func.count(UserProgress.id))\
                .filter(
                    UserProgress.module_id == module.id,
                    UserProgress.is_completed == True
                ).scalar()

            # Score moyen pour ce module
            avg_score = self.db.query(func.avg(QuizAttempt.score))\
                .filter(QuizAttempt.module_id == module.id).scalar() or 0

            # Temps moyen de complétion
            avg_completion_time = self.db.query(
                func.avg(UserProgress.completed_at - UserProgress.started_at)
            ).filter(
                UserProgress.module_id == module.id,
                UserProgress.is_completed == True
            ).scalar()

            stats.append({
                "module_id": module.id,
                "title": module.title,
                "started_count": started,
                "completed_count": completed,
                "completion_rate": round((completed / started * 100) if started > 0 else 0, 2),
                "average_score": round(float(avg_score), 2),
                "average_completion_time": str(avg_completion_time) if avg_completion_time else None
            })

        return stats

    def get_user_activity_stats(self, days: int = 30) -> Dict[str, List[Any]]:
        """Récupère les statistiques d'activité des utilisateurs sur une période donnée."""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Activité de connexion quotidienne
        daily_logins = self.db.query(
            func.date(LoginLog.created_at).label('date'),
            func.count(LoginLog.id).label('count')
        ).filter(
            LoginLog.created_at >= start_date
        ).group_by(
            func.date(LoginLog.created_at)
        ).all()

        # Modules complétés par jour
        daily_completions = self.db.query(
            func.date(UserProgress.completed_at).label('date'),
            func.count(UserProgress.id).label('count')
        ).filter(
            UserProgress.completed_at >= start_date,
            UserProgress.is_completed == True
        ).group_by(
            func.date(UserProgress.completed_at)
        ).all()

        return {
            "daily_logins": [
                {"date": str(login.date), "count": login.count}
                for login in daily_logins
            ],
            "daily_completions": [
                {"date": str(completion.date), "count": completion.count}
                for completion in daily_completions
            ]
        }

    def get_department_stats(self) -> List[Dict[str, Any]]:
        """Récupère les statistiques par département."""
        departments = self.db.query(User.department)\
            .filter(User.department.isnot(None))\
            .distinct().all()

        stats = []
        for (department,) in departments:
            # Nombre d'utilisateurs dans le département
            user_count = self.db.query(func.count(User.id))\
                .filter(User.department == department).scalar()

            # Taux de complétion moyen du département
            dept_users = self.db.query(User.id)\
                .filter(User.department == department).all()
            dept_user_ids = [user.id for user in dept_users]

            total_required = len(dept_user_ids) * self.db.query(func.count(Module.id)).scalar()
            completed = self.db.query(func.count(UserProgress.id))\
                .filter(
                    UserProgress.user_id.in_(dept_user_ids),
                    UserProgress.is_completed == True
                ).scalar()

            completion_rate = (completed / total_required * 100) if total_required > 0 else 0

            # Score moyen du département
            avg_score = self.db.query(func.avg(QuizAttempt.score))\
                .filter(QuizAttempt.user_id.in_(dept_user_ids)).scalar() or 0

            stats.append({
                "department": department,
                "user_count": user_count,
                "completion_rate": round(completion_rate, 2),
                "average_score": round(float(avg_score), 2)
            })

        return stats

    def get_risk_assessment(self) -> Dict[str, Any]:
        """Évalue les risques basés sur les performances des utilisateurs."""
        # Modules critiques non complétés
        critical_modules = self.db.query(Module)\
            .filter(Module.is_critical == True).all()
        critical_module_ids = [module.id for module in critical_modules]

        users_missing_critical = self.db.query(func.count(User.id))\
            .filter(User.is_active == True)\
            .filter(
                ~User.id.in_(
                    self.db.query(UserProgress.user_id)\
                    .filter(
                        UserProgress.module_id.in_(critical_module_ids),
                        UserProgress.is_completed == True
                    )
                )
            ).scalar()

        # Utilisateurs avec des scores faibles
        low_score_threshold = 60.0
        users_low_scores = self.db.query(func.count(distinct(QuizAttempt.user_id)))\
            .filter(QuizAttempt.score < low_score_threshold).scalar()

        # Utilisateurs inactifs
        inactive_threshold = datetime.utcnow() - timedelta(days=30)
        inactive_users = self.db.query(func.count(User.id))\
            .filter(
                User.is_active == True,
                User.last_login < inactive_threshold
            ).scalar()

        return {
            "users_missing_critical_modules": users_missing_critical,
            "users_with_low_scores": users_low_scores,
            "inactive_users": inactive_users,
            "risk_level": self._calculate_risk_level(
                users_missing_critical,
                users_low_scores,
                inactive_users
            )
        }

    def _calculate_risk_level(self, missing_critical: int, low_scores: int, 
                            inactive: int) -> str:
        """Calcule le niveau de risque global basé sur différents facteurs."""
        total_users = self.db.query(func.count(User.id))\
            .filter(User.is_active == True).scalar()
        
        if total_users == 0:
            return "INCONNU"

        # Calcul des pourcentages
        missing_critical_pct = (missing_critical / total_users) * 100
        low_scores_pct = (low_scores / total_users) * 100
        inactive_pct = (inactive / total_users) * 100

        # Définition des seuils
        if missing_critical_pct > 20 or low_scores_pct > 30 or inactive_pct > 40:
            return "ÉLEVÉ"
        elif missing_critical_pct > 10 or low_scores_pct > 20 or inactive_pct > 25:
            return "MOYEN"
        else:
            return "FAIBLE"