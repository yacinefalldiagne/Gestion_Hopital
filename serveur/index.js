const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log("DB not connected", err));

const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);

// Middleware pour parser les JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth/", require("./routes/authRoutes"));
app.use("/api/appointement/", require("./routes/appointmentRoutes"));
app.use("/api/dossier/", require("./routes/dossierRoutes"));

// Lancement du serveur
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
