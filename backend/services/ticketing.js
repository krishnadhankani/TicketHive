const crypto = require("crypto");
const Event = require("../models/Event");

// Guard rail so one account cannot hoover up a whole event in a single click
const MAX_TICKETS_PER_BOOKING = 10;

/*
 * Reserves tickets with a single conditional update.
 *
 * The filter itself contains `availableTickets: { $gte: quantity }`, so MongoDB
 * only applies the decrement if enough tickets still exist at the moment of the
 * write. Two people buying the last ticket at the same time cannot both succeed:
 * whoever loses the race gets `null` back instead of a negative stock count.
 */
const reserveTickets = async (eventId, quantity) => {
    return Event.findOneAndUpdate(
        {
            _id: eventId,
            availableTickets: { $gte: quantity }
        },
        {
            $inc: { availableTickets: -quantity }
        },
        {
            new: true
        }
    );
};

// Puts tickets back when a booking is cancelled or a later step fails
const releaseTickets = async (eventId, quantity) => {
    return Event.findByIdAndUpdate(
        eventId,
        { $inc: { availableTickets: quantity } },
        { new: true }
    );
};

const generateReference = () => {
    return `TH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

/*
 * Every rule that must hold before money or tickets move.
 * Returns null when the request is fine, or { status, message } when it is not.
 */
const validateBookingRequest = ({ event, user, quantity }) => {
    if (user.role !== "attendee") {
        return { status: 403, message: "Only attendees can book tickets" };
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        return { status: 400, message: "Quantity must be a whole number of at least 1" };
    }

    if (quantity > MAX_TICKETS_PER_BOOKING) {
        return {
            status: 400,
            message: `You can book at most ${MAX_TICKETS_PER_BOOKING} tickets at a time`
        };
    }

    if (event.organizer.toString() === user.userId) {
        return { status: 400, message: "You cannot book tickets for your own event" };
    }

    if (new Date(event.date) <= new Date()) {
        return { status: 400, message: "This event has already taken place" };
    }

    if (event.availableTickets < quantity) {
        return {
            status: 409,
            message: event.availableTickets === 0
                ? "This event is sold out"
                : `Only ${event.availableTickets} ticket(s) left`
        };
    }

    return null;
};

module.exports = {
    MAX_TICKETS_PER_BOOKING,
    reserveTickets,
    releaseTickets,
    generateReference,
    validateBookingRequest
};
