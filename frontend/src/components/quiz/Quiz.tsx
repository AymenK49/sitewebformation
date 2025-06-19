import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false';
  answers: Answer[];
}

interface Answer {
  id: string;
  answerText: string;
  isCorrect?: boolean;
}

interface QuizProps {
  moduleId: string;
  quizId: string;
  onComplete: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ moduleId, quizId, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/quiz/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setQuestions(data.questions);
        setTimeLeft(data.timeLimit || 600); // 10 minutes par défaut
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(time => time - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    const question = questions[currentQuestionIndex];
    if (question.questionType === 'true_false') {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: [answerId]
      }));
    } else {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId]
          ? prev[questionId].includes(answerId)
            ? prev[questionId].filter(id => id !== answerId)
            : [...prev[questionId], answerId]
          : [answerId]
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          moduleId,
          answers: selectedAnswers
        })
      });

      const result = await response.json();
      onComplete(result.score);
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            Temps restant: {formatTime(timeLeft)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question courante */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {currentQuestion.questionText}
        </h3>

        <div className="space-y-3">
          {currentQuestion.answers.map((answer) => (
            <label
              key={answer.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedAnswers[currentQuestion.id]?.includes(answer.id)
                ? 'bg-blue-50 border-blue-500'
                : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <input
                type={currentQuestion.questionType === 'true_false' ? 'radio' : 'checkbox'}
                className={currentQuestion.questionType === 'true_false' ? 'form-radio' : 'form-checkbox'}
                checked={selectedAnswers[currentQuestion.id]?.includes(answer.id) || false}
                onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
              />
              <span className="ml-3">{answer.answerText}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(i => i - 1)}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-md ${currentQuestionIndex === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Précédent
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Terminer le quiz'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(i => i + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;