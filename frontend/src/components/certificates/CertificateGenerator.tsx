import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface CertificateData {
  moduleTitle: string;
  userName: string;
  completionDate: string;
  score: number;
  certificateId: string;
}

interface CertificateGeneratorProps {
  moduleId: string;
  onGenerated: (certificateUrl: string) => void;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ moduleId, onGenerated }) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateCertificate = async () => {
      try {
        // Récupération des données du certificat
        const response = await fetch(`http://localhost:8000/api/certificates/generate/${moduleId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Erreur lors de la génération du certificat');

        const certificateData: CertificateData = await response.json();

        // Création du certificat sur le canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration du canvas
        canvas.width = 1754;  // Format A4 paysage à 300dpi
        canvas.height = 1240;

        // Fond
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bordure décorative
        ctx.strokeStyle = '#1E40AF';
        ctx.lineWidth = 20;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        // Motif décoratif
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        // Logo ou titre
        ctx.font = 'bold 80px Arial';
        ctx.fillStyle = '#1E40AF';
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFICAT', canvas.width / 2, 200);
        ctx.fillText('DE RÉUSSITE', canvas.width / 2, 300);

        // Texte principal
        ctx.font = '40px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText('Ce certificat est décerné à', canvas.width / 2, 450);

        // Nom du participant
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#1E40AF';
        ctx.fillText(certificateData.userName, canvas.width / 2, 550);

        // Description
        ctx.font = '40px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText('pour avoir complété avec succès le module', canvas.width / 2, 650);

        // Titre du module
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#1E40AF';
        ctx.fillText(`"${certificateData.moduleTitle}"`, canvas.width / 2, 750);

        // Score
        ctx.font = '40px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(`avec un score de ${certificateData.score}%`, canvas.width / 2, 850);

        // Date
        ctx.font = '35px Arial';
        ctx.fillText(
          `Délivré le ${new Date(certificateData.completionDate).toLocaleDateString('fr-FR')}`
          , canvas.width / 2, 950
        );

        // Numéro de certificat
        ctx.font = '25px Arial';
        ctx.fillText(`Certificat N° ${certificateData.certificateId}`, canvas.width / 2, 1100);

        // Conversion du canvas en URL de données
        const certificateUrl = canvas.toDataURL('image/png');

        // Envoi du certificat au serveur
        const uploadResponse = await fetch('http://localhost:8000/api/certificates/save', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            moduleId,
            certificateImage: certificateUrl
          })
        });

        if (!uploadResponse.ok) throw new Error('Erreur lors de la sauvegarde du certificat');

        const { certificateUrl: savedUrl } = await uploadResponse.json();
        onGenerated(savedUrl);

      } catch (error) {
        console.error('Erreur lors de la génération du certificat:', error);
      }
    };

    if (user) {
      generateCertificate();
    }
  }, [moduleId, user, onGenerated]);

  return (
    <div className="hidden">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default CertificateGenerator;