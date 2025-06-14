const mongoose = require("mongoose");
const Rendezvous = require("../models/rendezVous");
const Patient = require("../models/patient");
const Medecin = require("../models/medecin");
const DossierMedical = require("../models/dossierMedical");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const getDashboardSecretaire = async (req, res) => {
  try {
    // Log request
    console.log("Requête reçue pour /api/dashboard/secretaire:", req.query);

    // Verify authentication and role
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({ message: "Token non fourni" });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const userId = decoded.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.role !== "secretaire") {
      return res
        .status(403)
        .json({ message: "Accès interdit. Rôle insuffisant." });
    }

    // Get query parameters (default to today and current month)
    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();
    const month = req.query.month
      ? parseInt(req.query.month)
      : selectedDate.getMonth();
    const year = req.query.year
      ? parseInt(req.query.year)
      : selectedDate.getFullYear();

    // Normalize selectedDate to start of day
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Statistics
    const todayAppointmentsCount = await Rendezvous.countDocuments({
      dateRendezVous: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const activePatientsCount = await Patient.countDocuments({
      $or: [
        { rendezvous: { $exists: true, $ne: [] } },
        { dossierMedical: { $exists: true, $ne: [] } },
      ],
    });

    const pendingDossiersCount = await DossierMedical.countDocuments({
      $or: [
        { consultations: { $exists: true, $size: 0 } },
        { status: { $in: ["pending", "incomplete"] } },
      ],
    });

    const dicomImagesCount = await Patient.aggregate([
      { $unwind: "$documents" },
      {
        $match: {
          "documents.type": "DICOM",
          "documents.status": "pending",
        },
      },
      { $count: "total" },
    ]).then((result) => result[0]?.total || 0);

    // Scheduled appointments for the selected date
    const appointments = await Rendezvous.find({
      dateRendezVous: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .populate({
        path: "medecin",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .sort({ heureDebut: 1 });

    const transformedAppointments = appointments.map((rdv) => ({
      id: rdv.id,
      patient:
        `${rdv.patient.userId?.prenom || ""} ${
          rdv.patient.userId?.nom || ""
        }`.trim() || "Inconnu",
      time: rdv.heureDebut.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      doctor: `Dr. ${rdv.medecin.userId?.nom || "Inconnu"}`,
      titre: rdv.titre,
      color: rdv.color,
    }));

    // Patient traceability
    const recentRendezvous = await Rendezvous.find()
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentDossiers = await DossierMedical.find()
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const traceability = [
      ...recentRendezvous.map((rdv) => ({
        id: rdv.id,
        patient:
          `${rdv.patient.userId?.prenom || ""} ${
            rdv.patient.userId?.nom || ""
          }`.trim() || "Inconnu",
        action: "Rendez-vous planifié",
        date: rdv.createdAt.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      })),
      ...recentDossiers.map((dossier) => ({
        id: dossier._id,
        patient:
          `${dossier.patient.userId?.prenom || ""} ${
            dossier.patient.userId?.nom || ""
          }`.trim() || "Inconnu",
        action: "Dossier créé",
        date: dossier.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Calendar data for the selected month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const calendarAppointments = await Rendezvous.find({
      dateRendezVous: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .populate({
        path: "medecin",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      });

    const calendarData = calendarAppointments.reduce((acc, rdv) => {
      const day = rdv.dateRendezVous.getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({
        id: rdv.id,
        time: rdv.heureDebut.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        doctor: `Dr. ${rdv.medecin.userId?.nom || "Inconnu"}`,
        color: rdv.color,
      });
      return acc;
    }, {});

    // Response
    res.status(200).json({
      statistics: {
        todayAppointments: todayAppointmentsCount,
        activePatients: activePatientsCount,
        pendingDossiers: pendingDossiersCount,
        dicomImages: dicomImagesCount,
      },
      appointments: transformedAppointments,
      traceability,
      calendar: {
        month: startOfMonth.toLocaleString("fr-FR", {
          month: "long",
          year: "numeric",
        }),
        firstDayOfMonth: startOfMonth.getDay(),
        daysInMonth: endOfMonth.getDate(),
        appointments: calendarData,
      },
    });
  } catch (error) {
    console.error(
      "Erreur dans getDashboardSecretaire:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getDashboardMedecin = async (req, res) => {
  try {
    console.log("Requête reçue pour /api/dashboard/medecin avec :", req.query);

    // 1. Authentification
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({ message: "Token non fourni" });
    }

    let decoded;
    try {
      decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Erreur lors du décodage du token :", err.message);
      return res.status(401).json({ message: "Token invalide" });
    }

    const userId = decoded.user.id;
    console.log("ID utilisateur décodé :", userId);

    // 2. Vérifier si c’est un médecin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log("Utilisateur trouvé :", user.nom, user.role);

    if (user.role !== "medecin") {
      return res.status(403).json({ message: "Accès réservé au médecin" });
    }

    // 3. Trouver le médecin associé
    const medecin = await Medecin.findOne({ userId });
    if (!medecin) {
      console.warn("Médecin introuvable pour userId :", userId);
      return res.status(404).json({ message: "Médecin non trouvé" });
    }

    console.log("Médecin trouvé :", medecin.nom, medecin.specialite);

    // 4. Traitement des statistiques (exemple simplifié)
    const totalRendezVous = await Rendezvous.countDocuments({
      medecin: medecin._id,
    });

    const patientsUniques = await Rendezvous.distinct("patient", {
      medecin: medecin._id,
    });

    const totalPatients = patientsUniques.length;

    // 5. Liste des rendez-vous pour le jour sélectionné
    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const rendezvousDuJour = await Rendezvous.find({
      medecin: medecin._id,
      dateRendezVous: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .sort({ heureDebut: 1 });

    const appointments = rendezvousDuJour.map((rdv) => ({
      id: rdv._id,
      patient: `${rdv.patient?.userId?.nom || "Inconnu"} ${
        rdv.patient?.userId?.prenom || ""
      }`.trim(),
      time: rdv.heureDebut.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: rdv.titre,
      color: rdv.color || "bg-blue-100 text-blue-600",
    }));

    // 6. Réponse
    res.status(200).json({
      statistics: {
        totalRendezVous,
        totalPatients,
      },
      appointments,
    });
  } catch (error) {
    console.error(
      "Erreur dans getDashboardMedecin:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getDashboardPatient = async (req, res) => {
  try {
    // Log request
    console.log("Requête reçue pour /api/dashboard/patient:", req.query);

    // Verify authentication
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({ message: "Token non fourni" });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const userId = decoded.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.role !== "patient") {
      return res
        .status(403)
        .json({ message: "Accès interdit. Rôle insuffisant." });
    }

    // Find the patient's record
    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    // Get query parameters
    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();
    const month = req.query.month
      ? parseInt(req.query.month)
      : selectedDate.getMonth();
    const year = req.query.year
      ? parseInt(req.query.year)
      : selectedDate.getFullYear();

    // Normalize selectedDate to start of day
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Statistics
    const upcomingAppointmentsCount = await Rendezvous.countDocuments({
      patient: patient._id,
      dateRendezVous: { $gte: startOfDay },
    });

    const pastConsultationsCount = await DossierMedical.countDocuments({
      patient: patient._id,
      "consultations.status": "completed",
    });

    const pendingPaymentsCount = await Rendezvous.countDocuments({
      patient: patient._id,
      paymentStatus: "pending",
    });

    const documentsCount = await Patient.aggregate([
      { $match: { _id: patient._id } },
      { $unwind: "$documents" },
      { $count: "total" },
    ]).then((result) => result[0]?.total || 0);

    // Doctor list
    const doctors = await Rendezvous.aggregate([
      { $match: { patient: patient._id } },
      {
        $group: {
          _id: "$medecin",
          appointmentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "medecins",
          localField: "_id",
          foreignField: "_id",
          as: "medecin",
        },
      },
      { $unwind: "$medecin" },
      {
        $lookup: {
          from: "users",
          localField: "medecin.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          id: "$_id",
          name: { $concat: ["Dr. ", "$user.nom", " ", "$user.prenom"] },
          appointmentCount: 1,
          color: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$appointmentCount", 1] },
                  then: "bg-green-100 text-green-600",
                },
                {
                  case: { $eq: ["$appointmentCount", 2] },
                  then: "bg-red-100 text-red-600",
                },
                {
                  case: { $eq: ["$appointmentCount", 3] },
                  then: "bg-blue-100 text-blue-600",
                },
                {
                  case: { $eq: ["$appointmentCount", 4] },
                  then: "bg-orange-100 text-orange-600",
                },
                {
                  case: { $gte: ["$appointmentCount", 5] },
                  then: "bg-purple-100 text-purple-600",
                },
              ],
              default: "bg-gray-100 text-gray-600",
            },
          },
        },
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: 5 },
    ]);

    // Scheduled appointments for the selected date
    const appointments = await Rendezvous.find({
      patient: patient._id,
      dateRendezVous: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate({
        path: "medecin",
        populate: {
          path: "userId",
          select: "nom prenom",
        },
      })
      .sort({ heureDebut: 1 });

    const transformedAppointments = appointments.map((rdv) => ({
      id: rdv.id,
      doctor: `Dr. ${rdv.medecin.userId?.nom || "Inconnu"} ${
        rdv.medecin.userId?.prenom || ""
      }`.trim(),
      time: rdv.heureDebut.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: rdv.titre,
      color: rdv.color,
    }));

    // Calendar data for the selected month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const calendarAppointments = await Rendezvous.find({
      patient: patient._id,
      dateRendezVous: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).populate({
      path: "medecin",
      populate: {
        path: "userId",
        select: "nom prenom",
      },
    });

    const calendarData = calendarAppointments.reduce((acc, rdv) => {
      const day = rdv.dateRendezVous.getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({
        id: rdv.id,
        time: rdv.heureDebut.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        doctor: `Dr. ${rdv.medecin.userId?.nom || "Inconnu"}`,
        color: rdv.color,
      });
      return acc;
    }, {});

    // Response
    res.status(200).json({
      statistics: {
        upcomingAppointments: upcomingAppointmentsCount,
        pastConsultations: pastConsultationsCount,
        pendingPayments: pendingPaymentsCount,
        documents: documentsCount,
      },
      doctors,
      appointments: transformedAppointments,
      calendar: {
        month: startOfMonth.toLocaleString("fr-FR", {
          month: "long",
          year: "numeric",
        }),
        firstDayOfMonth: startOfMonth.getDay(),
        daysInMonth: endOfMonth.getDate(),
        appointments: calendarData,
      },
    });
  } catch (error) {
    console.error(
      "Erreur dans getDashboardPatient:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  getDashboardSecretaire,
  getDashboardMedecin,
  getDashboardPatient,
};
