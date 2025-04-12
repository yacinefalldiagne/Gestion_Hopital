const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
    test,
    createAppointment,
    getAllAppointments,
    getUserAppointments,
    updateAppointmentStatus
} = require("../controllers/appointmentController");

// middleware
router.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);


router.post("/createAppointment", createAppointment)
router.get("/getAllAppointments", getAllAppointments)
router.get("/getUserAppointments", getUserAppointments)
router.put("/updateAppointment", updateAppointmentStatus);


module.exports = router