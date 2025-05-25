import React, { useState } from 'react';
import { FaHome, FaCalendarAlt, FaFileAlt, FaSignOutAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import PatientDashboard from './PatientDashboard';
import Appointments from './BookAppointment';
import DownloadReport from './DownloadReport';

const PatientPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-8">Espace Patient</h1>
          <nav className="space-y-4">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                activeSection === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaHome className="text-xl" />
              <span>Tableau de bord</span>
            </button>
            <button
              onClick={() => setActiveSection('appointments')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                activeSection === 'appointments' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCalendarAlt className="text-xl" />
              <span>Rendez-vous</span>
            </button>
            <button
              onClick={() => setActiveSection('reports')}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                activeSection === 'reports' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaFileAlt className="text-xl" />
              <span>Compte rendu</span>
            </button>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
        >
          <FaSignOutAlt className="text-xl" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeSection === 'dashboard' && <PatientDashboard />}
        {activeSection === 'bookappointment' && <BookAppointment />}
        {activeSection === 'reports' && <DownloadReport />}
      </div>
    </div>
  );
};

export default PatientPage;