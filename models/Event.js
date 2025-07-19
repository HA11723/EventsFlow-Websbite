// models/Event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Event creator
    name: { type: String, required: true }, // Event name
    startTime: { type: String, required: true }, // Start time of the event
    endTime: { type: String, required: true }, // End time of the event
    date: { type: String, required: true }, // Event date
    info: { type: String, required: true }, // Event information
    location: { type: String, required: true }, // Event location
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // This is where the `User` model is referenced
      },
    ],
    maxCapacity: { type: Number, default: null }, // Optional max capacity for the event
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt timestamps
  }
);

export default mongoose.model("Event", eventSchema);
