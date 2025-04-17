import React, { useState, useEffect } from 'react';
import { CloudUpload } from 'lucide-react';
import axios from 'axios';


const NonDicomData = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Fonction pour récupérer la liste des fichiers
  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  
      const response = await axios.get('http://localhost:5000/api/nondicom/files', {
        headers: {
          'x-auth-token': token
        }
      });
  
      if (Array.isArray(response.data)) {
        setUploadedFiles(response.data);
      } else if (Array.isArray(response.data.files)) {
        setUploadedFiles(response.data.files);
      } else {
        console.error('Réponse inattendue :', response.data);
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
    }
  };
  

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    const formData = new FormData();
    newFiles.forEach(file => formData.append('files', file));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour uploader des fichiers.');
      }

      console.log('Tentative d\'envoi à l\'URL:', '/api/nondicom/upload');

      try {
        const testResponse = await axios.post('/api/nondicom/test-upload');
        console.log('Test route response:', testResponse.data);
      } catch (testError) {
        console.error('Erreur test route:', testError.message);
      }

      const res = await axios.post('/api/nondicom/upload', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload réussi:', res.data);
      setSelectedFiles([]);
      fetchFiles();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'upload';
      console.error('Erreur lors de l\'upload:', errorMessage);
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(`/api/nondicom/files/${fileId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      fetchFiles();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des documents non DICOM</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Télécharger de nouveaux documents</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`w-full h-40 border-4 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-300 ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <CloudUpload className="w-10 h-10 text-blue-500 mb-2" />
          <p className="text-gray-600 text-center">
            {uploading 
              ? 'Upload en cours...' 
              : 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner'}
          </p>
          <input
            type="file"
            multiple
            disabled={uploading}
            className="opacity-0 absolute inset-0 cursor-pointer"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>

        {error && (
          <p className="text-red-600 mt-2 text-center">{error}</p>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-700">Fichiers sélectionnés :</h3>
            <ul className="mt-2 space-y-1">
              {selectedFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Documents disponibles</h2>

        {Array.isArray(uploadedFiles) && uploadedFiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du fichier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'upload</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedFiles.map((file) => (
                  <tr key={file._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.filename}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(file.length / 1024).toFixed(2)} KB</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a 
                        href={`/api/nondicom/download/${file.filename}`} 
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Télécharger
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">Aucun document disponible</p>
        )}
      </div>
    </div>
  );
};

export default NonDicomData;
