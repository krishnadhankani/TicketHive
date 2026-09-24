const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        venue: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        totalTickets: {
            type: Number,
            required: true,
            min: 1
        },

        // Decremented atomically on booking, restored on cancellation
        availableTickets: {
            type: Number,
            required: true,
            min: 0
        },

        imageUrl: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Event", eventSchema);
