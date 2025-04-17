import React, { useState } from 'react';
import { CloudUpload } from 'lucide-react';
import axios from 'axios';

const NonDicomUpload = ({ onUploadSuccess }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileUpload = async (files) => {
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    const formData = new FormData();
    newFiles.forEach(file => formData.append('files', file));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token JWT trouvé. Veuillez vous connecter.');
      }
      const res = await axios.post('http://localhost:5000/api/nondicom/upload', formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload réussi:', res.data);
      onUploadSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      className={`w-full max-w-2xl h-40 border-4 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-300 ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <CloudUpload className="w-10 h-10 text-blue-500 mb-2" />
      <p className="text-gray-600 text-center">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
      <input
        type="file"
        multiple
        className="opacity-0 absolute inset-0 cursor-pointer"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
    </div>
  );
};

export default NonDicomUpload;