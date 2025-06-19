import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Module {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'text' | 'pdf';
  contentUrl: string;
  duration: number;
}

interface ModuleViewerProps {
  moduleId: string;
  onComplete: () => void;
}

const ModuleViewer: React.FC<ModuleViewerProps> = ({ moduleId, onComplete }) => {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/modules/${moduleId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Erreur lors du chargement du module');
        
        const data = await response.json();
        setModule(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  const handleProgress = async (newProgress: number) => {
    setProgress(newProgress);
    
    if (newProgress >= 100) {
      try {
        await fetch(`http://localhost:8000/api/modules/${moduleId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        onComplete();
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la progression:', error);
      }
    }
  };

  const renderContent = () => {
    if (!module) return null;

    switch (module.contentType) {
      case 'video':
        return (
          <div className="aspect-w-16 aspect-h-9">
            <video
              className="w-full rounded-lg shadow-lg"
              controls
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                const progress = (video.currentTime / video.duration) * 100;
                handleProgress(progress);
              }}
              onEnded={() => handleProgress(100)}
            >
              <source src={module.contentUrl} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="h-screen">
            <iframe
              src={`${module.contentUrl}#toolbar=0`}
              className="w-full h-full rounded-lg shadow-lg"
              title={module.title}
              onLoad={() => {
                // Logique de suivi pour les PDF
                const checkProgress = setInterval(() => {
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    // Simulation de la progression basée sur le temps passé
                    setProgress(prev => {
                      const newProgress = Math.min(prev + 1, 100);
                      if (newProgress === 100) {
                        clearInterval(checkProgress);
                        handleProgress(100);
                      }
                      return newProgress;
                    });
                  }
                }, module.duration * 10); // Progression graduelle

                return () => clearInterval(checkProgress);
              }}
            />
          </div>
        );

      case 'text':
        return (
          <div className="prose max-w-none">
            <div
              className="bg-white p-6 rounded-lg shadow-lg"
              dangerouslySetInnerHTML={{ __html: module.contentUrl }}
              onScroll={(e) => {
                const element = e.target as HTMLDivElement;
                const progress = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
                handleProgress(progress);
              }}
            />
          </div>
        );

      default:
        return <div>Type de contenu non supporté</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-800"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {module && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{module.title}</h1>
            <p className="text-gray-600">{module.description}</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progression</span>
              <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden">
            {renderContent()}
          </div>
        </>
      )}
    </div>
  );
};

export default ModuleViewer;