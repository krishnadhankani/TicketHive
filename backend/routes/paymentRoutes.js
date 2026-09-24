const express = require("express");
const router = express.Router();

const { checkout, getMyPayments } = require("../controllers/paymentController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.get("/my", protect, restrictTo("attendee"), getMyPayments);
router.post("/:eventId/checkout", protect, restrictTo("attendee"), checkout);

module.exports = router;
