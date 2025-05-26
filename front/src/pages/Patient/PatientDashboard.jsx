import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaUserMd, FaWallet, FaChartPie, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function PatientDashboard() {
  const daysOfWeek = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  const [dashboardData, setDashboardData] = useState({
    statistics: {
      upcomingAppointments: 0,
      pastConsultations: 0,
      pendingPayments: 0,
      documents: 0,
    },
    doctors: [],
    appointments: [],
    calendar: {
      month: '',
      firstDayOfMonth: 0,
      daysInMonth: 0,
      appointments: {},
    },
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState('Month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:5000/api/dashboard/patient?date=${selectedDate.toISOString()}&month=${month}&year=${year}`,
          {
            method: 'GET',
            credentials: 'include', // Inclut les cookies (authToken)
          }
        );
        if (!response.ok) {
          throw new Error('Échec de la récupération des données du tableau de bord');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Erreur dans fetchDashboardData:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedDate, month, year]);

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

  const handleDateChange = (direction) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + direction);
      return newDate;
    });
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const renderMonthCalendar = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
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
              className="h-16 border border-gray-200 p-2 text-sm relative hover:bg-gray-50 transition-colors rounded-lg"
            >
              <span>{day}</span>
              {appointments.slice(0, 2).map((appt, index) => (
                <div
                  key={index}
                  className={`absolute top-${4 + index * 4} left-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full`}
                >
                  {`${appt.time} ${appt.doctor}`}
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-6 bg-green-50 rounded-lg shadow-md">
          <FaCalendarAlt className="text-3xl text-green-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.upcomingAppointments}</h2>
          <p className="text-gray-600">Rendez-vous à venir</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-red-50 rounded-lg shadow-md">
          <FaUserMd className="text-3xl text-red-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.pastConsultations}</h2>
          <p className="text-gray-600">Consultations passées</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-yellow-50 rounded-lg shadow-md">
          <FaWallet className="text-3xl text-yellow-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.pendingPayments}</h2>
          <p className="text-gray-600">Paiements en attente</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md">
          <FaChartPie className="text-3xl text-gray-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.documents}</h2>
          <p className="text-gray-600">Documents</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes médecins</h2>
          <div className="space-y-4">
            {dashboardData.doctors.length > 0 ? (
              dashboardData.doctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-800">{doctor.name}</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-600 text-sm font-medium px-2 py-1 rounded">
                    {doctor.appointmentCount}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">Aucun médecin associé.</p>
            )}
            <Link
              to="/patient/doctors"
              className="block w-full mt-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-center"
            >
              Voir plus
            </Link>
          </div>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
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
              <div className="flex space-x-2">
                {['AM', 'PM', 'Month', 'Week', 'Day'].map((v) => (
                  <button
                    key={v}
                    className={`px-3 py-1 rounded-lg ${
                      view === v ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => handleViewChange(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {view === 'Month' && renderMonthCalendar()}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendez-vous à venir</h2>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
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
                        <p className="font-medium text-gray-800">{appointment.doctor}</p>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                        <p className="text-sm text-gray-500">{appointment.time}</p>
                      </div>
                    </div>
                    <Link
                      to={`/patient/appointment/${appointment.id}`}
                      className="text-green-600 hover:underline text-sm"
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
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;