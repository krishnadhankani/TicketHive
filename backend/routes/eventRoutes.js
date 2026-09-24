const express = require("express");
const router = express.Router();

const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getOrganizerEvents,
    getEventBookings
} = require("../controllers/eventController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// Public
router.get("/", getEvents);

// Literal paths must be registered before the dynamic "/:id" route
router.get("/organizer/my", protect, restrictTo("organizer", "admin"), getOrganizerEvents);

router.get("/:id", getEventById);
router.get("/:id/bookings", protect, restrictTo("organizer", "admin"), getEventBookings);

// Organiser only
router.post("/", protect, restrictTo("organizer", "admin"), createEvent);
router.put("/:id", protect, restrictTo("organizer", "admin"), updateEvent);
router.delete("/:id", protect, restrictTo("organizer", "admin"), deleteEvent);

module.exports = router;
