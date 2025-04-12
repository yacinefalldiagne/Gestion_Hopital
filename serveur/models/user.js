const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firstname: {
        type: String, required: true
    },
    lastname: {
        type: String, required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        enum: ['medecin', 'patient', 'secretaire'],
        default: 'patient'
    },
    profilePicture: { type: String, default: "default-avatar.png" },

}, { timestamps: true });


const userModel = mongoose.model('User', userSchema);

module.exports = userModel;