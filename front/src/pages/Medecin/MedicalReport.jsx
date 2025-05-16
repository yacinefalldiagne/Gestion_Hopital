import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave, FaNotesMedical } from 'react-icons/fa';

function MedicalReports() {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    // Récupérer les données du patient et des rapports
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Récupérer les détails du patient
                const patientResponse = await axios.get(
                    `http://localhost:5000/api/patients/details?userId=${patientId}`,
                    { withCredentials: true }
                );
                setPatient(patientResponse.data);

                // Récupérer les rapports
                const reportsResponse = await axios.get(
                    `http://localhost:5000/api/reports/user/${patientId}`,
                    { withCredentials: true }
                );
                setReports(reportsResponse.data || []);

            } catch (err) {
                console.error('Erreur lors de la récupération des données:', err);
                setError(err.response?.data?.message || 'Erreur lors de la récupération des données');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    // Gestion des changements dans le formulaire de nouveau rapport
    const handleNewReportChange = (e) => {
        const { name, value } = e.target;
        setNewReport(prev => ({ ...prev, [name]: value }));
    };

    // Gestion des changements dans le formulaire de modification de rapport
    const handleEditContentChange = (e) => {
        const { name, value } = e.target;
        setEditContent(prev => ({ ...prev, [name]: value }));
    };

    // Ajouter un nouveau rapport
    const handleAddReport = async (e) => {
        e.preventDefault();
        if (!newReport.findings.trim() || !newReport.diagnosis.trim()) {
            toast.error('Les champs Observations et Diagnostic sont obligatoires');
            return;
        }
        try {
            setLoading(true);
            const res = await axios.post(
                'http://localhost:5000/api/reports',
                { patientId, ...newReport },
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
            toast.success('Rapport ajouté avec succès');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la création du rapport';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Modifier un rapport
    const handleEditReport = async (reportId, e) => {
        e.preventDefault();
        if (!editContent.findings.trim() || !editContent.diagnosis.trim()) {
            toast.error('Les champs Observations et Diagnostic sont obligatoires');
            return;
        }
        try {
            setLoading(true);
            await axios.put(
                `http://localhost:5000/api/reports/${reportId}`,
                editContent,
                { withCredentials: true }
            );
            setReports(
                reports.map(report =>
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
            toast.success('Rapport modifié avec succès');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du rapport';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Supprimer un rapport
    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) return;
        try {
            setLoading(true);
            await axios.delete(`http://localhost:5000/api/reports/${reportId}`, {
                withCredentials: true,
            });
            setReports(reports.filter(report => report._id !== reportId));
            toast.success('Rapport supprimé avec succès');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression du rapport';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Imprimer un rapport
    const handlePrintReport = (report) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Rapport - ${patient.prenom} ${patient.nom}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #2d2d2d; line-height: 1.5; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
            .title { flex-grow: 1; text-align: center; font-size: 22px; font-weight: bold; color: #007bff; text-transform: uppercase; }
            .container { max-width: 900px; margin: 0 auto; }
            .section { margin-bottom: 20px; border-left: 3px solid #007bff; padding-left: 10px; }
            .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #007bff; margin-bottom: 8px; }
            .section-content { font-size: 14px; }
            .section-content p { margin: 4px 0; }
            .signature { margin-top: 40px; text-align: right; font-size: 14px; font-style: italic; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">Compte Rendu Médical</div>
            </div>
            <div class="section">
              <div class="section-title">Informations du Patient</div>
              <div class="section-content">
                <p><strong>Nom :</strong> ${patient.prenom} ${patient.nom}</p>
                <p><strong>Date de Consultation :</strong> ${new Date(report.consultationDate).toLocaleDateString('fr-FR')}</p>
                <p><strong>Email :</strong> ${patient.email || 'Non spécifié'}</p>
                <p><strong>Téléphone :</strong> ${patient.phone || 'Non spécifié'}</p>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Observations</div>
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
              <div class="section-title">Recommandations</div>
              <div class="section-content">
                <p>${report.recommendations || 'Aucune recommandation spécifiée'}</p>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Notes</div>
              <div class="section-content">
                <p>${report.notes || 'Aucune note spécifiée'}</p>
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600 text-lg">
                {error || 'Aucun patient trouvé'}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <ToastContainer />
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to={`/medecin/patient/${patientId}`} className="text-gray-600 hover:text-gray-800 transition-colors">
                            <FaArrowLeft className="text-2xl" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Rapports Médicaux - {patient.prenom} {patient.nom}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Section */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <FaNotesMedical className="mr-2 text-blue-600" />
                            Rapports Médicaux
                        </h2>
                        <button
                            onClick={() => setEditReport('new')}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FaPlus />
                            <span>Ajouter un Rapport</span>
                        </button>
                    </div>
                    {editReport === 'new' && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-medium mb-4">Nouveau Rapport</h3>
                            <form onSubmit={handleAddReport} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600">Date de Consultation *</label>
                                    <input
                                        type="date"
                                        name="consultationDate"
                                        value={newReport.consultationDate}
                                        onChange={handleNewReportChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">Observations *</label>
                                    <textarea
                                        name="findings"
                                        value={newReport.findings}
                                        onChange={handleNewReportChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="4"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">Diagnostic *</label>
                                    <textarea
                                        name="diagnosis"
                                        value={newReport.diagnosis}
                                        onChange={handleNewReportChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">Recommandations</label>
                                    <textarea
                                        name="recommendations"
                                        value={newReport.recommendations}
                                        onChange={handleNewReportChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={newReport.notes}
                                        onChange={handleNewReportChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditReport(null)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        disabled={loading}
                                    >
                                        <FaSave />
                                        <span>Enregistrer</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {reports.length === 0 ? (
                        <p className="text-gray-500">Aucun rapport trouvé.</p>
                    ) : (
                        <div className="space-y-4">
                            {reports.map(report => (
                                <div key={report._id} className="bg-gray-50 rounded-lg p-4">
                                    {editReport === report._id ? (
                                        <form onSubmit={(e) => handleEditReport(report._id, e)} className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-gray-600">Date de Consultation *</label>
                                                <input
                                                    type="date"
                                                    name="consultationDate"
                                                    value={editContent.consultationDate}
                                                    onChange={handleEditContentChange}
                                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600">Observations *</label>
                                                <textarea
                                                    name="findings"
                                                    value={editContent.findings}
                                                    onChange={handleEditContentChange}
                                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="4"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600">Diagnostic *</label>
                                                <textarea
                                                    name="diagnosis"
                                                    value={editContent.diagnosis}
                                                    onChange={handleEditContentChange}
                                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600">Recommandations</label>
                                                <textarea
                                                    name="recommendations"
                                                    value={editContent.recommendations}
                                                    onChange={handleEditContentChange}
                                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600">Notes</label>
                                                <textarea
                                                    name="notes"
                                                    value={editContent.notes}
                                                    onChange={handleEditContentChange}
                                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditReport(null)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    disabled={loading}
                                                >
                                                    <FaSave />
                                                    <span>Enregistrer</span>
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-2">
                                            <p><strong>Date :</strong> {new Date(report.consultationDate).toLocaleDateString('fr-FR')}</p>
                                            <p><strong>Observations :</strong> {report.findings}</p>
                                            <p><strong>Diagnostic :</strong> {report.diagnosis}</p>
                                            <p><strong>Recommandations :</strong> {report.recommendations || 'Aucune'}</p>
                                            <p><strong>Notes :</strong> {report.notes || 'Aucune'}</p>
                                            <p className="text-sm text-gray-500">
                                                Créé le : {new Date(report.createdAt).toLocaleString('fr-FR')}
                                            </p>
                                            <div className="flex space-x-3">
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
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReport(report._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FaTrash />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintReport(report)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <FaSave />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MedicalReports;
