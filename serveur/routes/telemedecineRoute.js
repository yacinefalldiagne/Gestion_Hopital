const express = require('express');
const router = express.Router();
const { sendConsultation, getConsultations, getMessages } = require('../controllers/telemedecineController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, sendConsultation);
router.get('/consultations', verifyToken, getConsultations);
router.get('/messages/:consultationId', verifyToken, getMessages);

module.exports = router;