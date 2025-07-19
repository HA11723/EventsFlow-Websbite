import express from "express";
import { body, validationResult } from "express-validator";
import { getCollection } from "../config/database.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// GET /api/v1/events - Get all events with optional filtering
router.get("/v1/events", async (req, res) => {
  try {
    const eventsCollection = getCollection("events");
    const usersCollection = getCollection("users");

    // Build filter based on query parameters
    const filter = {};
    if (req.query.creator) {
      filter.creatorId = new ObjectId(req.query.creator);
    }
    if (req.query.date) {
      filter.date = new Date(req.query.date);
    }

    const events = await eventsCollection.find(filter).toArray();

    // Populate creator information
    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
        const creator = await usersCollection.findOne(
          { _id: event.creatorId },
          { projection: { firstName: 1, lastName: 1, email: 1 } }
        );
        return {
          ...event,
          creatorName: creator
            ? `${creator.firstName} ${creator.lastName}`
            : "Unknown",
          attendeesCount: event.attendees ? event.attendees.length : 0,
        };
      })
    );

    res.json({
      success: true,
      data: eventsWithCreators,
      count: eventsWithCreators.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/v1/events/:id - Get specific event
router.get("/v1/events/:id", async (req, res) => {
  try {
    const eventsCollection = getCollection("events");
    const usersCollection = getCollection("users");

    const event = await eventsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get creator information
    const creator = await usersCollection.findOne(
      { _id: event.creatorId },
      { projection: { firstName: 1, lastName: 1, email: 1 } }
    );

    // Get attendees information
    const attendees = event.attendees
      ? await usersCollection
          .find(
            { _id: { $in: event.attendees } },
            { projection: { firstName: 1, lastName: 1 } }
          )
          .toArray()
      : [];

    const eventWithDetails = {
      ...event,
      creatorName: creator
        ? `${creator.firstName} ${creator.lastName}`
        : "Unknown",
      attendeesList: attendees.map(
        (user) => `${user.firstName} ${user.lastName}`
      ),
      attendeesCount: event.attendees ? event.attendees.length : 0,
    };

    res.json({
      success: true,
      data: eventWithDetails,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/v1/events - Create new event
router.post(
  "/v1/events",
  [
    body("name")
      .isLength({ min: 3, max: 100 })
      .withMessage("Event name must be between 3 and 100 characters"),
    body("date").isISO8601().withMessage("Date must be a valid date"),
    body("startTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),
    body("endTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),
    body("location")
      .isLength({ min: 3, max: 200 })
      .withMessage("Location must be between 3 and 200 characters"),
    body("info")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Event description must be between 10 and 1000 characters"),
    body("creatorId")
      .isMongoId()
      .withMessage("Creator ID must be a valid MongoDB ObjectId"),
    body("maxCapacity")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Max capacity must be between 1 and 1000"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const eventsCollection = getCollection("events");

      const eventData = {
        ...req.body,
        creatorId: new ObjectId(req.body.creatorId),
        attendees: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (req.body.maxCapacity) {
        eventData.maxCapacity = parseInt(req.body.maxCapacity);
      }

      const result = await eventsCollection.insertOne(eventData);

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: {
          id: result.insertedId,
          ...eventData,
        },
      });
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// POST /api/v1/events/:id/join - Join an event
router.post(
  "/v1/events/:id/join",
  [
    body("userId")
      .isMongoId()
      .withMessage("User ID must be a valid MongoDB ObjectId"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const eventsCollection = getCollection("events");
      const eventId = new ObjectId(req.params.id);
      const userId = new ObjectId(req.body.userId);

      const event = await eventsCollection.findOne({ _id: eventId });
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if user is already attending
      if (event.attendees && event.attendees.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: "User is already attending this event",
        });
      }

      // Check capacity
      if (
        event.maxCapacity &&
        event.attendees &&
        event.attendees.length >= event.maxCapacity
      ) {
        return res.status(400).json({
          success: false,
          message: "Event is at maximum capacity",
        });
      }

      const result = await eventsCollection.updateOne(
        { _id: eventId },
        {
          $addToSet: { attendees: userId },
          $set: { updatedAt: new Date() },
        }
      );

      if (result.modifiedCount > 0) {
        res.json({
          success: true,
          message: "Successfully joined the event",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to join event",
        });
      }
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// POST /api/v1/events/:id/leave - Leave an event
router.post(
  "/v1/events/:id/leave",
  [
    body("userId")
      .isMongoId()
      .withMessage("User ID must be a valid MongoDB ObjectId"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const eventsCollection = getCollection("events");
      const eventId = new ObjectId(req.params.id);
      const userId = new ObjectId(req.body.userId);

      const result = await eventsCollection.updateOne(
        { _id: eventId },
        {
          $pull: { attendees: userId },
          $set: { updatedAt: new Date() },
        }
      );

      if (result.modifiedCount > 0) {
        res.json({
          success: true,
          message: "Successfully left the event",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "User was not attending this event",
        });
      }
    } catch (error) {
      console.error("Error leaving event:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// GET /api/v1/users/:id - Get user profile
router.get("/v1/users/:id", async (req, res) => {
  try {
    const usersCollection = getCollection("users");
    const eventsCollection = getCollection("events");

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's created events
    const createdEvents = await eventsCollection
      .find({
        creatorId: new ObjectId(req.params.id),
      })
      .toArray();

    // Get events user is attending
    const attendingEvents = await eventsCollection
      .find({
        attendees: new ObjectId(req.params.id),
      })
      .toArray();

    const userProfile = {
      ...user,
      password: undefined, // Don't send password
      createdEventsCount: createdEvents.length,
      attendingEventsCount: attendingEvents.length,
    };

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
