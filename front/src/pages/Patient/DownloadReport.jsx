import React from 'react';

const DownloadReport = () => {
  // Données simulées pour les rapports
  const reports = [
    {
      _id: '1',
      doctor: { name: 'Dr. Martin' },
      content: 'Rapport de consultation : le patient va bien.',
      createdAt: '2025-04-18T00:00:00Z',
    },
    {
      _id: '2',
      doctor: { name: 'Dr. Sophie' },
      content: 'Rapport de suivi : continuer le traitement.',
      createdAt: '2025-04-20T00:00:00Z',
    },
  ];

  const handleDownload = (reportId) => {
    // Simuler un téléchargement
    alert(`Téléchargement du rapport ${reportId} simulé !`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Compte-rendu</h1>
      {reports.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Médecin</th>
                <th className="py-2 px-4 border-b text-left">Contenu</th>
                <th className="py-2 px-4 border-b text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {report.doctor?.name || 'Médecin inconnu'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {report.content || 'Non spécifié'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleDownload(report._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Aucun compte-rendu disponible.</p>
      )}
    </div>
  );
};

export default DownloadReport;