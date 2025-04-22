import React from "react";
import { FaCalendarAlt, FaUser, FaFileMedical, FaChartLine, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";

// Enregistrer les composants nécessaires pour Chart.js, y compris Filler
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function MedecinDashboard() {
  // Données pour la courbe d'évaluations (simulées)
  const evaluationData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
    datasets: [
      {
        label: "Nombre de consultations",
        data: [30, 45, 50, 40, 60, 55],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
      {
        label: "Diagnostics effectués",
        data: [20, 30, 35, 25, 40, 45],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Évolution des consultations et diagnostics",
      },
    },
  };

  // Données simulées pour les rendez-vous
  const appointments = [
    { id: 1, patient: "Jean Dupont", time: "10:00", type: "Consultation générale" },
    { id: 2, patient: "Marie Claire", time: "11:30", type: "Suivi post-opératoire" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bienvenue Médecin</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col items-center p-6 bg-blue-100 rounded-lg shadow-sm">
          <FaCalendarAlt className="text-3xl text-blue-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">2</h2>
          <p className="text-gray-600">Rendez-vous aujourd'hui</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-pink-100 rounded-lg shadow-sm">
          <FaUser className="text-3xl text-pink-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">150</h2>
          <p className="text-gray-600">Patients suivis</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-green-100 rounded-lg shadow-sm">
          <FaFileMedical className="text-3xl text-green-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">3</h2>
          <p className="text-gray-600">Rapports en attente</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-yellow-100 rounded-lg shadow-sm">
          <FaChartLine className="text-3xl text-yellow-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">85%</h2>
          <p className="text-gray-600">Taux de satisfaction</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Courbe d'évaluations */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Évaluation des activités</h2>
          <Line data={evaluationData} options={chartOptions} />
        </div>

        {/* Rendez-vous à venir */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendez-vous à venir</h2>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">Mer, 16 Avr 2025</span>
            <div className="flex space-x-2">
              <button className="text-gray-600 hover:text-gray-800"><FaChevronLeft /></button>
              <button className="text-gray-600 hover:text-gray-800"><FaChevronRight /></button>
            </div>
          </div>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-800">{appointment.patient}</p>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                    <p className="text-sm text-gray-500">{appointment.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tâches rapides */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tâches rapides</h2>
          <div className="space-y-4">
            <Link to="/medecin/non-dicom" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
              <p className="font-medium text-gray-800">Consulter données non DICOM</p>
            </Link>
            <Link to="/medecin/dicom" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
              <p className="font-medium text-gray-800">Analyser image DICOM</p>
            </Link>
            <Link to="/medecin/report" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
              <p className="font-medium text-gray-800">Rédiger rapport</p>
            </Link>
            <Link to="/medecin/history" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
              <p className="font-medium text-gray-800">Historique des consultations</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedecinDashboard;