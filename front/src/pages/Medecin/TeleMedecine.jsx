import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function TeleMedecine() {
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    symptoms: '',
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [receivedConsultations, setReceivedConsultations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [loading, setLoading] = useState({ doctors: true, consultations: true, messages: false });
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', { withCredentials: true });
        setUserId(response.data.id);
      } catch (err) {
        setError('Erreur lors de la récupération de l’utilisateur.');
        console.error('Erreur:', err);
      }
    };

    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/medecins', { withCredentials: true });
        setDoctorsList(response.data);
        setLoading((prev) => ({ ...prev, doctors: false }));
      } catch (err) {
        setError('Erreur lors de la récupération des médecins.');
        setLoading((prev) => ({ ...prev, doctors: false }));
        console.error('Erreur:', err);
      }
    };

    const fetchReceivedConsultations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/telemedecine/consultations', { withCredentials: true });
        setReceivedConsultations(response.data);
        setLoading((prev) => ({ ...prev, consultations: false }));
      } catch (err) {
        setError('Erreur lors de la récupération des consultations.');
        setLoading((prev) => ({ ...prev, consultations: false }));
        console.error('Erreur:', err);
      }
    };

    fetchUser();
    fetchDoctors();
    fetchReceivedConsultations();

    socket.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('connect_error', (err) => {
      console.error('Erreur de connexion Socket.IO:', err.message);
      setError('Erreur de connexion au chat. Veuillez vérifier votre réseau.');
    });

    return () => {
      socket.off('newMessage');
      socket.off('connect_error');
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData({ ...patientData, [name]: value });
  };

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles([...files, ...uploadedFiles]);
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('=== DÉBUT handleSubmit ===');
  
  if (!selectedDoctor) {
    setError('Veuillez sélectionner un médecin destinataire.');
    return;
  }

  console.log('Données à envoyer:');
  console.log('- patientData:', patientData);
  console.log('- selectedDoctor:', selectedDoctor);
  console.log('- files:', files);
  console.log('- nombre de fichiers:', files.length);

  const formData = new FormData();
  
  // Vérification des données avant envoi
  try {
    const patientDataString = JSON.stringify(patientData);
    console.log('patientData JSON:', patientDataString);
    formData.append('patientData', patientDataString);
  } catch (jsonError) {
    console.error('Erreur JSON stringify:', jsonError);
    setError('Erreur dans le formatage des données patient.');
    return;
  }

  formData.append('recipientDoctorId', selectedDoctor);
  
  // Ajout des fichiers avec vérification
  files.forEach((file, index) => {
    console.log(`Ajout fichier ${index}:`, file.name, file.size, 'bytes');
    formData.append('files', file);
  });

  // Log du contenu FormData (pour debug)
  console.log('Contenu FormData:');
  for (let pair of formData.entries()) {
    if (pair[1] instanceof File) {
      console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
    } else {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
  }

  try {
    console.log('Envoi de la requête...');
    
    const response = await axios.post('http://localhost:5000/api/telemedecine', formData, {
      withCredentials: true,
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000, // 30 secondes timeout
    });

    console.log('Réponse reçue:', response.data);
    
    // Reset du formulaire
    setPatientData({ name: '', age: '', symptoms: '', notes: '' });
    setFiles([]);
    setSelectedDoctor('');
    setError(null);
    
    alert('Consultation envoyée avec succès !');
    console.log('=== FIN handleSubmit (SUCCÈS) ===');

  } catch (err) {
    console.error('=== ERREUR handleSubmit ===');
    console.error('Erreur complète:', err);
    
    if (err.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error('Status:', err.response.status);
      console.error('Headers:', err.response.headers);
      console.error('Data:', err.response.data);
      
      const errorMessage = err.response.data?.message || 'Erreur serveur';
      const debugInfo = err.response.data?.debug || '';
      
      setError(`${errorMessage}${debugInfo ? ` (Debug: ${debugInfo})` : ''}`);
      
      // Afficher les détails complets en console pour le développeur
      if (err.response.data?.stack) {
        console.error('Stack trace serveur:', err.response.data.stack);
      }
      
      if (err.response.data?.errors) {
        console.error('Erreurs détaillées:', err.response.data.errors);
      }
      
    } else if (err.request) {
      // Pas de réponse du serveur
      console.error('Pas de réponse du serveur');
      console.error('Request:', err.request);
      setError('Pas de réponse du serveur. Vérifiez votre connexion.');
      
    } else {
      // Erreur dans la configuration de la requête
      console.error('Erreur configuration requête:', err.message);
      setError(`Erreur requête: ${err.message}`);
    }
    
    console.error('=== FIN ERREUR ===');
  }
};

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConsultationId && userId) {
      socket.emit('sendMessage', {
        consultationId: selectedConsultationId,
        senderId: userId,
        message: newMessage,
      });
      setNewMessage('');
    }
  };

  const selectConsultation = async (consultationId) => {
    setSelectedConsultationId(consultationId);
    socket.emit('joinConsultation', consultationId);
    setLoading((prev) => ({ ...prev, messages: true }));
    try {
      const response = await axios.get(`http://localhost:5000/api/telemedecine/messages/${consultationId}`, {
        withCredentials: true,
      });
      setMessages(response.data);
      setLoading((prev) => ({ ...prev, messages: false }));
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des messages.');
      setLoading((prev) => ({ ...prev, messages: false }));
      console.error('Erreur:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-yellow-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8 px-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <h1 className="text-3xl font-extrabold tracking-tight">Télémédecine</h1>
          </div>
          <p className="text-sm font-medium">Collaborer en temps réel avec vos collègues médecins</p>
        </div>

        {/* Corps */}
        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Section envoi de consultation */}
          <div className="bg-blue-50 rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Envoyer une demande de consultation</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                  Médecin destinataire
                </label>
                {loading.doctors ? (
                  <div className="mt-1 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600"></div>
                  </div>
                ) : (
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition duration-200"
                    required
                  >
                    <option value="">Sélectionnez un médecin</option>
                    {doctorsList.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nom du patient
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={patientData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition duration-200"
                    placeholder="Entrez le nom du patient"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Âge du patient
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={patientData.age}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition duration-200"
                    placeholder="Entrez l'âge"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                  Symptômes
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  value={patientData.symptoms}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition duration-200"
                  placeholder="Décrivez les symptômes du patient"
                  required
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes supplémentaires
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={patientData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition duration-200"
                  placeholder="Ajoutez des notes (facultatif)"
                />
              </div>
              <div>
                <label htmlFor="files" className="block text-sm font-medium text-gray-700">
                  Joindre des fichiers
                </label>
                <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition duration-200">
                  <div className="space-y-2 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="files" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-700">
                        <span>Choisir des fichiers</span>
                        <input
                          id="files"
                          name="files"
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-2">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">Images ou PDF, jusqu'à 10MB</p>
                  </div>
                </div>
              </div>
              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Fichiers sélectionnés :</h3>
                  <ul className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <li key={index} className="pl-4 pr-5 py-3 flex items-center justify-between text-sm hover:bg-yellow-50 transition duration-200">
                        <div className="w-0 flex-1 flex items-center">
                          <svg className="flex-shrink-0 h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button type="button" onClick={() => removeFile(index)} className="font-medium text-red-600 hover:text-red-700">
                            Supprimer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200"
                >
                  Envoyer pour consultation
                </button>
              </div>
            </form>
          </div>

          {/* Section consultations reçues et chat */}
          <div className="bg-green-50 rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Consultations reçues</h2>
            {loading.consultations ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
              </div>
            ) : receivedConsultations.length === 0 ? (
              <p className="text-gray-500 text-center">Aucune consultation reçue pour le moment.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {receivedConsultations.map((consultation, index) => (
                  <div
                    key={index}
                    onClick={() => selectConsultation(consultation._id)}
                    className={`border border-gray-200 rounded-lg p-6 cursor-pointer transition duration-200 ${
                      selectedConsultationId === consultation._id ? 'bg-yellow-100 border-yellow-500' : 'hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        <strong>Patient :</strong> {consultation.patientData.name}, {consultation.patientData.age} ans
                      </p>
                      <span className="text-xs text-blue-600">{new Date(consultation.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm"><strong>Symptômes :</strong> {consultation.patientData.symptoms}</p>
                    <p className="text-sm"><strong>Notes :</strong> {consultation.patientData.notes || 'Aucune'}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">Fichiers :</p>
                    <ul className="list-disc pl-5 text-sm">
                      {consultation.files.map((file, fileIndex) => (
                        <li key={fileIndex}>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {file.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Discussion</h2>
              <div className="border border-gray-200 rounded-lg p-6 h-80 overflow-y-auto mb-4 bg-white">
                {loading.messages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500 text-center">Aucun message pour le moment.</p>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className={`mb-4 ${msg.senderId === userId ? 'text-right' : 'text-left'}`}>
                      <p className={`inline-block p-3 rounded-lg max-w-xs ${msg.senderId === userId ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-gray-800'}`}>
                        <strong>{msg.senderId === userId ? 'Moi' : 'Autre'} :</strong> {msg.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                  placeholder="Écrire un message..."
                  disabled={!selectedConsultationId}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!selectedConsultationId}
                  className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition duration-200"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeleMedecine;