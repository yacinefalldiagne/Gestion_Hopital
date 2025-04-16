import React from "react";
import { useParams, Link } from "react-router-dom";
import { FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaFileAlt, FaCheckCircle, FaFileDownload, FaArrowLeft } from "react-icons/fa";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function PatientDetails() {
    // Récupérer l'ID du patient depuis l'URL
    const { id } = useParams();

    // Données simulées pour un patient (à remplacer par un appel API)
    const patient = {
        id: id,
        name: "Jerome Bellingham",
        joinedSince: "12 March 2023",
        gender: "Male",
        birthday: "12 August 2001",
        phone: "+62 837 356 343 23",
        email: "jeromebellingham203@gmail.com",
        sources: ["WhatsApp", "Google", "Instagram"],
        appointments: [
            { date: "12 Oct 2023", title: "Prosthetic Tooth Fabrication", doctor: "Drg. Wade Warren", color: "bg-blue-200" },
            { date: "12 Sep 2023", title: "Post-Surgical Care", doctor: "Drg. Marvin McKinney", color: "bg-red-200" },
            { date: "12 Aug 2023", title: "Implant Placement", doctor: "Drg. Floyd Miles", color: "bg-green-200" },
        ],
        assurance: {
            number: "234-234-232-32",
            expiry: "23/04/2024",
            status: "Active",
        },
        membership: {
            startDate: "12 Dec 2023",
            daysRemaining: 32,
        },
        history: [
            { id: "#12324", type: "Implant", date: "12 Jun 2023", result: "Well done", payment: "Pending" },
            { id: "#20324", type: "Route canal", date: "4 May 2023", result: "Well done", payment: "Paid" },
            { id: "#57686", type: "Dentures", date: "2 Mar 2023", result: "Well done", payment: "Paid" },
            { id: "#68767", type: "Whitening", date: "16 Feb 2023", result: "Well done", payment: "Paid" },
            { id: "#69906", type: "Implant", date: "9 Jan 2023", result: "Well done", payment: "Paid" },
        ],
        documents: [
            { name: "Agreement_Meditation.zip", size: "2.3 mb" },
            { name: "Provision of Information.pdf", size: "1.2 mb" },
        ],
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* En-tête avec bouton de retour */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Link to="/secretaire/patients" className="text-gray-600 hover:text-gray-800">
                        <FaArrowLeft className="text-2xl" />
                    </Link>
                    <div className="flex items-center space-x-4">
                        <img
                            src="https://randomuser.me/api/portraits/men/80.jpg"
                            alt="Patient"
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{patient.name}</h1>
                            <p className="text-sm text-gray-600">Joined since: {patient.joinedSince}</p>
                        </div>
                    </div>
                </div>
                <span className="bg-green-100 text-green-600 text-sm font-medium px-3 py-1 rounded">Member</span>
            </div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Section gauche : Basic Information */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <FaUser className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Gender</p>
                                <p className="text-gray-800">{patient.gender}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaCalendarAlt className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Birthday</p>
                                <p className="text-gray-800">{patient.birthday}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaPhone className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Phone Number</p>
                                <p className="text-gray-800">{patient.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaEnvelope className="text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-gray-800">{patient.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="text-gray-500">🌐</div>
                            <div>
                                <p className="text-sm text-gray-600">Source</p>
                                <div className="flex space-x-2">
                                    {patient.sources.map((source, index) => (
                                        <span key={index} className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                                            {source}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section droite : Appointment Schedule */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Schedule</h2>
                    <div className="space-y-6">
                        {patient.appointments.map((appointment, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-4 h-4 rounded-full ${appointment.color}`}></div>
                                    {index < patient.appointments.length - 1 && (
                                        <div className="w-1 h-16 bg-gray-200"></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{appointment.date}</p>
                                    <p className="text-gray-800 font-medium">{appointment.title}</p>
                                    <p className="text-sm text-gray-600">{appointment.doctor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section droite : Data of Assurance */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Data of Assurance</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm">Number</p>
                            <p className="text-lg font-medium">{patient.assurance.number}</p>
                        </div>
                        <div>
                            <p className="text-sm">Expiry</p>
                            <p className="text-lg font-medium">{patient.assurance.expiry}</p>
                        </div>
                        <div>
                            <p className="text-sm">Status</p>
                            <p className="text-lg font-medium">{patient.assurance.status}</p>
                        </div>
                    </div>
                </div>

                {/* Section droite : Member Dentalica */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Member Dentalica</h2>
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16">
                            <CircularProgressbar
                                value={patient.membership.daysRemaining}
                                maxValue={100}
                                text={`${patient.membership.daysRemaining} Days`}
                                styles={buildStyles({
                                    textColor: "#1f2937",
                                    pathColor: "#3b82f6",
                                    trailColor: "#d1d5db",
                                })}
                            />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Start Date</p>
                            <p className="text-gray-800">{patient.membership.startDate}</p>
                            <button className="mt-2 text-blue-600 hover:underline text-sm flex items-center space-x-1">
                                <span>Extend</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section pleine largeur : History Dental */}
                <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">History Dental</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">ID</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Type Treatment</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Date</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Result Treatment</th>
                                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patient.history.map((entry) => (
                                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800">{entry.id}</td>
                                        <td className="py-3 px-4 text-gray-800">{entry.type}</td>
                                        <td className="py-3 px-4 text-gray-600">{entry.date}</td>
                                        <td className="py-3 px-4 text-gray-600 flex items-center space-x-2">
                                            <FaCheckCircle className="text-green-500" />
                                            <span>{entry.result}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`text-sm font-medium px-3 py-1 rounded ${entry.payment === "Paid"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-yellow-100 text-yellow-600"
                                                    }`}
                                            >
                                                {entry.payment}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section pleine largeur : Agreement of Document */}
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Agreement of Document</h2>
                    <div className="space-y-4">
                        {patient.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <FaFileAlt className="text-gray-500" />
                                    <div>
                                        <p className="text-gray-800">{doc.name}</p>
                                        <p className="text-sm text-gray-600">{doc.size}</p>
                                    </div>
                                </div>
                                <FaFileDownload className="text-blue-600 cursor-pointer hover:text-blue-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientDetails;