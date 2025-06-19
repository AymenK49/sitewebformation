import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useNotification } from '../common/Notification';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface GlobalStats {
  total_users: number;
  active_users: number;
  total_modules: number;
  completion_rate: number;
  average_score: number;
}

interface ModuleStats {
  module_id: string;
  title: string;
  started_count: number;
  completed_count: number;
  completion_rate: number;
  average_score: number;
  average_completion_time: string | null;
}

interface DepartmentStats {
  department: string;
  user_count: number;
  completion_rate: number;
  average_score: number;
}

interface RiskAssessment {
  users_missing_critical_modules: number;
  users_with_low_scores: number;
  inactive_users: number;
  risk_level: string;
}

const StatsDashboard: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [globalRes, moduleRes, deptRes, riskRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/stats/global', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:8000/api/admin/stats/modules', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:8000/api/admin/stats/departments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:8000/api/admin/stats/risk-assessment', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const [globalData, moduleData, deptData, riskData] = await Promise.all([
        globalRes.json(),
        moduleRes.json(),
        deptRes.json(),
        riskRes.json()
      ]);

      setGlobalStats(globalData);
      setModuleStats(moduleData);
      setDepartmentStats(deptData);
      setRiskAssessment(riskData);
      setIsLoading(false);

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      showNotification({
        type: 'error',
        message: 'Erreur lors du chargement des statistiques'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const moduleChartData = {
    labels: moduleStats.map(stat => stat.title),
    datasets: [
      {
        label: 'Taux de complétion (%)',
        data: moduleStats.map(stat => stat.completion_rate),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Score moyen (%)',
        data: moduleStats.map(stat => stat.average_score),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  };

  const departmentChartData = {
    labels: departmentStats.map(stat => stat.department),
    datasets: [
      {
        label: 'Taux de complétion par département (%)',
        data: departmentStats.map(stat => stat.completion_rate),
        backgroundColor: departmentStats.map(() => `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`)
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Utilisateurs</h3>
          <p className="text-3xl font-bold text-blue-600">{globalStats?.active_users}</p>
          <p className="text-sm text-gray-500">sur {globalStats?.total_users} inscrits</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Modules</h3>
          <p className="text-3xl font-bold text-blue-600">{globalStats?.total_modules}</p>
          <p className="text-sm text-gray-500">modules de formation</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Taux de complétion</h3>
          <p className="text-3xl font-bold text-blue-600">{globalStats?.completion_rate}%</p>
          <p className="text-sm text-gray-500">moyenne globale</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Score moyen</h3>
          <p className="text-3xl font-bold text-blue-600">{globalStats?.average_score}%</p>
          <p className="text-sm text-gray-500">tous modules confondus</p>
        </div>
      </div>

      {/* Évaluation des risques */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Évaluation des risques</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`p-4 rounded-lg ${riskAssessment?.risk_level === 'ÉLEVÉ' ? 'bg-red-100' : riskAssessment?.risk_level === 'MOYEN' ? 'bg-yellow-100' : 'bg-green-100'}`}>
            <h4 className="font-semibold mb-2">Niveau de risque global</h4>
            <p className={`text-2xl font-bold ${riskAssessment?.risk_level === 'ÉLEVÉ' ? 'text-red-700' : riskAssessment?.risk_level === 'MOYEN' ? 'text-yellow-700' : 'text-green-700'}`}>
              {riskAssessment?.risk_level}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Modules critiques non complétés</h4>
            <p className="text-2xl font-bold text-gray-700">
              {riskAssessment?.users_missing_critical_modules}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Utilisateurs avec scores faibles</h4>
            <p className="text-2xl font-bold text-gray-700">
              {riskAssessment?.users_with_low_scores}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Utilisateurs inactifs</h4>
            <p className="text-2xl font-bold text-gray-700">
              {riskAssessment?.inactive_users}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques par module */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Performance par module</h3>
        <div className="h-96">
          <Bar
            data={moduleChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>
      </div>

      {/* Statistiques par département */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Performance par département</h3>
        <div className="h-96">
          <Doughnut
            data={departmentChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Tableau détaillé des modules */}
      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Détails des modules</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commencé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complété</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux de complétion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score moyen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps moyen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {moduleStats.map((stat) => (
              <tr key={stat.module_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.started_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.completed_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.completion_rate}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.average_score}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.average_completion_time || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsDashboard;