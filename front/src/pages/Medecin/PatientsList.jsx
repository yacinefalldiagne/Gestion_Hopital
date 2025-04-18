import React, { useState, useEffect } from 'react';
   import { Link } from 'react-router-dom';
   import axios from 'axios';

   const PatientsList = () => {
     const [patients, setPatients] = useState([]);
     const [error, setError] = useState(null);

     useEffect(() => {
       const fetchPatients = async () => {
         try {
           setError(null);
           const token = localStorage.getItem('token');
           if (!token) {
             throw new Error('Vous devez être connecté pour accéder aux patients.');
           }
           const res = await axios.get('http://localhost:5000/api/patients', {
             headers: { 'x-auth-token': token },
           });
           setPatients(res.data);
         } catch (error) {
           const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la récupération des patients';
           console.error('Erreur:', errorMessage);
           setError(errorMessage);
         }
       };
       fetchPatients();
     }, []);

     return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-white rounded-xl shadow-md mx-10">
         <h2 className="text-2xl font-semibold mb-6">Liste des Patients</h2>
         {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
         {patients.length === 0 ? (
           <p className="text-gray-500">Aucun patient trouvé.</p>
         ) : (
           <ul className="w-full max-w-2xl space-y-3">
             {patients.map((patient) => (
               <li key={patient._id} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                 <span className="truncate max-w-xs">{patient.name}</span>
                 <Link
                   to={`/medecin/patient/${patient._id}/reports`}
                   className="text-blue-600 hover:text-blue-800"
                 >
                   Voir les rapports
                 </Link>
               </li>
             ))}
           </ul>
         )}
       </div>
     );
   };

   export default PatientsList;