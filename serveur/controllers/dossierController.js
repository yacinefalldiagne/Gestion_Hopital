const mongoose = require("mongoose");
const Patient = require("../models/patient");
const DossierMedical = require("../models/dossierMedical");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const FormData = require("form-data");
const axios = require("axios");
const dicomParser = require("dicom-parser");

// Orthanc server configuration
const orthanc_url = "http://localhost:8042";
const orthanc_auth = {
  username: "admin",
  password: "passer123",
};

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/dossiers/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|doc|docx|jpg|jpeg|png|dcm)$/i;
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "application/dicom",
      "application/octet-stream",
    ];

    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Seuls les fichiers PDF, Word, JPG, PNG et DICOM sont autorisés"
      )
    );
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware pour gérer les erreurs de Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Validate DICOM file
const validateDicomFile = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const dataSet = dicomParser.parseDicom(fileBuffer);
    console.log(`DICOM file ${filePath} parsed successfully. Tags:`, {
      PatientName: dataSet.string("x00100010"),
      StudyInstanceUID: dataSet.string("x0020000d"),
      SeriesInstanceUID: dataSet.string("x0020000e"),
    });
    return true;
  } catch (err) {
    console.warn(`Fichier DICOM invalide: ${filePath}`, err.message);
    return false;
  }
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (!["medecin", "secretaire"].includes(decoded.role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// Generate a dossier number
const formatDateForDossier = (dateNaissance) => {
  if (!dateNaissance) return "";
  const date = new Date(dateNaissance);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

// Fonction pour nettoyer et formater les chaînes
const cleanString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-zA-Z]/g, "") // Garde seulement les lettres
    .toUpperCase();
};

// Nouvelle fonction pour générer le numéro de dossier
const generateDossierNumber = async (patientId) => {
  try {
    // Récupérer les informations du patient avec populate
    const patient = await Patient.findById(patientId).populate(
      "userId",
      "prenom nom dateNaissance lieuNaissance"
    );

    if (!patient || !patient.userId) {
      throw new Error("Patient ou informations utilisateur introuvables");
    }

    const { prenom, nom, dateNaissance, lieuNaissance } = patient.userId;

    // Générer les initiales (première lettre du prénom + première lettre du nom)
    const initialePrenom = cleanString(prenom).charAt(0) || "X";
    const initialeNom = cleanString(nom).charAt(0) || "X";
    const initiales = `${initialePrenom}${initialeNom}`;

    // Formater la date de naissance
    const dateFormatee = formatDateForDossier(dateNaissance);

    // Nettoyer le lieu de naissance (prendre les 3 premières lettres)
    const lieuNettoye = cleanString(lieuNaissance).substring(0, 3) || "XXX";

    // Générer un numéro séquentiel pour éviter les doublons
    const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres du timestamp

    // Format final: DOSSIER-[Initiales]-[DateNaissance]-[Lieu]-[Timestamp]
    const numeroDossier = `DOSSIER-${initiales}-${dateFormatee}-${lieuNettoye}-${timestamp}`;

    // Vérifier l'unicité
    const existingDossier = await DossierMedical.findOne({
      numero: numeroDossier,
    });

    if (existingDossier) {
      // Si le dossier existe déjà, attendre 1ms et réessayer
      await new Promise((resolve) => setTimeout(resolve, 1));
      return generateDossierNumber(patientId);
    }

    return numeroDossier;
  } catch (error) {
    console.error("Erreur lors de la génération du numéro de dossier:", error);
    // Fallback vers l'ancien système en cas d'erreur
    const patientIdString = patientId.toString();
    const fallbackNumber = `DOS-${Date.now()}-${patientIdString.slice(-4)}`;
    return fallbackNumber;
  }
};

