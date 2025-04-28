import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaUser,
  FaFileMedical,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function MedecinDashboard() {
  const daysOfWeek = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const [dashboardData, setDashboardData] = useState({
    statistics: { todayAppointments: 0, patientsFollowed: 0, pendingReports: 0, completedConsultations: 0 },
    appointments: [],
    chartData: { labels: [], consultations: [], diagnostics: [] },
    calendar: { month: "", firstDayOfMonth: 0, daysInMonth: 0, appointments: {} },
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:5000/api/dashboard/medecin?date=${selectedDate.toISOString()}&month=${month}&year=${year}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Échec de la récupération des données du tableau de bord");
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Erreur dans fetchDashboardData:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedDate, month, year]);

  // Handle month navigation
  const handleMonthChange = (direction) => {
    setMonth((prevMonth) => {
      let newMonth = prevMonth + direction;
      let newYear = year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      setYear(newYear);
      return newMonth;
    });
  };

  // Handle date navigation
  const handleDateChange = (direction) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + direction);
      return newDate;
    });
  };

  // Chart data
  const evaluationData = {
    labels: dashboardData.chartData.labels,
    datasets: [
      {
        label: "Nombre de consultations",
        data: dashboardData.chartData.consultations,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
      {
        label: "Diagnostics effectués",
        data: dashboardData.chartData.diagnostics,
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

  // Render calendar for Month view
  const renderMonthCalendar = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
        {Array(dashboardData.calendar.firstDayOfMonth)
          .fill(null)
          .map((_, index) => (
            <div key={`empty-${index}`} className="h-16"></div>
          ))}
        {Array.from({ length: dashboardData.calendar.daysInMonth }, (_, i) => i + 1).map((day) => {
          const appointments = dashboardData.calendar.appointments[day] || [];
          return (
            <div
              key={day}
              className="h-16 border border-gray-200 p-2 text-sm relative hover:bg-gray-100 transition-colors"
            >
              <span>{day}</span>
              {appointments.slice(0, 2).map((appt, index) => (
                <div
                  key={index}
                  className={`absolute top-${6 + index * 4} left-2 text-xs ${appt.color} text-gray-800 px-2 py-1 rounded`}
                >
                  {`${appt.time} ${appt.patient}`}
                </div>
              ))}
              {appointments.length > 2 && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-600">
                  +{appointments.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <p className="text-red-600">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord - Médecin</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col items-center p-6 bg-blue-100 rounded-lg shadow-sm">
          <FaCalendarAlt className="text-3xl text-blue-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.todayAppointments}</h2>
          <p className="text-gray-600">Rendez-vous aujourd'hui</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-pink-100 rounded-lg shadow-sm">
          <FaUser className="text-3xl text-pink-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.patientsFollowed}</h2>
          <p className="text-gray-600">Patients suivis</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-green-100 rounded-lg shadow-sm">
          <FaFileMedical className="text-3xl text-green-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.pendingReports}</h2>
          <p className="text-gray-600">Rapports en attente</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-yellow-100 rounded-lg shadow-sm">
          <FaChartLine className="text-3xl text-yellow-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.completedConsultations}</h2>
          <p className="text-gray-600">Consultations terminées</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <button onClick={() => handleMonthChange(-1)} className="text-gray-600 hover:text-gray-800">
                <FaChevronLeft />
              </button>
              <span className="text-lg font-semibold text-gray-800">{dashboardData.calendar.month}</span>
              <button onClick={() => handleMonthChange(1)} className="text-gray-600 hover:text-gray-800">
                <FaChevronRight />
              </button>
            </div>
          </div>
          {renderMonthCalendar()}
        </div>

        {/* Courbe d'évaluations */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Évaluation des activités</h2>
          <Line data={evaluationData} options={chartOptions} />
        </div>

        {/* Rendez-vous à venir */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendez-vous à venir</h2>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              {selectedDate.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <div className="flex space-x-2">
              <button onClick={() => handleDateChange(-1)} className="text-gray-600 hover:text-gray-800">
                <FaChevronLeft />
              </button>
              <button onClick={() => handleDateChange(1)} className="text-gray-600 hover:text-gray-800">
                <FaChevronRight />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {dashboardData.appointments.length > 0 ? (
              dashboardData.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-800">{appointment.patient}</p>
                      <p className="text-sm text-gray-600">{appointment.type}</p>
                      <p className="text-sm text-gray-500">{appointment.time}</p>
                    </div>
                  </div>
                  <Link
                    to={`/medecin/schedule/${appointment.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Détails
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">Aucun rendez-vous pour ce jour.</p>
            )}
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