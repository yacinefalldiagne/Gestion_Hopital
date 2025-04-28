import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Printer } from 'lucide-react';

const ReportPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    consultationDate: new Date().toISOString().split('T')[0],
    findings: '',
    diagnosis: '',
    recommendations: '',
    notes: '',
  });
  const [editReport, setEditReport] = useState(null);
  const [editContent, setEditContent] = useState({
    consultationDate: '',
    findings: '',
    diagnosis: '',
    recommendations: '',
    notes: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/patients', {
          withCredentials: true,
        });
        console.log('Raw patients data:', res.data); // Debug backend response
        const transformedPatients = res.data.map((patient) => ({
          id: patient.id || patient._id || patient.userId, // Fallback to ensure ID
          name: patient.name || `${patient.prenom || ''} ${patient.nom || ''}`.trim(),
        }));
        console.log('Transformed patients:', transformedPatients); // Debug transformed data
        setPatients(transformedPatients);
        if (!transformedPatients.length) {
          setError('Aucun patient trouvé');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la récupération des patients';
        console.error('Erreur:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch reports when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const fetchReports = async () => {
        try {
          setError(null);
          setLoading(true);
          const res = await axios.get(`http://localhost:5000/api/reports/user/${selectedPatient}`, {
            withCredentials: true,
          });
          setReports(res.data);
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la récupération des rapports';
          console.error('Erreur:', errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchReports();
    } else {
      setReports([]);
    }
  }, [selectedPatient]);

  // Handle input changes for new report
  const handleNewReportChange = (e) => {
    const { name, value } = e.target;
    setNewReport((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input changes for editing report
  const handleEditContentChange = (e) => {
    const { name, value } = e.target;
    setEditContent((prev) => ({ ...prev, [name]: value }));
  };

  // Add a new report
  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient');
      return;
    }
    if (!newReport.findings.trim() || !newReport.diagnosis.trim()) {
      setError('Les champs Observations et Diagnostic sont obligatoires');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      console.log('Adding report for patient ID:', selectedPatient); // Debug
      const res = await axios.post(
        'http://localhost:5000/api/reports',
        { patientId: selectedPatient, ...newReport },
        { withCredentials: true }
      );
      setReports([res.data.report, ...reports]);
      setNewReport({
        consultationDate: new Date().toISOString().split('T')[0],
        findings: '',
        diagnosis: '',
        recommendations: '',
        notes: '',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création du rapport';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Edit a report
  const handleEditReport = async (reportId, e) => {
    e.preventDefault();
    if (!editContent.findings.trim() || !editContent.diagnosis.trim()) {
      setError('Les champs Observations et Diagnostic sont obligatoires');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await axios.put(
        `http://localhost:5000/api/reports/${reportId}`,
        editContent,
        { withCredentials: true }
      );
      setReports(
        reports.map((report) =>
          report._id === reportId ? { ...report, ...editContent } : report
        )
      );
      setEditReport(null);
      setEditContent({
        consultationDate: '',
        findings: '',
        diagnosis: '',
        recommendations: '',
        notes: '',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du rapport';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete a report
  const handleDeleteReport = async (reportId, e) => {
    e.preventDefault();
    if (!window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) {
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/reports/${reportId}`, {
        withCredentials: true,
      });
      setReports(reports.filter((report) => report._id !== reportId));
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du rapport';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = (report) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport - ${report.patient.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 30px;
              color: #2d2d2d;
              line-height: 1.5;
            }
            .header {
              display: flex;
              align-items: center;
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .logo {
              width: 80px;
              height: auto;
              margin-right: 20px;
            }
            .title {
              flex-grow: 1;
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              color: #007bff;
              text-transform: uppercase;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
            }
            .two-columns {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .column {
              width: 48%;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .section {
              margin-bottom: 20px;
              border-left: 3px solid #007bff;
              padding-left: 10px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              color: #007bff;
              margin-bottom: 8px;
            }
            .section-content {
              font-size: 14px;
            }
            .section-content p {
              margin: 4px 0;
            }
            .contact-section {
              background-color: #e9ecef;
              padding: 10px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .signature {
              margin-top: 40px;
              text-align: right;
              font-size: 14px;
              font-style: italic;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/src/assets/image/logo.png" alt="Logo" class="logo" />
              <div class="title">Compte Rendu Médical</div>
            </div>

            <div class="two-columns">
              <div class="column">
                <div class="section-title">Informations du Patient</div>
                <div class="section-content">
                  <p><strong>Nom :</strong> ${report.patient.name}</p>
                  <p><strong>Date de Consultation :</strong> ${new Date(report.consultationDate).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Email :</strong> ${report.patient.email}</p>
                  <p><strong>Date de Naissance :</strong> ${report.patient.dateNaissance || 'Non spécifiée'}</p>
                  <p><strong>Sexe :</strong> ${report.patient.sexe || 'Non spécifié'}</p>
                  <p><strong>Groupe Sanguin :</strong> ${report.patient.groupeSanguin || 'Non spécifié'}</p>
                  <p><strong>Téléphone :</strong> ${report.patient.numeroTelephone || 'Non spécifié'}</p>
                </div>
              </div>
              <div class="column">
                <div class="section-title">Médecin Responsable</div>
                <div class="section-content">
                  <p><strong>Nom :</strong> ${report.doctor.name}</p>
                  <p><strong>Spécialité :</strong> ${report.doctor.specialite}</p>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Antécédents Médicaux</div>
              <div class="section-content">
                <p>${report.patient.antecedent || 'Aucun antécédent spécifié'}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Histoire de la Maladie</div>
              <div class="section-content">
                <p>${report.findings || 'Aucune observation spécifiée'}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Diagnostic</div>
              <div class="section-content">
                <p>${report.diagnosis || 'Non spécifié'}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Examen Clinique</div>
              <div class="section-content">
                <p>${report.notes || 'Aucune note spécifiée'}</p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Bilan Biologique et Recommandations</div>
              <div class="section-content">
                <p>${report.recommendations || 'Aucune recommandation spécifiée'}</p>
              </div>
            </div>

            <div class="contact-section">
              <div class="section-title">Secrétariat Médical</div>
              <div class="section-content">
                <p><strong>Tél./Fax :</strong> 77 878 47 77</p>
              </div>
            </div>

            <div class="signature">
              <p>Signature du Médecin : ________________________</p>
              <p>Date : ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-white rounded-xl shadow-md mx-4 sm:mx-10">
      <h2 className="text-2xl font-semibold mb-6">Rapports Médicaux</h2>

      {/* Patient selection dropdown */}
      <div className="w-full max-w-2xl mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un Patient *
        </label>
        <select
          value={selectedPatient}
          onChange={(e) => {
            console.log('Selected patient ID:', e.target.value);
            setSelectedPatient(e.target.value);
          }}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          required
        >
          <option value="">Choisir un patient</option>
          {patients.length === 0 && !loading ? (
            <option disabled>Aucun patient disponible</option>
          ) : (
            patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Form for adding a new report */}
      {selectedPatient && (
        <div className="w-full max-w-2xl mb-8">
          <h3 className="text-lg font-medium mb-4">Ajouter un Rapport</h3>
          <form onSubmit={handleAddReport} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date de Consultation *
              </label>
              <input
                type="date"
                name="consultationDate"
                value={newReport.consultationDate}
                onChange={handleNewReportChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observations *
              </label>
              <textarea
                name="findings"
                value={newReport.findings}
                onChange={handleNewReportChange}
                placeholder="Symptômes, résultats d'examen clinique..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Diagnostic *
              </label>
              <textarea
                name="diagnosis"
                value={newReport.diagnosis}
                onChange={handleNewReportChange}
                placeholder="Diagnostic principal et secondaire..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recommandations
              </label>
              <textarea
                name="recommendations"
                value={newReport.recommendations}
                onChange={handleNewReportChange}
                placeholder="Médicaments, procédures, rendez-vous futurs..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={newReport.notes}
                onChange={handleNewReportChange}
                placeholder="Commentaires supplémentaires..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className={`flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </form>
        </div>
      )}

      {/* List of existing reports */}
      {selectedPatient && (
        <div className="w-full max-w-2xl mt-8">
          <h3 className="text-lg font-medium mb-4">Rapports Existants</h3>
          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
          {loading && <p className="text-gray-500 text-center">Chargement...</p>}
          {!loading && reports.length === 0 ? (
            <p className="text-gray-500">Aucun rapport trouvé.</p>
          ) : (
            <ul className="space-y-4">
              {reports.map((report) => (
                <li key={report._id} className="bg-gray-100 p-4 rounded-lg">
                  {editReport === report._id ? (
                    <form onSubmit={(e) => handleEditReport(report._id, e)} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date de Consultation *
                        </label>
                        <input
                          type="date"
                          name="consultationDate"
                          value={editContent.consultationDate}
                          onChange={handleEditContentChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Observations *
                        </label>
                        <textarea
                          name="findings"
                          value={editContent.findings}
                          onChange={handleEditContentChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="4"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Diagnostic *
                        </label>
                        <textarea
                          name="diagnosis"
                          value={editContent.diagnosis}
                          onChange={handleEditContentChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Recommandations
                        </label>
                        <textarea
                          name="recommendations"
                          recesses value={editContent.recommendations}
                          onChange={handleEditContentChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={editContent.notes}
                          onChange={handleEditContentChange}
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          disabled={loading}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className={`bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={loading}
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditReport(null);
                            setEditContent({
                              consultationDate: '',
                              findings: '',
                              diagnosis: '',
                              recommendations: '',
                              notes: '',
                            });
                          }}
                          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                          disabled={loading}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Patient</h4>
                        <p className="text-gray-700">{report.patient.name}</p>
                      </div>
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Médecin</h4>
                        <p className="text-gray-700">{report.doctor.name} ({report.doctor.specialite})</p>
                      </div>
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Date de Consultation</h4>
                        <p className="text-gray-700">{new Date(report.consultationDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Observations</h4>
                        <p className="text-gray-700">{report.findings}</p>
                      </div>
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Diagnostic</h4>
                        <p className="text-gray-700">{report.diagnosis}</p>
                      </div>
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Recommandations</h4>
                        <p className="text-gray-700">{report.recommendations || 'Aucune'}</p>
                      </div>
                      <div className="section">
                        <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                        <p className="text-gray-700">{report.notes || 'Aucune'}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Créé le : {new Date(report.createdAt).toLocaleString('fr-FR')}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditReport(report._id);
                            setEditContent({
                              consultationDate: new Date(report.consultationDate).toISOString().split('T')[0],
                              findings: report.findings,
                              diagnosis: report.diagnosis,
                              recommendations: report.recommendations || '',
                              notes: report.notes || '',
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifier"
                          disabled={loading}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteReport(report._id, e)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                          disabled={loading}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrintReport(report)}
                          className="text-green-600 hover:text-green-800"
                          title="Imprimer"
                          disabled={loading}
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportPage;