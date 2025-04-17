import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddPatient() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState(null);
    const [newPatient, setNewPatient] = useState({
        prenom: "",
        nom: "",
        email: "",
        password: "",
        role: "patient",
        sexe: "Masculin",
        numeroTelephone: "",
        groupeSanguin: "A+",
        allergies: [],
        antecedent: "",
        dateNaissance: "",
        assurance: {
            numero: "",
            expiry: "",
            status: "Active",
        },
        membership: {
            startDate: "",
            daysRemaining: 0,
        },
        history: [],
        documents: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("assurance.") || name.startsWith("membership.")) {
            const [field, subField] = name.split(".");
            setNewPatient((prev) => ({
                ...prev,
                [field]: { ...prev[field], [subField]: value },
            }));
        } else {
            setNewPatient((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleAllergiesChange = (e) => {
        const allergies = e.target.value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);
        setNewPatient((prev) => ({ ...prev, allergies }));
    };

    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log("Sending to /api/auth/register:", {
                prenom: newPatient.prenom,
                nom: newPatient.nom,
                email: newPatient.email,
                password: newPatient.password,
                role: newPatient.role,
            });
            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    prenom: newPatient.prenom,
                    nom: newPatient.nom,
                    email: newPatient.email,
                    password: newPatient.password,
                    role: newPatient.role,
                },
                { withCredentials: true }
            );

            console.log("Register response:", response.data);
            const userId = response.data.userId || response.data.id || (response.data.user && response.data.user.id);
            if (!userId) {
                throw new Error("userId non reçu dans la réponse de /api/auth/register");
            }

            setUserId(userId);
            toast.success("Utilisateur enregistré avec succès !", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setStep(2);
        } catch (err) {
            console.error("Error registering user:", err);
            const errorMessage = err.response?.data?.message || err.message || "Erreur lors de l'enregistrement de l'utilisateur";
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPatient = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const patientData = {
                userId: userId,
                sexe: newPatient.sexe,
                numeroTelephone: newPatient.numeroTelephone,
                groupeSanguin: newPatient.groupeSanguin,
                allergies: newPatient.allergies,
                antecedent: newPatient.antecedent,
                dateNaissance: new Date(newPatient.dateNaissance).toISOString(),
                assurance: {
                    numero: newPatient.assurance.numero,
                    expiry: new Date(newPatient.assurance.expiry).toISOString(),
                    status: newPatient.assurance.status,
                },
                membership: {
                    startDate: new Date(newPatient.membership.startDate).toISOString(),
                    daysRemaining: parseInt(newPatient.membership.daysRemaining),
                },
                history: [],
                documents: [],
            };

            console.log("Sending to /api/patients:", patientData);
            const patientResponse = await axios.post(
                "http://localhost:5000/api/patients",
                patientData,
                { withCredentials: true }
            );
            console.log("Patient creation response:", patientResponse.data);
            toast.success("Patient ajouté avec succès !", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setTimeout(() => navigate("/secretaire/patients"), 3000);
        } catch (err) {
            console.error("Error adding patient:", err);
            const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout du patient";
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: "Inscription de l'utilisateur" },
        { id: 2, title: "Informations du patient" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Link to="/secretaire/patients" className="text-gray-600 hover:text-gray-800">
                        <FaArrowLeft className="text-2xl" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Ajouter un nouveau patient</h1>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-center space-x-4">
                    {steps.map((s, index) => (
                        <div key={s.id} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s.id ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                                    }`}
                            >
                                {s.id}
                            </div>
                            <div className="ml-2">
                                <p
                                    className={`text-sm font-medium ${step >= s.id ? "text-blue-600" : "text-gray-600"
                                        }`}
                                >
                                    {s.title}
                                </p>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-4 ${step > s.id ? "bg-blue-600" : "bg-gray-300"
                                        }`}
                                ></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
                {error && <div className="text-red-600 mb-4">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleRegisterUser} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                            <input
                                type="text"
                                name="prenom"
                                value={newPatient.prenom}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Prénom"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nom</label>
                            <input
                                type="text"
                                name="nom"
                                value={newPatient.nom}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nom"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={newPatient.email}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Mot de passe</label>
                            <input
                                type="password"
                                name="password"
                                value={newPatient.password}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mot de passe"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Link
                                to="/secretaire/patients"
                                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                            >
                                Annuler
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {loading ? "Enregistrement..." : "Suivant"}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmitPatient} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Sexe</label>
                            <select
                                name="sexe"
                                value={newPatient.sexe}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="Masculin">Masculin</option>
                                <option value="Féminin">Féminin</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                            <input
                                type="text"
                                name="numeroTelephone"
                                value={newPatient.numeroTelephone}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Numéro de téléphone"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Groupe sanguin</label>
                            <select
                                name="groupeSanguin"
                                value={newPatient.groupeSanguin}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Allergies (séparées par des virgules)
                            </label>
                            <input
                                type="text"
                                name="allergies"
                                value={newPatient.allergies.join(", ")}
                                onChange={handleAllergiesChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Pollen, Poils d'animaux"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Antécédents médicaux</label>
                            <textarea
                                name="antecedent"
                                value={newPatient.antecedent}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Notes sur les antécédents"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Date de naissance</label>
                            <input
                                type="date"
                                name="dateNaissance"
                                value={newPatient.dateNaissance}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Numéro d'assurance</label>
                            <input
                                type="text"
                                name="assurance.numero"
                                value={newPatient.assurance.numero}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Numéro d'assurance"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Date d'expiration de l'assurance
                            </label>
                            <input
                                type="date"
                                name="assurance.expiry"
                                value={newPatient.assurance.expiry}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Date de début de l'adhésion
                            </label>
                            <input
                                type="date"
                                name="membership.startDate"
                                value={newPatient.membership.startDate}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Jours restants de l'adhésion
                            </label>
                            <input
                                type="number"
                                name="membership.daysRemaining"
                                value={newPatient.membership.daysRemaining}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="flex justify-between space-x-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                            >
                                Retour
                            </button>
                            <div className="flex space-x-3">
                                <Link
                                    to="/secretaire/patients"
                                    className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                                >
                                    Annuler
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    {loading ? "Ajout en cours..." : "Ajouter"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AddPatient;