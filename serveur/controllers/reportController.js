const Report = require("../models/Report");
const Patient = require("../models/patient");
const Medecin = require("../models/medecin");
const User = require("../models/user");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Authentication middleware to ensure only doctors can create reports
const authMiddleware = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.user.role !== "medecin") {
      return res.status(403).json({
        message:
          "Accès interdit. Seuls les médecins peuvent effectuer cette action.",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// Create a new report
const createReport = async (req, res) => {
  try {
    const {
      patientId,
      consultationDate,
      findings,
      diagnosis,
      recommendations,
      notes,
    } = req.body;
    const doctorId = req.user.user.id; // Get doctor ID from authenticated user

    // Validate patient ID format
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "ID du patient invalide" });
    }

    // Chercher le patient par userId (User._id)
    const patient = await Patient.findOne({ userId: patientId }).populate(
      "userId",
      "prenom nom email"
    );
    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    const doctor = await Medecin.findOne({ userId: doctorId }).populate(
      "userId",
      "prenom nom email"
    );
    if (!doctor) {
      return res.status(404).json({ message: "Médecin non trouvé" });
    }

    const report = new Report({
      patient: patient._id, // Utiliser l'_id du Patient
      doctor: doctor._id,
      consultationDate: consultationDate
        ? new Date(consultationDate)
        : Date.now(),
      findings,
      diagnosis,
      recommendations,
      notes,
    });

    await report.save();

    res.status(201).json({
      message: "Compte rendu créé avec succès",
      report: {
        _id: report._id,
        patient: {
          id: patient._id,
          name: `${patient.userId.prenom} ${patient.userId.nom}`,
          email: patient.userId.email,
        },
        doctor: {
          id: doctor._id,
          name: `${doctor.userId.prenom} ${doctor.userId.nom}`,
          specialite: doctor.specialite.join(", "),
        },
        consultationDate: report.consultationDate,
        findings: report.findings,
        diagnosis: report.diagnosis,
        recommendations: report.recommendations,
        notes: report.notes,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erreur dans createReport:", error.message, error.stack);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Données invalides", errors: error.errors });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Get all reports for a patient
const getReportsByPatient = async (req, res) => {
  try {
    const { userId } = req.params; // Renamed from patientId to userId for clarity

    // Validate that the provided userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID de l'utilisateur invalide" });
    }

    // Find the Patient document where userId matches the provided userId
    const patient = await Patient.findOne({ userId: userId });
    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    // Find all reports where the patient field matches the Patient._id
    const reports = await Report.find({ patient: patient._id })
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "prenom nom email",
        },
      })
      .populate({
        path: "doctor",
        populate: {
          path: "userId",
          select: "prenom nom email",
        },
      })
      .lean();

    // Format the reports for the response
    const formattedReports = reports.map((report) => ({
      _id: report._id,
      patient: {
        id: report.patient._id,
        name: `${report.patient.userId.prenom} ${report.patient.userId.nom}`,
        email: report.patient.userId.email,
      },
      doctor: {
        id: report.doctor._id,
        name: `${report.doctor.userId.prenom} ${report.doctor.userId.nom}`,
        specialite: report.doctor.specialite.join(", "),
      },
      consultationDate: report.consultationDate,
      findings: report.findings,
      diagnosis: report.diagnosis,
      recommendations: report.recommendations,
      notes: report.notes,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error(
      "Erreur dans getReportsByPatient:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Get a single report by ID
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "ID du rapport invalide" });
    }

    const report = await Report.findById(reportId)
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "prenom nom email",
        },
      })
      .populate({
        path: "doctor",
        populate: {
          path: "userId",
          select: "prenom nom email",
        },
      })
      .lean();

    if (!report) {
      return res.status(404).json({ message: "Rapport non trouvé" });
    }

    const formattedReport = {
      _id: report._id,
      patient: {
        id: report.patient._id,
        name: `${report.patient.userId.prenom} ${report.patient.userId.nom}`,
        email: report.patient.userId.email,
      },
      doctor: {
        id: report.doctor._id,
        name: `${report.doctor.userId.prenom} ${report.doctor.userId.nom}`,
        specialite: report.doctor.specialite.join(", "),
      },
      consultationDate: report.consultationDate,
      findings: report.findings,
      diagnosis: report.diagnosis,
      recommendations: report.recommendations,
      notes: report.notes,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };

    res.json(formattedReport);
  } catch (error) {
    console.error("Erreur dans getReportById:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Update a report
const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { consultationDate, findings, diagnosis, recommendations, notes } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "ID du rapport invalide" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Rapport non trouvé" });
    }

    // Only the doctor who created the report can update it
    if (
      report.doctor.toString() !==
      (await Medecin.findOne({ userId: req.user.user.id }))._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Accès interdit. Seuls les médecins auteurs peuvent modifier ce rapport.",
      });
    }

    report.consultationDate = consultationDate
      ? new Date(consultationDate)
      : report.consultationDate;
    report.findings = findings || report.findings;
    report.diagnosis = diagnosis || report.diagnosis;
    report.recommendations =
      recommendations !== undefined ? recommendations : report.recommendations;
    report.notes = notes !== undefined ? notes : report.notes;

    await report.save();

    res.json({ message: "Rapport mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur dans updateReport:", error.message, error.stack);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Données invalides", errors: error.errors });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getReportsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(
      "🔍 getReportsByUser - Recherche de rapports pour userId:",
      userId
    );

    // Validate that the provided userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("❌ ID utilisateur invalide:", userId);
      return res.status(400).json({ message: "ID de l'utilisateur invalide" });
    }

    // First, let's check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ Utilisateur non trouvé:", userId);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    console.log(
      "✅ Utilisateur trouvé:",
      user.prenom,
      user.nom,
      "- Role:",
      user.role
    );

    // Find the doctor document where userId matches the provided userId
    const doctor = await Medecin.findOne({ userId: userId }).populate(
      "userId",
      "prenom nom email"
    );
    if (!doctor) {
      console.log("❌ Médecin non trouvé pour userId:", userId);
      return res
        .status(404)
        .json({ message: "Médecin non trouvé pour cet utilisateur" });
    }
    console.log("✅ Médecin trouvé:", doctor._id);

    // Find all reports where the doctor field matches the Doctor._id
    console.log("🔍 Recherche des rapports créés par le médecin:", doctor._id);
    const reports = await Report.find({ doctor: doctor._id })
      .populate({
        path: "patient",
        populate: {
          path: "userId",
          select: "prenom nom email",
        },
      })
      .populate({
        path: "doctor",
        populate: {
          path: "userId",
          select: "prenom nom email",
        },
      })
      .lean();

    console.log(`📊 Nombre de rapports trouvés: ${reports.length}`);

    if (!reports.length) {
      console.log("ℹ️ Aucun rapport trouvé pour ce médecin");
      return res.status(200).json([]); // Retourner un tableau vide au lieu d'une erreur 404
    }

    // Format the reports for the response
    const formattedReports = reports.map((report) => {
      console.log("📝 Formatage du rapport:", report._id);
      return {
        _id: report._id,
        patient: {
          id: report.patient._id,
          name: `${report.patient.userId.prenom} ${report.patient.userId.nom}`,
          email: report.patient.userId.email,
        },
        doctor: {
          id: report.doctor._id,
          name: `${report.doctor.userId.prenom} ${report.doctor.userId.nom}`,
          specialite: report.doctor.specialite
            ? report.doctor.specialite.join(", ")
            : "Non spécifiée",
        },
        consultationDate: report.consultationDate,
        findings: report.findings,
        diagnosis: report.diagnosis,
        recommendations: report.recommendations,
        notes: report.notes,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      };
    });

    console.log("✅ Rapports formatés avec succès, envoi de la réponse");
    res.status(200).json(formattedReports);
  } catch (error) {
    console.error("❌ Erreur dans getReportsByUser:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
      details: "Vérifiez les logs du serveur pour plus d'informations",
    });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "ID du rapport invalide" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Rapport non trouvé" });
    }

    // Only the doctor who created the report can delete it
    if (
      report.doctor.toString() !==
      (await Medecin.findOne({ userId: req.user.user.id }))._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Accès interdit. Seuls les médecins auteurs peuvent supprimer ce rapport.",
      });
    }

    await report.deleteOne();
    res.json({ message: "Rapport supprimé avec succès" });
  } catch (error) {
    console.error("Erreur dans deleteReport:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  createReport,
  getReportsByPatient,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByUser, // ✅ ajouté ici
};
