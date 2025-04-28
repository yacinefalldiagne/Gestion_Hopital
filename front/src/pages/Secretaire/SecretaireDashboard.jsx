import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaUser, FaFolder, FaChevronLeft, FaChevronRight, FaImage } from "react-icons/fa";
import { Link } from "react-router-dom";

function Secretaire() {
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const [dashboardData, setDashboardData] = useState({
        statistics: { todayAppointments: 0, activePatients: 0, pendingDossiers: 0, dicomImages: 0 },
        appointments: [],
        traceability: [],
        calendar: { month: "", firstDayOfMonth: 0, daysInMonth: 0, appointments: {} },
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [view, setView] = useState("Month"); // AM, PM, Month, Week, Day
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `http://localhost:5000/api/dashboard/secretaire?date=${selectedDate.toISOString()}&month=${month}&year=${year}`,
                    {
                        method: "GET",
                        credentials: "include", // Include cookies for authToken
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

    // Handle view change
    const handleViewChange = (newView) => {
        setView(newView);
        // For AM/PM, we could filter appointments by time, but for simplicity, we'll just update the view state
        // Week/Day views could involve adjusting the calendar rendering, left as future enhancement
    };

    // Filter appointments based on view (AM/PM)
    const filteredAppointments = dashboardData.appointments.filter((appointment) => {
        if (view === "AM") {
            const hour = parseInt(appointment.time.split(":")[0], 10);
            return hour < 12;
        } else if (view === "PM") {
            const hour = parseInt(appointment.time.split(":")[0], 10);
            return hour >= 12;
        }
        return true; // Month, Week, Day show all
    });

    // Render calendar appointments dynamically
    const renderCalendarDay = (day) => {
        const appointments = dashboardData.calendar.appointments[day] || [];
        return (
            <div key={day} className="h-16 border border-gray-200 p-2 text-sm relative">
                <span>{day}</span>
                {appointments.map((appt, index) => (
                    <div
                        key={index}
                        className={`absolute top-${6 + index * 4} left-2 text-xs ${appt.color} text-gray-800 px-2 py-1 rounded`}
                    >
                        {`${appt.time} ${appt.doctor}`}
                    </div>
                ))}
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
                <h1 className="text-2xl font-bold text-gray-800">Tableau de bord - Secrétaire Médicale</h1>
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
                    <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.activePatients}</h2>
                    <p className="text-gray-600">Patients actifs</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-green-100 rounded-lg shadow-sm">
                    <FaFolder className="text-3xl text-green-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.pendingDossiers}</h2>
                    <p className="text-gray-600">Dossiers en attente</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-yellow-100 rounded-lg shadow-sm">
                    <FaImage className="text-3xl text-yellow-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">{dashboardData.statistics.dicomImages}</h2>
                    <p className="text-gray-600">Images DICOM à organiser</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleMonthChange(-1)}>
                                <FaChevronLeft className="text-gray-600" />
                            </button>
                            <span className="text-lg font-semibold text-gray-800">{dashboardData.calendar.month}</span>
                            <button onClick={() => handleMonthChange(1)}>
                                <FaChevronRight className="text-gray-600" />
                            </button>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                className={`px-3 py-1 rounded-lg ${view === "AM" ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
                                    }`}
                                onClick={() => handleViewChange("AM")}
                            >
                                AM
                            </button>
                            <button
                                className={`px-3 py-1 rounded-lg ${view === "PM" ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
                                    }`}
                                onClick={() => handleViewChange("PM")}
                            >
                                PM
                            </button>
                            <button
                                className={`px-3 py-1 rounded-lg ${view === "Month" ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
                                    }`}
                                onClick={() => handleViewChange("Month")}
                            >
                                Month
                            </button>
                            <button
                                className={`px-3 py-1 rounded-lg ${view === "Week" ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
                                    }`}
                                onClick={() => handleViewChange("Week")}
                            >
                                Week
                            </button>
                            <button
                                className={`px-3 py-1 rounded-lg ${view === "Day" ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
                                    }`}
                                onClick={() => handleViewChange("Day")}
                            >
                                Day
                            </button>
                        </div>
                    </div>
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
                        {Array.from({ length: dashboardData.calendar.daysInMonth }, (_, i) => i + 1).map((day) =>
                            renderCalendarDay(day)
                        )}
                    </div>
                </div>
                {/* Calendrier des rendez-vous */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendez-vous planifiés</h2>
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
                        {filteredAppointments.length > 0 ? (
                            filteredAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{appointment.patient}</p>
                                            <p className="text-sm text-gray-600">Avec {appointment.doctor}</p>
                                            <p className="text-sm text-gray-500">{appointment.time}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/secretaire/schedule/${appointment.id}`}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Modifier
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-600">Aucun rendez-vous pour cette période.</p>
                        )}
                    </div>
                </div>

                {/* Traçabilité des patients */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Traçabilité des patients</h2>
                    <div className="space-y-4">
                        {dashboardData.traceability.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-800">{entry.patient}</p>
                                    <p className="text-sm text-gray-600">{entry.action}</p>
                                    <p className="text-sm text-gray-500">{entry.date}</p>
                                </div>
                            </div>
                        ))}
                        <Link to="/secretaire/traceability" className="block mt-4 text-blue-600 hover:underline text-sm text-center">
                            Voir plus
                        </Link>
                    </div>
                </div>

                {/* Tâches rapides */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Tâches rapides</h2>
                    <div className="space-y-4">
                        <Link to="/secretaire/dossier" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Gérer dossier</p>
                        </Link>
                        <Link to="/secretaire/patient" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Gérer patient</p>
                        </Link>
                        <Link to="/secretaire/schedule" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <p className="font-medium text-gray-800">Planifier examen</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Secretaire;