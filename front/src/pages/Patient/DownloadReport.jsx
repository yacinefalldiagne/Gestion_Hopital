import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';

const DownloadReport = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/reports/user/${user._id}`, {
        withCredentials: true,
      });
      setReports(response.data);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des rapports';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user._id || user.role !== 'patient') {
      setLoading(false);
      setError('Accès réservé aux patients. Veuillez vous connecter.');
      return;
    }
    fetchReports();
  }, [user, authLoading]);

  const handleDownloadPDF = (report) => {
    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(0, 123, 255);
    doc.text('Compte Rendu Médical', 105, y, { align: 'center' });
    y += 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 123, 255);
    doc.line(margin, y, 210 - margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(0, 123, 255);
    doc.text('Informations du Patient', margin, y);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Nom: ${report.patient.name}`, margin, y);
    y += 7;
    doc.text(`Date de Consultation: ${new Date(report.consultationDate).toLocaleDateString('fr-FR')}`, margin, y);
    y += 7;
    doc.text(`Email: ${report.patient.email}`, margin, y);
    y += 7;
    doc.text(`Date de Naissance: ${report.patient.dateNaissance || 'Non spécifiée'}`, margin, y);
    y += 7;
    doc.text(`Sexe: ${report.patient.sexe || 'Non spécifié'}`, margin, y);
    y += 7;
    doc.text(`Groupe Sanguin: ${report.patient.groupeSanguin || 'Non spécifié'}`, margin, y);
    y += 7;
    doc.text(`Téléphone: ${report.patient.numeroTelephone || 'Non spécifié'}`, margin, y);
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Médecin Responsable', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Nom: ${report.doctor.name}`, margin, y);
    y += 7;
    doc.text(`Spécialité: ${report.doctor.specialite}`, margin, y);
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Antécédents Médicaux', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const antecedentText = report.patient.antecedent || 'Aucun antécédent spécifié';
    const antecedentLines = doc.splitTextToSize(antecedentText, 180);
    doc.text(antecedentLines, margin, y);
    y += antecedentLines.length * 7 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Histoire de la Maladie', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const findingsText = report.findings || 'Aucune observation spécifiée';
    const findingsLines = doc.splitTextToSize(findingsText, 180);
    doc.text(findingsLines, margin, y);
    y += findingsLines.length * 7 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Diagnostic', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const diagnosisText = report.diagnosis || 'Non spécifié';
    const diagnosisLines = doc.splitTextToSize(diagnosisText, 180);
    doc.text(diagnosisLines, margin, y);
    y += diagnosisLines.length * 7 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Examen Clinique', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const notesText = report.notes || 'Aucune note spécifiée';
    const notesLines = doc.splitTextToSize(notesText, 180);
    doc.text(notesLines, margin, y);
    y += notesLines.length * 7 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Bilan Biologique et Recommandations', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const recommendationsText = report.recommendations || 'Aucune recommandation spécifiée';
    const recommendationsLines = doc.splitTextToSize(recommendationsText, 180);
    doc.text(recommendationsLines, margin, y);
    y += recommendationsLines.length * 7 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('Secrétariat Médical', margin, y);
    doc.line(margin, y + 1, margin + 50, y + 1);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text('Tél./Fax: 77 878 47 77', margin, y);
    y += 15;

    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    doc.line(margin, y, 210 - margin, y);
    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0);
    doc.text('Signature du Médecin: ________________________', 210 - margin - 60, y);
    y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 210 - margin - 60, y);

    doc.save(`rapport_${report._id}.pdf`);
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-600">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  if (!user || !user._id || user.role !== 'patient') {
    return (
      <div className="p-6">
        <p className="text-center text-red-600 font-semibold">
          Accès réservé aux patients. Veuillez vous connecter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Mes comptes rendus</h1>
      {loading && <p className="text-center text-gray-600">Chargement...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div
                key={report._id}
                className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Médecin : {report.doctor?.name || 'Médecin inconnu'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Résumé : {report.diagnosis || report.findings || report.recommendations || report.notes || 'Non spécifié'}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF(report)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Télécharger PDF
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">Aucun compte-rendu disponible.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DownloadReport;