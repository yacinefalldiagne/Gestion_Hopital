import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Download, Eye } from 'lucide-react';
import NonDicomUpload from './NonDicomUpload';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

// Configurer les dépendances externes
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Intercepteur pour ajouter le token à toutes les requêtes
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const DicomData = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Récupérer les fichiers DICOM
    const fetchFiles = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Vous devez être connecté pour récupérer les fichiers.');
        }
        const res = await axios.get('http://localhost:5000/api/dicom/files', {
          headers: { 'x-auth-token': token },
        });
        console.log('Fichiers récupérés:', res.data);
        setUploadedFiles(res.data);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la récupération des fichiers';
        console.error('Erreur:', errorMessage);
        setError(errorMessage);
      }
    };
    fetchFiles();

    // Activer le visualiseur Cornerstone
    const element = document.getElementById('dicomViewer');
    if (element) {
      cornerstone.enable(element);
      console.log('Visualiseur Cornerstone activé');
    } else {
      console.error('Élément dicomViewer introuvable');
    }
  }, []);

  const handleDownload = async (instanceId) => {
    try {
      console.log('Téléchargement de l’instance:', instanceId);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour télécharger des fichiers.');
      }
      const res = await axios.get(`http://localhost:5000/api/dicom/download/${instanceId}`, {
        headers: { 'x-auth-token': token },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${instanceId}.dcm`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du téléchargement';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleDelete = async (instanceId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette image DICOM ?')) {
      return;
    }
    try {
      console.log('Suppression de l’instance:', instanceId);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour supprimer des fichiers.');
      }
      await axios.delete(`http://localhost:5000/api/dicom/files/${instanceId}`, {
        headers: { 'x-auth-token': token },
      });
      // Récupérer les fichiers mis à jour
      const res = await axios.get('http://localhost:5000/api/dicom/files', {
        headers: { 'x-auth-token': token },
      });
      setUploadedFiles(res.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleView = async (instanceId) => {
    try {
      console.log('Visualisation de l’instance:', instanceId);
      setError(null);
      const imageId = `wadouri:http://localhost:5000/api/dicom/download/${instanceId}`;
      const image = await cornerstone.loadAndCacheImage(imageId);
      const element = document.getElementById('dicomViewer');
      cornerstone.displayImage(element, image);
      setSelectedImage(instanceId);
      console.log('Image affichée:', imageId);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image DICOM:', error);
      setError('Erreur lors du chargement de l\'image DICOM');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-white rounded-xl shadow-md mx-10">
      <h2 className="text-2xl font-semibold mb-6">Gestion des images DICOM</h2>

      <NonDicomUpload
        onUploadSuccess={async () => {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5000/api/dicom/files', {
            headers: { 'x-auth-token': token },
          });
          setUploadedFiles(res.data);
        }}
        isDicom={true}
      />

      <div className="w-full max-w-2xl mt-8">
        <h3 className="text-lg font-medium mb-4">Images DICOM téléchargées</h3>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        {uploadedFiles.length === 0 ? (
          <p className="text-gray-500">Aucune image trouvée.</p>
        ) : (
          <ul className="space-y-3">
            {uploadedFiles.map((file) => (
              <li key={file.instanceId} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                <span className="truncate max-w-xs">{file.filename}</span>
                <div className="flex gap-3">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleView(file.instanceId)}
                    title="Visualiser"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleDownload(file.instanceId)}
                    title="Télécharger"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(file.instanceId)}
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full max-w-2xl mt-8">
        <h3 className="text-lg font-medium mb-4">Visualiseur DICOM</h3>
        <div
          id="dicomViewer"
          className="w-full h-96 border border-gray-300"
          style={{ backgroundColor: '#000' }}
        ></div>
      </div>
    </div>
  );
};

export default DicomData;