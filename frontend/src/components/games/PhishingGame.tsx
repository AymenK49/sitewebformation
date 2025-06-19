import React, { useState, useEffect } from 'react';
import { useNotification } from '../common/Notification';

interface Email {
  id: number;
  sender: string;
  subject: string;
  content: string;
  isPhishing: boolean;
  hints: string[];
}

const PhishingGame: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const { showNotification } = useNotification();

  const sampleEmails: Email[] = [
    {
      id: 1,
      sender: 'service-client@banque-secure-authentique.com',
      subject: 'Action requise : Votre compte a été suspendu',
      content: 'Cher client, Nous avons détecté une activité suspecte sur votre compte. Pour éviter sa suspension, veuillez cliquer sur le lien suivant et confirmer vos informations bancaires : [LIEN]',
      isPhishing: true,
      hints: [
        'Vérifiez l\'adresse email de l\'expéditeur',
        'Les banques ne demandent jamais vos informations par email',
        'Le message crée un sentiment d\'urgence'
      ]
    },
    {
      id: 2,
      sender: 'contact@entreprise.fr',
      subject: 'Votre facture du mois',
      content: 'Bonjour, Veuillez trouver ci-joint votre facture du mois. Pour toute question, contactez notre service client au numéro habituel.',
      isPhishing: false,
      hints: [
        'L\'email ne demande pas d\'informations personnelles',
        'L\'adresse email correspond au domaine de l\'entreprise',
        'Le message est professionnel et sans urgence'
      ]
    },
    // Ajoutez d'autres exemples d'emails ici
  ];

  useEffect(() => {
    if (gameStarted) {
      setEmails(sampleEmails.sort(() => Math.random() - 0.5));
    }
  }, [gameStarted]);

  const handleAnswer = (isPhishingGuess: boolean) => {
    const currentEmail = emails[currentEmailIndex];
    const isCorrect = isPhishingGuess === currentEmail.isPhishing;

    if (isCorrect) {
      const points = Math.max(10 - hintsUsed * 2, 1);
      setScore(prev => prev + points);
      showNotification({
        type: 'success',
        message: `Correct ! +${points} points`,
        duration: 2000
      });
    } else {
      showNotification({
        type: 'error',
        message: 'Incorrect. Regardez les indices pour comprendre pourquoi.',
        duration: 3000
      });
    }

    if (currentEmailIndex < emails.length - 1) {
      setCurrentEmailIndex(prev => prev + 1);
      setShowHint(false);
      setHintsUsed(0);
    } else {
      showNotification({
        type: 'info',
        message: `Jeu terminé ! Score final : ${score} points`,
        duration: 5000
      });
      // Enregistrement du score
      saveScore();
    }
  };

  const saveScore = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/games/phishing/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ score })
      });

      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du score');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const showNextHint = () => {
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
  };

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Jeu de détection de phishing</h2>
        <p className="text-gray-600 mb-6">
          Testez vos compétences en cybersécurité ! Identifiez les emails de phishing
          parmi les emails légitimes. Utilisez les indices si nécessaire, mais attention,
          cela réduira vos points !
        </p>
        <button
          onClick={() => setGameStarted(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Commencer le jeu
        </button>
      </div>
    );
  }

  const currentEmail = emails[currentEmailIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Email {currentEmailIndex + 1}/{emails.length}</h3>
        <span className="text-lg font-medium text-blue-600">Score: {score}</span>
      </div>

      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <div className="mb-2">
          <span className="font-medium">De:</span> {currentEmail.sender}
        </div>
        <div className="mb-2">
          <span className="font-medium">Objet:</span> {currentEmail.subject}
        </div>
        <div className="border-t pt-4 mt-4">
          {currentEmail.content}
        </div>
      </div>

      {showHint && currentEmail.hints[hintsUsed - 1] && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            <span className="font-medium">Indice {hintsUsed}:</span> {currentEmail.hints[hintsUsed - 1]}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <button
            onClick={() => handleAnswer(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
          >
            Phishing
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Légitime
          </button>
        </div>

        {!showHint && currentEmail.hints[hintsUsed] && (
          <button
            onClick={showNextHint}
            className="text-blue-600 hover:text-blue-800"
          >
            Besoin d'un indice ? (-2 points)
          </button>
        )}
      </div>
    </div>
  );
};

export default PhishingGame;