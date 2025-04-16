import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

function AddPatient() {
    const navigate = useNavigate();
    const [newPatient, setNewPatient] = useState({
        name: "",
        age: "",
        phone: "",
        email: "",
    });

    // Gérer les changements dans le formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPatient((prev) => ({ ...prev, [name]: value }));
    };

    // Soumettre le formulaire
    const handleSubmit = (e) => {
        e.preventDefault();
        // Ici, tu peux ajouter un appel API pour envoyer les données au backend
        // Exemple : fetch('/api/patients', { method: 'POST', body: JSON.stringify(newPatient) })
        console.log("Nouveau patient ajouté :", newPatient);

        // Rediriger vers la liste des patients après soumission
        navigate("/secretaire/patients");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* En-tête avec bouton de retour */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Link to="/secretaire/patients" className="text-gray-600 hover:text-gray-800">
                        <FaArrowLeft className="text-2xl" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Ajouter un nouveau patient</h1>
                </div>
            </div>

            {/* Formulaire */}
            <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Nom</label>
                        <input
                            type="text"
                            name="name"
                            value={newPatient.name}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nom du patient"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Âge</label>
                        <input
                            type="number"
                            name="age"
                            value={newPatient.age}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Âge"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                        <input
                            type="text"
                            name="phone"
                            value={newPatient.phone}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Numéro de téléphone"
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
                    <div className="flex justify-end space-x-3">
                        <Link
                            to="/secretaire/patients"
                            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPatient;