const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    heureDebut: {
        type: Date,
        required: true
    },
    heureFin: {
        type: Date,
        required: true
    },
    titre: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['en attente', 'valide', 'annule'],
        default: 'en attente'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });


const appointmentModel = mongoose.model('Appointment', appointmentSchema);

module.exports = appointmentModel;