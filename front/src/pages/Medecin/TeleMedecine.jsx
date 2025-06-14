import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { FaUser } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

const socket = io('http://localhost:5000', {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function TeleMedecine() {
  const [patientData, setPatientData] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [receivedConsultations, setReceivedConsultations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [loading, setLoading] = useState({ doctors: true, patients: true, consultations: true, messages: false });
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', { withCredentials: true });
        setUserId(response.data.id);
      } catch (err) {
        console.error('Fetch user error:', err.response?.status, err.response?.data);
        setError('Erreur lors de la récupération de l’utilisateur.');
      }
    };

    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/medecins', { withCredentials: true });
        setDoctorsList(Array.isArray(response.data) ? response.data : []);
        setLoading((prev) => ({ ...prev, doctors: false }));
      } catch (err) {
        console.error('Fetch doctors error:', err.response?.status, err.response?.data);
        setError('Erreur lors de la récupération des médecins.');
        setDoctorsList([]);
        setLoading((prev) => ({ ...prev, doctors: false }));
      }
    };

    const fetchPatients = async () => {
      try {
        setLoading((prev) => ({ ...prev, patients: true }));
        const response = await axios.get('http://localhost:5000/api/patients', { withCredentials: true });
        console.log('Patients response:', response.data);
        setPatientsList(Array.isArray(response.data) ? response.data : []);
        setLoading((prev) => ({ ...prev, patients: false }));
      } catch (err) {
        console.error('Fetch patients error:', err.response?.status, err.response?.data);
        setError('Erreur lors de la récupération des patients.');
        setPatientsList([]);
        setLoading((prev) => ({ ...prev, patients: false }));
      }
    };

    const fetchReceivedConsultations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/telemedecine/consultations', { withCredentials: true });
        setReceivedConsultations(Array.isArray(response.data) ? response.data : []);
        setLoading((prev) => ({ ...prev, consultations: false }));
      } catch (err) {
        console.error('Fetch consultations error:', err.response?.status, err.response?.data);
        setError('Erreur lors de la récupération des consultations.');
        setLoading((prev) => ({ ...prev, consultations: false }));
      }
    };

    fetchUser();
    fetchDoctors();
    fetchPatients();
    fetchReceivedConsultations();

    socket.on('connect', () => {
      console.log('Socket.IO connected.');
    });
    socket.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      setError('Connexion au chat échouée. Fonctions de chat limitées.');
    });

    return () => {
      socket.off('connect');
      socket.off('newMessage');
      socket.off('connect_error');
    };
  }, []);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (selectedPatientId) {
        try {
          setLoading((prev) => ({ ...prev, patients: true }));
          const patientResponse = await axios.get(
            `http://localhost:5000/api/patients/details?userId=${selectedPatientId}`,
            { withCredentials: true }
          );
          const dossierResponse = await axios.get(
            `http://localhost:5000/api/dossiers?patientId=${selectedPatientId}`,
            { withCredentials: true }
          );
          console.log('Patient details:', patientResponse.data);
          console.log('Dossier:', dossierResponse.data);
          setPatientData({
            ...patientResponse.data,
            dossier: dossierResponse.data[0] || null,
          });
          setError(null);
        } catch (err) {
          console.error('Fetch patient details error:', err.response?.status, err.response?.data);
          setError('Erreur lors de la récupération des détails du patient.');
          setPatientData(null);
        } finally {
          setLoading((prev) => ({ ...prev, patients: false }));
        }
      } else {
        setPatientData(null);
        setSelectedFiles([]);
      }
    };

    fetchPatientDetails();
  }, [selectedPatientId]);

  const handlePatientSearch = (e) => {
    setPatientSearch(e.target.value);
  };

  const filteredPatients = patientsList.filter((patient) => {
    const fullName = (patient.name || '').toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  console.log('Filtered patients:', filteredPatients);

  const toggleFileSelection = (item, type) => {
    const identifier = type === 'report' ? item._id : item.instanceId;
    if (selectedFiles.some((f) => f.identifier === identifier && f.type === type)) {
      setSelectedFiles(selectedFiles.filter((f) => !(f.identifier === identifier && f.type === type)));
    } else {
      setSelectedFiles([...selectedFiles, { ...item, type, identifier }]);
    }
  };

  const generateReportPDF = (report, patient) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Compte Rendu Médical', 105, 20, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    doc.setFontSize(12);
    doc.text('Informations du Patient', 20, 35);
    doc.text(`Nom: ${patient.name || `${patient.prenom} ${patient.nom}`}`, 20, 45);
    doc.text(`Date de Consultation: ${new Date(report.consultationDate).toLocaleDateString('fr-FR')}`, 20, 55);
    doc.text(`Email: ${patient.email || 'Non spécifié'}`, 20, 65);
    doc.text(`Téléphone: ${patient.phone || 'Non spécifié'}`, 20, 75);

    doc.text('Observations', 20, 95);
    doc.text(report.findings || 'Aucune observation spécifiée', 20, 105, { maxWidth: 170 });

    doc.text('Diagnostic', 20, 125);
    doc.text(report.diagnosis || 'Non spécifié', 20, 135, { maxWidth: 170 });

    doc.text('Recommandations', 20, 155);
    doc.text(report.recommendations || 'Aucune recommandation spécifiée', 20, 165, { maxWidth: 170 });

    doc.text('Notes', 20, 185);
    doc.text(report.notes || 'Aucune note spécifiée', 20, 195, { maxWidth: 170 });

    doc.setFontSize(10);
    doc.text(`Signature du Médecin: ________________________`, 140, 270);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 140, 280);

    return doc.output('blob');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setError('Veuillez sélectionner un médecin destinataire.');
      return;
    }

    const formData = new FormData();
    formData.append('patientData', JSON.stringify(patientData));
    formData.append('recipientDoctorId', selectedDoctor);
    files.forEach((file) => formData.append('files', file));

    try {
      await axios.post('http://localhost:5000/api/telemedecine', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPatientData({ name: '', age: '', symptoms: '', notes: '' });
      setFiles([]);
      setSelectedDoctor('');
      setError(null);
      // Afficher une notification de succès (à remplacer par react-toastify)
      alert('Consultation envoyée avec succès !');
    } catch (err) {
      setError('Erreur lors de l’envoi des données.');
      console.error('Erreur:', err);
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

  if (error && !patientsList.length && !doctorsList.length && !receivedConsultations.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-lg p-4 bg-red-100 rounded-lg">
          {error} Veuillez vérifier la connexion au serveur ou réessayer.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8 px-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <h1 className="text-3xl font-extrabold tracking-tight">Télémédecine</h1>
          </div>
          <p className="text-sm font-medium">Collaborer en temps réel avec vos collègues médecins</p>
        </div>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Envoyer une demande de consultation</h2>
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
                ) : doctorsList.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">Aucun médecin trouvé.</p>
                ) : (
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
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
              <div>
                <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700">
                  Rechercher ou sélectionner un patient
                </label>
                {loading.patients ? (
                  <div className="mt-1 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600"></div>
                  </div>
                ) : patientsList.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">Aucun patient trouvé.</p>
                ) : (
                  <>
                    <input
                      type="text"
                      id="patientSearch"
                      value={patientSearch}
                      onChange={handlePatientSearch}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                      placeholder="Rechercher un patient..."
                    />
                    <select
                      id="patient"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                      required
                    >
                      <option value="">Sélectionnez un patient</option>
                      {filteredPatients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                    {filteredPatients.length === 0 && patientSearch && (
                      <p className="mt-1 text-sm text-gray-500">Aucun patient correspond à la recherche.</p>
                    )}
                  </>
                )}
              </div>
              {patientData && (
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Détails du patient</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nom</p>
                        <p className="text-gray-900 font-medium">{patientData.name || `${patientData.prenom || ''} ${patientData.nom || ''}`.trim()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Âge</p>
                        <p className="text-gray-900 font-medium">
                          {patientData.dateNaissance
                            ? Math.floor((new Date() - new Date(patientData.dateNaissance)) / (365.25 * 24 * 60 * 60 * 1000))
                            : patientData.age || 'Non spécifié'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Sexe</p>
                        <p className="text-gray-900 font-medium">{patientData.sexe || 'Non spécifié'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Allergies</p>
                        <p className="text-gray-900 font-medium">
                          {patientData.allergies?.length > 0 ? patientData.allergies.join(', ') : 'Aucune'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Antécédents médicaux</p>
                        <p className="text-gray-900 font-medium">{patientData.antecedent || 'Aucun'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Groupe sanguin</p>
                        <p className="text-gray-900 font-medium">{patientData.groupeSanguin || 'Non spécifié'}</p>
                      </div>
                    </div>
                  </div>
                  {patientData.dossier ? (
                    <>
                      <h4 className="text-sm font-medium text-gray-700 mt-6">Images DICOM</h4>
                      <ul className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200">
                        {patientData.dossier.dicomImages?.length > 0 ? (
                          patientData.dossier.dicomImages.map((dicom) => (
                            <li
                              key={dicom.instanceId || dicom._id}
                              className="pl-4 pr-5 py-3 flex items-center justify-between text-sm hover:bg-blue-50 transition duration-200"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.some((f) => f.identifier === (dicom.instanceId || dicom._id) && f.type === 'dicom')}
                                  onChange={() => toggleFileSelection(dicom, 'dicom')}
                                  className="mr-2"
                                />
                                <span>{dicom.patientName || 'Image DICOM'} ({new Date(dicom.examDate).toLocaleDateString('fr-FR')})</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="pl-4 pr-5 py-3 text-sm text-gray-500">Aucune image DICOM</li>
                        )}
                      </ul>
                      <h4 className="text-sm font-medium text-gray-700 mt-6">Rapports médicaux</h4>
                      <ul className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200">
                        {patientData.dossier.reports?.length > 0 ? (
                          patientData.dossier.reports.map((report) => (
                            <li
                              key={report._id}
                              className="pl-4 pr-5 py-3 flex items-center justify-between text-sm hover:bg-blue-50 transition duration-200">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.some((f) => f.identifier === report._id && f.type === 'report')}
                                  onChange={() => toggleFileSelection(report, 'report')}
                                  className="mr-2"
                                />
                                <span>Rapport du {new Date(report.consultationDate).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="pl-4 pr-5 py-3 text-sm text-gray-500">Aucun rapport médical</li>
                        )}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 mt-4">Aucun dossier médical trouvé.</p>
                  )}
                </div>
              )}
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                >
                  Envoyer pour consultation
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Consultations reçues</h2>
            {loading.consultations ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
              </div>
            ) : receivedConsultations.length === 0 ? (
              <p className="text-gray-500 text-center">Aucune consultation reçue.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {receivedConsultations.map((consultation) => (
                  <div
                    key={consultation._id}
                    onClick={() => selectConsultation(consultation._id)}
                    className={`border border-gray-200 rounded-lg p-6 cursor-pointer transition duration-200 ${selectedConsultationId === consultation._id ? 'bg-blue-100 border-blue-500' : 'hover:bg-blue-50'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        <strong>Patient :</strong> {consultation.patientData?.name || 'Patient inconnu'}, {consultation.patientData?.age || 'Âge inconnu'} ans
                      </p>
                      <span className="text-xs text-blue-600">{new Date(consultation.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm"><strong>Allergies :</strong> {consultation.patientData?.allergies?.join(', ') || 'Aucune'}</p>
                    <p className="text-sm"><strong>Antécédents :</strong> {consultation.patientData?.antecedent || 'Aucun'}</p>
                    <p className="text-sm font-medium text-gray-700 mt-2">Fichiers :</p>
                    <ul className="list-disc pl-5 text-sm">
                      {(consultation.reports || []).map((file, index) => (
                        <li key={`report_${index}`}>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {file.name || `Rapport ${index + 1}`}
                          </a>
                        </li>
                      ))}
                      {(consultation.dicomUrls || []).map((url, index) => (
                        <li key={`dicom_${index}`}>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Image DICOM {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Discussion</h2>
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
                      <p className={`inline-block p-3 rounded-lg max-w-xs ${msg.senderId === userId ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
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