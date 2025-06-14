import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";

function CompteRendu() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      if (authLoading) return; // Attendre que l'auth soit chargée
      if (!user) {
        setError("Vous devez être connecté.");
        setLoading(false);
        return;
      }

      try {
        // Utiliser _id de l'utilisateur pour la requête
        const userId = user._id;

        console.log("Fetching reports for user ID:", userId);

        const response = await axios.get(
          `http://localhost:5000/api/reports/user/${userId}`,
          {
            withCredentials: true, // Important pour envoyer le cookie d'authentification
          }
        );

        setConsultations(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur complète:", err);

        if (err.response) {
          if (err.response.status === 401) {
            setError("Non autorisé. Veuillez vous reconnecter.");
            // Optionnel : rediriger vers login ou vider contexte
          } else if (err.response.status === 404) {
            setError("Aucun compte rendu trouvé.");
          } else {
            setError(`Erreur serveur: ${err.response.status}`);
          }
        } else if (err.request) {
          setError("Impossible de joindre le serveur.");
        } else {
          setError("Erreur lors du chargement des comptes rendus.");
        }
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-10">
        <p>{error}</p>
        {error.includes("reconnecter") && (
          <button
            onClick={() => (window.location.href = "/login")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Se reconnecter
          </button>
        )}
      </div>
    );
  }

  if (!user) {
    return <div className="text-red-600 text-center mt-10">Vous devez être connecté.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-6 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h1 className="text-2xl font-bold">Mes comptes rendus</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              Bienvenue, {user.prenom} {user.nom}
            </p>
            <p className="text-xs opacity-90">{user.role}</p>
          </div>
        </div>

        {/* Corps */}
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 mt-4">
                Aucun compte rendu disponible pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {consultations.map((consultation) => (
                <div
                  key={consultation._id}
                  className="border border-gray-200 rounded-lg p-6 bg-white hover:bg-yellow-50 transition duration-300 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Consultation du{" "}
                      {new Date(consultation.consultationDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </h2>
                    <span className="text-sm text-blue-600 font-medium">
                      Dr. {consultation.doctor?.prenom}{" "}
                      {consultation.doctor?.nom || "Médecin inconnu"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Patient :</p>
                      <p className="text-gray-600">
                        {consultation.patientData?.prenom}{" "}
                        {consultation.patientData?.nom || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnostic :</p>
                      <p className="text-gray-600">
                        {consultation.diagnosis || "Non spécifié"}
                      </p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">Notes :</p>
                      <p className="text-gray-600">{consultation.notes || "Aucune"}</p>
                    </div>
                    {consultation.treatment && (
                      <div className="col-span-1 md:col-span-2">
                        <p className="text-sm font-medium text-gray-700">Traitement :</p>
                        <p className="text-gray-600">{consultation.treatment}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200"
                      onClick={() => {
                        console.log("Voir détails pour :", consultation._id);
                        // Implémenter navigation ou modal ici si besoin
                      }}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Voir détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompteRendu;
