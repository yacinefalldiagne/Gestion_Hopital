import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ReportPage = () => {
  const { patientId } = useParams();
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState('');
  const [editReport, setEditReport] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState(null);

  // Récupérer les rapports du patient
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Vous devez être connecté pour accéder aux rapports.');
        }
        const res = await axios.get(`http://localhost:5000/api/reports/patient/${patientId}`, {
          headers: { 'x-auth-token': token },
        });
        setReports(res.data);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la récupération des rapports';
        console.error('Erreur:', errorMessage);
        setError(errorMessage);
      }
    };
    fetchReports();
  }, [patientId]);

  // Ajouter un nouveau rapport
  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newReport.trim()) {
      setError('Le contenu du rapport ne peut pas être vide');
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/reports',
        { patientId, content: newReport },
        { headers: { 'x-auth-token': token } }
      );
      setReports([res.data.report, ...reports]);
      setNewReport('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création du rapport';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  // Modifier un rapport
  const handleEditReport = async (reportId, e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      setError('Le contenu du rapport ne peut pas être vide');
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/reports/${reportId}`,
        { content: editContent },
        { headers: { 'x-auth-token': token } }
      );
      setReports(
        reports.map((report) =>
          report._id === reportId ? res.data.report : report
        )
      );
      setEditReport(null);
      setEditContent('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du rapport';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  // Supprimer un rapport
  const handleDeleteReport = async (reportId, e) => {
    e.preventDefault();
    if (!window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) {
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/reports/${reportId}`, {
        headers: { 'x-auth-token': token },
      });
      setReports(reports.filter((report) => report._id !== reportId));
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du rapport';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-white rounded-xl shadow-md mx-10">
      <h2 className="text-2xl font-semibold mb-6">Rapports du Patient</h2>

      {/* Formulaire pour ajouter un nouveau rapport */}
      <div className="w-full max-w-2xl mb-8">
        <h3 className="text-lg font-medium mb-4">Ajouter un Rapport</h3>
        <form onSubmit={handleAddReport} className="flex flex-col gap-4">
          <textarea
            value={newReport}
            onChange={(e) => setNewReport(e.target.value)}
            placeholder="Entrez le contenu du rapport..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </form>
      </div>

      {/* Liste des rapports */}
      <div className="w-full max-w-2xl mt-8">
        <h3 className="text-lg font-medium mb-4">Rapports Existants</h3>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        {reports.length === 0 ? (
          <p className="text-gray-500">Aucun rapport trouvé.</p>
        ) : (
          <ul className="space-y-4">
            {reports.map((report) => (
              <li key={report._id} className="bg-gray-100 p-4 rounded-lg">
                {editReport === report._id ? (
                  <form onSubmit={(e) => handleEditReport(report._id, e)} className="flex flex-col gap-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditReport(null);
                          setEditContent('');
                        }}
                        className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-700">{report.content}</p>
                    <p className="text-sm text-gray-500">
                      Créé le : {new Date(report.createdAt).toLocaleString()} par{' '}
                      {report.doctorId?.name || 'Médecin inconnu'}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditReport(report._id);
                          setEditContent(report.content);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteReport(report._id, e)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReportPage;