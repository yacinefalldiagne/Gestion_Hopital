import React, { useState, useRef } from 'react';
import { CloudUpload } from 'lucide-react';
import axios from 'axios';

const NonDicomUpload = ({ onUploadSuccess, isDicom = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileUpload = async (files) => {
    setError(null);
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    const formData = new FormData();
    newFiles.forEach((file) => formData.append('files', file));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour uploader des fichiers.');
      }
      const endpoint = isDicom
        ? 'http://localhost:5000/api/dicom/upload'
        : 'http://localhost:5000/api/nondicom/upload';
      const res = await axios.post(endpoint, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload réussi:', res.data);
      onUploadSuccess();
      setSelectedFiles([]); // Réinitialiser les fichiers sélectionnés après un upload réussi
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'upload';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragOver(true);
    } else if (e.type === 'dragleave') {
      setDragOver(false);
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current.click();
  };

  return (
    <div className="w-full max-w-2xl">
      <div
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onClick={handleClick}
        className={`w-full h-40 border-4 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <CloudUpload className="w-10 h-10 text-blue-500 mb-2" />
        <p className="text-gray-600 text-center">
          Glissez-déposez vos {isDicom ? 'images DICOM' : 'fichiers'} ici ou cliquez pour sélectionner
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={isDicom ? '.dcm,image/dicom' : '*'}
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          onClick={(e) => e.stopPropagation()} // Empêche la propagation du clic
        />
      </div>
      {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
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
  );
};

export default NonDicomUpload;