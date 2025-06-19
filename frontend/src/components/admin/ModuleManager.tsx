import React, { useState, useEffect } from 'react';
import { useNotification } from '../common/Notification';

interface Module {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'text';
  content: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ModuleManager: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const { showNotification } = useNotification();

  const initialFormState = {
    title: '',
    description: '',
    type: 'text' as const,
    content: '',
    order: 0,
    isActive: true
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/modules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des modules');

      const data = await response.json();
      setModules(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification({
        type: 'error',
        message: 'Erreur lors du chargement des modules'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value.toString());
    });

    if (file) {
      formDataToSend.append('file', file);
    }

    try {
      const url = isEditing && selectedModule
        ? `http://localhost:8000/api/admin/modules/${selectedModule.id}`
        : 'http://localhost:8000/api/admin/modules';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde du module');

      showNotification({
        type: 'success',
        message: `Module ${isEditing ? 'modifié' : 'créé'} avec succès`
      });

      resetForm();
      fetchModules();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la sauvegarde du module'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      type: module.type,
      content: module.content,
      order: module.order,
      isActive: module.isActive
    });
    setIsEditing(true);
  };

  const handleDelete = async (moduleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression du module');

      showNotification({
        type: 'success',
        message: 'Module supprimé avec succès'
      });

      fetchModules();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification({
        type: 'error',
        message: 'Erreur lors de la suppression du module'
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedModule(null);
    setIsEditing(false);
    setFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isEditing ? 'Modifier le module' : 'Créer un nouveau module'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'video' | 'pdf' | 'text' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="text">Texte</option>
                <option value="video">Vidéo</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                required
              />
            </div>
          </div>

          {formData.type === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenu
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={6}
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier ({formData.type})
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border rounded-md"
                accept={formData.type === 'pdf' ? '.pdf' : 'video/*'}
                required={!isEditing}
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Module actif
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Modules existants</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-medium text-gray-800">{module.title}</h4>
                <span
                  className={`px-2 py-1 text-xs rounded ${module.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {module.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Type: {module.type}</span>
                <span>Ordre: {module.order}</span>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(module)}
                  className="px-3 py-1 text-blue-600 hover:text-blue-800"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(module.id)}
                  className="px-3 py-1 text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleManager;