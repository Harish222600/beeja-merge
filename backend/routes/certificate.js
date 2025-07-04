const express = require("express");
const router = express.Router();

const {
  generateCertificate,
  verifyCertificate,
  getUserCertificates
} = require("../controllers/certificate");

const { auth } = require("../middleware/auth");

// ********************************************************************************************************
//                                      Certificate routes
// ********************************************************************************************************

// Generate certificate for completed course (Protected)
router.post("/generate", auth, generateCertificate);

// Verify certificate by ID (Public)
router.get("/verify/:certificateId", verifyCertificate);

// Get user's certificates (Protected)
router.get("/user-certificates", auth, getUserCertificates);

module.exports = router;
