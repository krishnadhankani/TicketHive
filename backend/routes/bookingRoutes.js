const express = require("express");
const router = express.Router();

const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getDashboard
} = require("../controllers/bookingController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// Every booking route belongs to a logged-in attendee
router.use(protect, restrictTo("attendee"));

router.get("/", getMyBookings);
// Literal path before the dynamic "/:id" route
router.get("/dashboard", getDashboard);
router.get("/:id", getBookingById);
router.post("/:eventId", createBooking);
router.put("/:id/cancel", cancelBooking);

module.exports = router;