// Uploader un fichier DICOM vers Orthanc
const uploadDicom = async (req, res) => {
  try {
    const { dossierId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }
    if (!mongoose.Types.ObjectId.isValid(dossierId)) {
      return res.status(400).json({ message: "ID de dossier invalide" });
    }

    const dossier = await DossierMedical.findById(dossierId);
    if (!dossier) {
      return res.status(404).json({ message: "Dossier non trouvé" });
    }

    const instanceData = [];
    const uploadedInstanceIds = [];

    for (const file of files) {
      if (!/\.dcm$/i.test(file.originalname)) {
        console.warn(
          `Fichier ignoré (extension non-DICOM): ${file.originalname}`
        );
        continue;
      }

      if (!validateDicomFile(file.path)) {
        console.warn(`Fichier DICOM invalide: ${file.path}`);
        continue;
      }

      const formData = new FormData();
      const fileBuffer = fs.readFileSync(file.path);
      formData.append("file", fileBuffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      let instanceId;
      let sopInstanceUID;
      let studyInstanceUIDFromFile;
      let patientNameFromFile;
      let examDateFromFile;
      let studyDescriptionFromFile;
      try {
        // Extract metadata from the DICOM file
        const dicomData = dicomParser.parseDicom(fileBuffer);
        sopInstanceUID = dicomData.string("x00080018");
        studyInstanceUIDFromFile = dicomData.string("x0020000d");
        patientNameFromFile = dicomData.string("x00100010");
        studyDescriptionFromFile =
          dicomData.string("x00081030") || file.originalname;
        const studyDate = dicomData.string("x00080020");
        examDateFromFile = studyDate
          ? new Date(
              studyDate.substring(0, 4),
              studyDate.substring(4, 6) - 1,
              studyDate.substring(6, 8)
            )
          : null;

        if (!sopInstanceUID) {
          console.error(
            `SOPInstanceUID manquant pour le fichier ${file.originalname}`
          );
          continue;
        }

        const uploadResponse = await axios.post(
          `${orthanc_url}/instances`,
          formData,
          {
            headers: { ...formData.getHeaders() },
            auth: orthanc_auth,
            responseType: "text",
          }
        );

        console.log(
          `Statut de la réponse d'Orthanc pour ${file.originalname}: ${uploadResponse.status}`
        );
        console.log(
          `Réponse brute d'Orthanc pour ${file.originalname}: ${uploadResponse.data}`
        );

        if (uploadResponse.status !== 200) {
          console.error(
            `Échec de l'upload sur Orthanc pour ${file.originalname}: Statut ${uploadResponse.status}`
          );
          continue;
        }

        // Try to parse the response
        let responseData;
        try {
          responseData = JSON.parse(uploadResponse.data);
          console.log(
            `Réponse d'Orthanc (JSON) pour ${file.originalname}:`,
            JSON.stringify(responseData, null, 2)
          );
        } catch (parseErr) {
          console.error(
            `Échec de l'analyse de la réponse d'Orthanc pour ${file.originalname}:`,
            parseErr.message
          );
          console.error(`Réponse brute d'Orthanc: ${uploadResponse.data}`);
        }

        // Try to get instanceId from the response
        if (responseData) {
          instanceId =
            responseData.ID || responseData.InstanceID || responseData.id;
        }

        // If instanceId is not in the response, query Orthanc using SOPInstanceUID
        if (!instanceId || typeof instanceId !== "string") {
          console.warn(
            `ID d'instance non trouvé dans la réponse, recherche via SOPInstanceUID: ${sopInstanceUID}`
          );
          const instancesResponse = await axios.get(
            `${orthanc_url}/instances`,
            { auth: orthanc_auth }
          );
          const instances = instancesResponse.data;

          for (const id of instances) {
            const instanceDetails = await axios.get(
              `${orthanc_url}/instances/${id}`,
              { auth: orthanc_auth }
            );
            const mainDicomTags = instanceDetails.data.MainDicomTags;
            if (mainDicomTags.SOPInstanceUID === sopInstanceUID) {
              instanceId = id;
              console.log(`Instance trouvée via SOPInstanceUID: ${instanceId}`);
              break;
            }
          }
        }

        if (!instanceId) {
          console.error(
            `Impossible de trouver l'ID d'instance pour le fichier ${file.originalname}`
          );
          continue;
        }

        uploadedInstanceIds.push(instanceId);

        const metadataResponse = await axios.get(
          `${orthanc_url}/instances/${instanceId}`,
          { auth: orthanc_auth }
        );
        const mainDicomTags = metadataResponse.data.MainDicomTags;

        // Use values from Orthanc if available, otherwise fall back to the file's values
        const studyInstanceUID =
          mainDicomTags.StudyInstanceUID || studyInstanceUIDFromFile || "";
        const studyDescription =
          mainDicomTags.StudyDescription || studyDescriptionFromFile;
        const examDate = mainDicomTags.StudyDate
          ? new Date(
              mainDicomTags.StudyDate.substring(0, 4),
              mainDicomTags.StudyDate.substring(4, 6) - 1,
              mainDicomTags.StudyDate.substring(6, 8)
            )
          : examDateFromFile;
        const patientName =
          mainDicomTags.PatientName || patientNameFromFile || "Unknown";

        instanceData.push({
          instanceId,
          studyInstanceUID,
          studyDescription,
          examDate,
          patientName,
          previewUrl: `/instances/${instanceId}/preview`,
          stoneViewerUrl: studyInstanceUID
            ? `${orthanc_url}/stone-webviewer/index.html?study=${studyInstanceUID}`
            : null,
        });
      } catch (err) {
        console.error(
          `Erreur lors de l'upload du fichier ${file.originalname}:`,
          err.message
        );
        if (err.response) {
          console.error(
            `Détails de l'erreur Orthanc: Statut ${err.response.status}, Données:`,
            err.response.data
          );
          if (typeof err.response.data !== "object") {
            console.error(`Réponse brute d'Orthanc: ${err.response.data}`);
          }
        } else {
          console.error("Aucune réponse d'Orthanc disponible:", err);
        }
        if (instanceId) {
          try {
            await axios.delete(`${orthanc_url}/instances/${instanceId}`, {
              auth: orthanc_auth,
            });
            console.log(
              `Instance ${instanceId} supprimée d'Orthanc suite à une erreur`
            );
          } catch (deleteErr) {
            console.error(
              `Échec de la suppression de l'instance ${instanceId} sur Orthanc:`,
              deleteErr.message
            );
          }
        }
        continue;
      } finally {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (instanceData.length === 0) {
      return res.status(400).json({
        message:
          "Aucun fichier DICOM valide n'a été uploadé. Vérifiez les fichiers ou le serveur Orthanc.",
      });
    }

    console.log(
      "instanceData to be saved:",
      JSON.stringify(instanceData, null, 2)
    );

    dossier.dicomInstances.push(...instanceData);

    let saveSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await dossier.save();
        console.log(
          `Dossier ${dossierId} saved successfully with ${instanceData.length} new DICOM instances on attempt ${attempt}`
        );
        saveSuccess = true;
        break;
      } catch (saveError) {
        console.error(
          `Erreur lors de la sauvegarde du dossier (tentative ${attempt}):`,
          saveError.message,
          saveError.stack
        );
        if (attempt === 3) {
          for (const instanceId of uploadedInstanceIds) {
            try {
              await axios.delete(`${orthanc_url}/instances/${instanceId}`, {
                auth: orthanc_auth,
              });
              console.log(
                `Instance ${instanceId} deleted from Orthanc due to database save failure`
              );
            } catch (deleteErr) {
              console.error(
                `Failed to delete instance ${instanceId} from Orthanc:`,
                deleteErr.message
              );
            }
          }
          return res.status(500).json({
            message:
              "Erreur lors de la sauvegarde des données dans la base de données après plusieurs tentatives",
            error: saveError.message,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!saveSuccess) {
      return res
        .status(500)
        .json({ message: "Échec de la sauvegarde après plusieurs tentatives" });
    }

    res.json({
      message: "Fichiers DICOM uploadés avec succès",
      instances: instanceData,
    });
  } catch (error) {
    console.error("Erreur dans uploadDicom:", error.message, error.stack);
    res.status(500).json({
      message: "Erreur lors de l'upload des fichiers DICOM",
      error: error.message,
    });
  }
};

// Récupérer tous les dossiers
const getDossiers = async (req, res) => {
  try {
    const dossiers = await DossierMedical.find()
      .populate({
        path: "patient",
        select: "_id",
        populate: {
          path: "userId",
          select: "prenom nom",
        },
      })
      .lean();

    const populatedDossiers = dossiers.map((dossier) => ({
      ...dossier,
      patient: {
        _id: dossier.patient?._id || null,
        userId: dossier.patient?.userId?._id.toString() || null,
        name: dossier.patient?.userId
          ? `${dossier.patient.userId.prenom} ${dossier.patient.userId.nom}`
          : "Inconnu",
      },
    }));

    res.json(populatedDossiers);
  } catch (error) {
    console.error("Erreur dans getDossiers:", error.message, error.stack);
    res.status(500).json({
      message: "Erreur lors de la récupération des dossiers",
      error: error.message,
    });
  }
};

// Récupérer les dossiers d'un patient spécifique
const getDossiersByPatient = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "ID du patient invalide" });
    }

    const dossiers = await DossierMedical.find({ patient: patientId })
      .populate({
        path: "patient",
        select: "_id",
        populate: {
          path: "userId",
          select: "prenom nom",
        },
      })
      .lean();

    const populatedDossiers = dossiers.map((dossier) => ({
      ...dossier,
      patient: {
        _id: dossier.patient?._id || null,
        userId: dossier.patient?.userId?._id.toString() || null,
        name: dossier.patient?.userId
          ? `${dossier.patient.userId.prenom} ${dossier.patient.userId.nom}`
          : "Inconnu",
      },
    }));

    res.json(populatedDossiers);
  } catch (error) {
    console.error(
      "Erreur dans getDossiersByPatient:",
      error.message,
      error.stack
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des dossiers",
      error: error.message,
    });
  }
};

