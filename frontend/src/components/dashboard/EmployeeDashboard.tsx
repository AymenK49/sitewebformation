import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Module {
  id: string;
  title: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
}

interface Certificate {
  id: string;
  title: string;
  dateObtained: string;
  score: number;
}

const EmployeeDashboard: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/employee/progress', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setModules(data.modules);
        setCertificates(data.certificates);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const progressData = {
    labels: ['Complété', 'En cours', 'Non commencé'],
    datasets: [{
      data: [
        modules.filter(m => m.status === 'completed').length,
        modules.filter(m => m.status === 'in_progress').length,
        modules.filter(m => m.status === 'not_started').length
      ],
      backgroundColor: [
        '#4CAF50',
        '#2196F3',
        '#9E9E9E'
      ]
    }]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Tableau de Bord</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Progression globale */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">Progression Globale</h2>
          <div className="mt-4 h-64">
            <Doughnut data={progressData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Certificats obtenus */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">Certificats Obtenus</h2>
          <div className="mt-4">
            {certificates.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {certificates.map(cert => (
                  <li key={cert.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cert.title}</p>
                        <p className="text-sm text-gray-500">
                          Obtenu le {new Date(cert.dateObtained).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Score: {cert.score}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Aucun certificat obtenu pour le moment
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Liste des modules */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Modules de Formation</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {modules.map(module => (
              <li key={module.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{module.title}</h3>
                      <div className="mt-2">
                        <div className="relative w-full h-2 bg-gray-200 rounded">
                          <div
                            className="absolute h-2 bg-blue-500 rounded"
                            style={{ width: `${module.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          module.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : module.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {module.status === 'completed'
                          ? 'Complété'
                          : module.status === 'in_progress'
                          ? 'En cours'
                          : 'Non commencé'}
                      </span>
                    </div>
                  </div>
                  {module.score !== undefined && (
                    <div className="mt-2 text-sm text-gray-500">
                      Score: {module.score}%
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;