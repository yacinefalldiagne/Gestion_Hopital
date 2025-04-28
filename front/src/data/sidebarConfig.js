import { LuBox, LuUser, LuMessageSquare, LuFolder, LuUsers, LuImage, LuCalendar, LuFileText, LuHistory, LuDownload } from "react-icons/lu";

export const SIDEBAR_LINKS = {
    secretaire: [
        { id: 1, name: "Tableau de bord", path: "/secretaire", icon: LuBox },
        { id: 2, name: "Dossiers", path: "/secretaire/dossier", icon: LuFolder },
        { id: 3, name: "Médecins", path: "/secretaire/medecins", icon: LuUser },
        { id: 4, name: "Patients", path: "/secretaire/patients", icon: LuUsers },
        { id: 5, name: "Rendez-vous", path: "/secretaire/schedule", icon: LuCalendar },
    ],
    medecin: [
        { id: 1, name: "Tableau de bord", path: "/medecin", icon: LuBox },
        { id: 2, name: "Patients", path: "/medecin/patients", icon: LuUser },
        { id: 2, name: "Rendez-vous", path: "/medecin/rendezvous", icon: LuCalendar },
        { id: 3, name: "Imagerie médicale", path: "/medecin/dicom", icon: LuImage },
        { id: 4, name: "Rapport", path: "/medecin/report", icon: LuFileText },
        { id: 5, name: "Télé-medecine", path: "/medecin/tele", icon: LuMessageSquare },
        { id: 5, name: "Historique des consultations", path: "/medecin/history", icon: LuHistory },
    ],
    patient: [
        { id: 1, name: "Tableau de bord", path: "/patient", icon: LuBox },
        { id: 2, name: "Mon dossier médical", path: "/patient/dossier", icon: LuFolder },
        { id: 3, name: "Prendre rendez-vous", path: "/patient/book-appointment", icon: LuCalendar },
        { id: 4, name: "Mes rendez-vous", path: "/patient/appointments", icon: LuHistory },
        { id: 5, name: "Compte-rendu", path: "/patient/download-report", icon: LuDownload },
    ],
};