const createDossier = async (req, res) => {
  try {
    const { patientId, noteMedecin, consultations, prescriptions, labResults } =
      req.body;
    const file = req.file;

    if (!patientId) {
      return res.status(400).json({ message: "L'ID du patient est requis" });
    }

    // Trouver le patient par userId
    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    // Utiliser la nouvelle fonction de génération avec l'ObjectId du patient
    const numero = await generateDossierNumber(patient._id);

    let documentPath = "";
    if (file) {
      documentPath = `/Uploads/dossiers/${file.filename}`;
    }

    const dossier = new DossierMedical({
      numero,
      patient: patient._id,
      noteMedecin,
      consultations: consultations ? JSON.parse(consultations) : [],
      prescriptions: prescriptions ? JSON.parse(prescriptions) : [],
      labResults: labResults ? JSON.parse(labResults) : [],
      documentsAssocies: documentPath ? [documentPath] : [],
    });

    await dossier.save();

    patient.dossierMedical.push(dossier._id);
    await patient.save();

    res.status(201).json({
      message: "Dossier créé avec succès",
      dossierId: dossier._id,
      numero,
    });
  } catch (error) {
    console.error("Erreur dans createDossier:", error.message, error.stack);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Un dossier avec ce numéro existe déjà",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Données invalides",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const updateDossier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero,
      patientId,
      noteMedecin,
      consultations,
      prescriptions,
      labResults,
    } = req.body;
    const file = req.file;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de dossier invalide" });
    }

    const dossier = await DossierMedical.findById(id);
    if (!dossier) {
      return res.status(404).json({ message: "Dossier non trouvé" });
    }

    if (patientId) {
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res
          .status(400)
          .json({ message: "L'ID du patient est invalide" });
      }
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient non trouvé" });
      }
      dossier.patient = patientId;
    }

    let documentPath = "";
    if (file) {
      documentPath = `/Uploads/dossiers/${file.filename}`;
      dossier.documentsAssocies.push(documentPath);
    }

    dossier.numero = numero || dossier.numero;
    dossier.noteMedecin =
      noteMedecin !== undefined ? noteMedecin : dossier.noteMedecin;
    dossier.consultations = consultations
      ? JSON.parse(consultations)
      : dossier.consultations;
    dossier.prescriptions = prescriptions
      ? JSON.parse(prescriptions)
      : dossier.prescriptions;
    dossier.labResults = labResults
      ? JSON.parse(labResults)
      : dossier.labResults;

    await dossier.save();
    res.json({ message: "Dossier modifié avec succès" });
  } catch (error) {
    console.error("Erreur dans updateDossier:", error.message, error.stack);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Un dossier avec ce numéro existe déjà" });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const deleteDossier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de dossier invalide" });
    }

    const dossier = await DossierMedical.findById(id);
    if (!dossier) {
      return res.status(404).json({ message: "Dossier non trouvé" });
    }

    await dossier.deleteOne();
    res.json({ message: "Dossier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur dans deleteDossier:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { dossierId, documentPath } = req.params;
    if (!mongoose.Types.ObjectId.isValid(dossierId)) {
      return res.status(400).json({ message: "ID du dossier invalide" });
    }

    const dossier = await DossierMedical.findById(dossierId);
    if (!dossier) {
      return res.status(404).json({ message: "Dossier non trouvé" });
    }

    const decodedPath = decodeURIComponent(documentPath);
    dossier.documentsAssocies = dossier.documentsAssocies.filter(
      (doc) => doc !== decodedPath
    );
    await dossier.save();

    const filePath = path.join(__dirname, "..", decodedPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Document supprimé avec succès" });
  } catch (error) {
    console.error("Erreur dans deleteDocument:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getDicomInstance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Instance ID is required" });
    }

    const response = await axios.get(`${orthanc_url}/instances/${id}`, {
      auth: orthanc_auth,
    });
    const studyInstanceUID = response.data.MainDicomTags.StudyInstanceUID;
    res.json({
      id,
      mainDicomTags: response.data.MainDicomTags,
      previewUrl: `/instances/${id}/preview`,
      stoneViewerUrl: studyInstanceUID
        ? `${orthanc_url}/stone-webviewer/index.html?study=${studyInstanceUID}`
        : null,
    });
  } catch (error) {
    console.error("Erreur dans getDicomInstance:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les instances DICOM d'un patient
const getDicomInstances = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "ID de patient invalide" });
    }

    // Find the patient document to get the correct patient ObjectId
    const patientDoc = await Patient.findOne({ userId: patientId });
    if (!patientDoc) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    const dossiers = await DossierMedical.find({
      patient: patientDoc._id,
    }).select("dicomInstances");
    if (!dossiers || dossiers.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun dossier trouvé pour ce patient" });
    }

    const dicomInstances = dossiers.flatMap(
      (dossier) => dossier.dicomInstances
    );

    // Retrieve metadata for each instance from Orthanc
    const instances = [];
    for (const instance of dicomInstances) {
      const instanceData = {
        id: instance.instanceId,
        studyInstanceUID: instance.studyInstanceUID,
        studyDescription: instance.studyDescription,
        examDate: instance.examDate,
        patientName: instance.patientName,
        previewUrl:
          instance.previewUrl || `/instances/${instance.instanceId}/preview`,
        stoneViewerUrl:
          instance.stoneViewerUrl ||
          (instance.studyInstanceUID
            ? `${orthanc_url}/stone-webviewer/index.html?study=${instance.studyInstanceUID}`
            : null),
        mainDicomTags: {
          StudyDescription: instance.studyDescription || "Image DICOM",
          PatientName: instance.patientName || "Inconnu",
        },
      };

      try {
        const response = await axios.get(
          `${orthanc_url}/instances/${instance.instanceId}`,
          { auth: orthanc_auth }
        );
        instanceData.mainDicomTags = response.data.MainDicomTags;
        instanceData.studyDescription =
          instanceData.studyDescription ||
          response.data.MainDicomTags.StudyDescription;
        instanceData.patientName =
          instanceData.patientName || response.data.MainDicomTags.PatientName;
      } catch (err) {
        console.warn(
          `Impossible de récupérer l'instance ${instance.instanceId} depuis Orthanc:`,
          err.message
        );
        // Include instance from database even if Orthanc fails
      }

      instances.push(instanceData);
    }

    res.json(instances);
  } catch (error) {
    console.error("Erreur dans getDicomInstances:", error.message, error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getDicomByPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    console.log("Recherche de DICOM pour patientId:", patientId);
    const dossier = await DossierMedical.findOne({
      patient: patientId,
      "documents.type": "DICOM",
    }).select("documents");
    if (!dossier || !dossier.documents.length) {
      return res
        .status(404)
        .json({ message: "Aucun DICOM trouvé pour ce patient" });
    }
    res.status(200).json(dossier.documents);
  } catch (error) {
    console.error("Erreur dans getDicomByPatient:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = { getDicomByPatient };

module.exports = {
  getDossiers: [getDossiers],
  getDossiersByPatient: [getDossiersByPatient],
  createDossier: [upload.single("document"), createDossier],
  updateDossier: [upload.single("document"), updateDossier],
  deleteDossier: [deleteDossier],
  deleteDocument: [deleteDocument],
  getDicomInstances: [getDicomInstances],
  uploadDicom: [upload.array("files", 10), uploadDicom],
  getDicomInstance: [getDicomInstance],
};
