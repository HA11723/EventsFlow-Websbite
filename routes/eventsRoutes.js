// routes/eventsRoutes.js - Updated for MongoDB driver
import express from "express";
import { getCollection } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Live Events Page - Show ALL events from ALL users
router.get("/live-events", requireAuth, async (req, res) => {
  const firstName = req.session.firstName || "Guest";
  const message = req.session.message;
  req.session.message = null;

  try {
    const eventsCollection = getCollection("events");
    const usersCollection = getCollection("users");

    const events = await eventsCollection.find({}).toArray();

    const eventsWithOwnership = await Promise.all(
      events.map(async (event) => {
        const creator = await usersCollection.findOne(
          { _id: event.creatorId },
          { projection: { firstName: 1, lastName: 1 } }
        );

        const attendees = event.attendees
          ? await usersCollection
              .find(
                { _id: { $in: event.attendees } },
                { projection: { firstName: 1, lastName: 1 } }
              )
              .toArray()
          : [];

        return {
          ...event,
          isOwner: event.creatorId.toString() === req.session.userId.toString(),
          creatorName: creator
            ? `${creator.firstName} ${creator.lastName}`
            : "Unknown",
          isAttending:
            event.attendees &&
            event.attendees.some(
              (attendeeId) =>
                attendeeId.toString() === req.session.userId.toString()
            ),
          attendeesCount: event.attendees ? event.attendees.length : 0,
          attendeesList: attendees.map(
            (attendee) => `${attendee.firstName} ${attendee.lastName}`
          ),
        };
      })
    );

    res.render("live-events", {
      user: { firstName },
      events: eventsWithOwnership,
      message,
    });
  } catch (err) {
    console.error(err);
    res.render("live-events", {
      user: { firstName },
      events: [],
      message: "Error loading events.",
    });
  }
});

// My Events Only - Show user's own events
router.get("/my-events", requireAuth, async (req, res) => {
  const firstName = req.session.firstName || "Guest";
  const message = req.session.message;
  req.session.message = null;

  try {
    const eventsCollection = getCollection("events");
    const usersCollection = getCollection("users");

    const events = await eventsCollection
      .find({
        creatorId: new ObjectId(req.session.userId),
      })
      .toArray();

    const eventsWithOwnership = await Promise.all(
      events.map(async (event) => {
        const creator = await usersCollection.findOne(
          { _id: event.creatorId },
          { projection: { firstName: 1, lastName: 1 } }
        );

        const attendees = event.attendees
          ? await usersCollection
              .find(
                { _id: { $in: event.attendees } },
                { projection: { firstName: 1, lastName: 1 } }
              )
              .toArray()
          : [];

        return {
          ...event,
          isOwner: true,
          creatorName: creator
            ? `${creator.firstName} ${creator.lastName}`
            : "Unknown",
          isAttending:
            event.attendees &&
            event.attendees.some(
              (attendeeId) =>
                attendeeId.toString() === req.session.userId.toString()
            ),
          attendeesCount: event.attendees ? event.attendees.length : 0,
          attendeesList: attendees.map(
            (attendee) => `${attendee.firstName} ${attendee.lastName}`
          ),
        };
      })
    );

    res.render("live-events", {
      user: { firstName },
      events: eventsWithOwnership,
      message: "Showing only your events",
    });
  } catch (err) {
    console.error(err);
    res.render("live-events", {
      user: { firstName },
      events: [],
      message: "Error loading your events.",
    });
  }
});

// Upcoming Events - Show future events only
router.get("/upcoming-events", requireAuth, async (req, res) => {
  const firstName = req.session.firstName || "Guest";
  const message = req.session.message;
  req.session.message = null;

  try {
    const eventsCollection = getCollection("events");
    const usersCollection = getCollection("users");

    const today = new Date().toISOString().split("T")[0];

    const events = await eventsCollection
      .find({
        date: { $gte: new Date(today) },
      })
      .toArray();

    const eventsWithOwnership = await Promise.all(
      events.map(async (event) => {
        const creator = await usersCollection.findOne(
          { _id: event.creatorId },
          { projection: { firstName: 1, lastName: 1 } }
        );

        const attendees = event.attendees
          ? await usersCollection
              .find(
                { _id: { $in: event.attendees } },
                { projection: { firstName: 1, lastName: 1 } }
              )
              .toArray()
          : [];

        return {
          ...event,
          isOwner: event.creatorId.toString() === req.session.userId.toString(),
          creatorName: creator
            ? `${creator.firstName} ${creator.lastName}`
            : "Unknown",
          isAttending:
            event.attendees &&
            event.attendees.some(
              (attendeeId) =>
                attendeeId.toString() === req.session.userId.toString()
            ),
          attendeesCount: event.attendees ? event.attendees.length : 0,
          attendeesList: attendees.map(
            (attendee) => `${attendee.firstName} ${attendee.lastName}`
          ),
        };
      })
    );

    res.render("live-events", {
      user: { firstName },
      events: eventsWithOwnership,
      message: "Showing upcoming events only",
    });
  } catch (err) {
    console.error(err);
    res.render("live-events", {
      user: { firstName },
      events: [],
      message: "Error loading upcoming events.",
    });
  }
});

// Join Event - API endpoint
router.post("/join-event", requireAuth, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.session.userId;

  try {
    const eventsCollection = getCollection("events");
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Check if user is already attending
    if (
      event.attendees &&
      event.attendees.some((id) => id.toString() === userId.toString())
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already attending this event",
      });
    }

    // Check if event is at capacity (if maxCapacity is set)
    if (
      event.maxCapacity &&
      event.attendees &&
      event.attendees.length >= event.maxCapacity
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Event is at full capacity" });
    }

    // Add user to attendees
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $addToSet: { attendees: new ObjectId(userId) } }
    );

    res.json({ success: true, message: "Successfully joined the event!" });
  } catch (err) {
    console.error("Error joining event:", err);
    res.status(500).json({ success: false, message: "Error joining event" });
  }
});

// Leave Event - API endpoint
router.post("/leave-event", requireAuth, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.session.userId;

  try {
    const eventsCollection = getCollection("events");

    // Remove user from attendees
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      { $pull: { attendees: new ObjectId(userId) } }
    );

    res.json({ success: true, message: "Successfully left the event!" });
  } catch (err) {
    console.error("Error leaving event:", err);
    res.status(500).json({ success: false, message: "Error leaving event" });
  }
});

// Event creation step pages
router.get("/time", requireAuth, (req, res) => res.render("time"));
router.post("/save-time", requireAuth, (req, res) => {
  const { startTime, endTime } = req.body;
  req.session.eventTime = { startTime, endTime };
  res.redirect("/create-events");
});

router.get("/date", requireAuth, (req, res) => res.render("date"));
router.post("/save-date", requireAuth, (req, res) => {
  const { eventDate } = req.body;
  req.session.eventDate = eventDate;
  res.redirect("/create-events");
});

router.get("/info", requireAuth, (req, res) => res.render("info"));
router.post("/save-info", requireAuth, (req, res) => {
  const { eventInfo } = req.body;
  req.session.eventInfo = eventInfo;
  res.redirect("/create-events");
});

router.get("/location", requireAuth, (req, res) => res.render("location"));
router.post("/save-location", requireAuth, (req, res) => {
  const { location } = req.body;
  req.session.eventLocation = location;
  res.redirect("/create-events");
});

// Create Events Page
router.get("/create-events", requireAuth, (req, res) => {
  const firstName = req.session.firstName || "Guest";
  const { eventTime, eventDate, eventInfo, eventLocation } = req.session;
  const message = req.session.message;
  req.session.message = null;

  res.render("create-events", {
    user: { firstName },
    eventTime,
    eventDate,
    eventInfo,
    eventLocation,
    message,
  });
});

// Submit Event
router.post("/submit-event", requireAuth, async (req, res) => {
  const { startTime, endTime } = req.session.eventTime || {};
  const date = req.session.eventDate;
  const info = req.session.eventInfo;
  const location = req.session.eventLocation;
  const { name, maxCapacity } = req.body;

  try {
    const eventsCollection = getCollection("events");

    const eventData = {
      name,
      date: new Date(date),
      startTime,
      endTime,
      location,
      info,
      creatorId: new ObjectId(req.session.userId),
      attendees: [],
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await eventsCollection.insertOne(eventData);

    // Clear session data
    delete req.session.eventTime;
    delete req.session.eventDate;
    delete req.session.eventInfo;
    delete req.session.eventLocation;

    req.session.message = "Event created successfully!";
    res.redirect("/live-events");
  } catch (err) {
    console.error("Error saving event:", err);
    req.session.message = "Error saving event. Please try again.";
    res.redirect("/create-events");
  }
});

// Delete Event
router.post("/events/:id/delete", requireAuth, async (req, res) => {
  const eventId = req.params.id;
  console.log("Delete route hit for event ID:", eventId);

  try {
    const eventsCollection = getCollection("events");

    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId),
      creatorId: new ObjectId(req.session.userId),
    });

    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you don't have permission to delete it.",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Event deleted successfully!",
      });
    }
  } catch (err) {
    console.error("Error deleting event:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting event. Please try again.",
    });
  }
});

// Edit Event Page
router.get("/events/:id/edit", requireAuth, async (req, res) => {
  const firstName = req.session.firstName || "Guest";
  const eventId = req.params.id;

  try {
    const eventsCollection = getCollection("events");
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      creatorId: new ObjectId(req.session.userId),
    });

    if (!event) {
      req.session.message =
        "Event not found or you don't have permission to edit it.";
      return res.redirect("/live-events");
    }

    res.render("edit-event", {
      user: { firstName },
      event,
    });
  } catch (err) {
    console.error(err);
    req.session.message = "Error loading event.";
    res.redirect("/live-events");
  }
});

// Update Event
router.post("/events/:id/edit", requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const { name, date, startTime, endTime, location, info, maxCapacity } =
    req.body;

  try {
    const eventsCollection = getCollection("events");

    const updateData = {
      name,
      date: new Date(date),
      startTime,
      endTime,
      location,
      info,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      updatedAt: new Date(),
    };

    const result = await eventsCollection.updateOne(
      {
        _id: new ObjectId(eventId),
        creatorId: new ObjectId(req.session.userId),
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      req.session.message =
        "Event not found or you don't have permission to edit it.";
    } else {
      req.session.message = "Event updated successfully!";
    }

    res.redirect("/live-events");
  } catch (err) {
    console.error("Error updating event:", err);
    req.session.message = "Error updating event. Please try again.";
    res.redirect(`/events/${eventId}/edit`);
  }
});

// Profile Page
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const usersCollection = getCollection("users");
    const eventsCollection = getCollection("events");

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.session.userId),
    });

    if (!user) {
      return res.redirect("/signin");
    }

    // Get user's created events count
    const createdEventsCount = await eventsCollection.countDocuments({
      creatorId: new ObjectId(req.session.userId),
    });

    // Get events user is attending count
    const attendingEventsCount = await eventsCollection.countDocuments({
      attendees: new ObjectId(req.session.userId),
    });

    const userProfile = {
      ...user,
      password: undefined, // Don't send password to frontend
      createdEventsCount,
      attendingEventsCount,
    };

    res.render("profile", { user: userProfile });
  } catch (err) {
    console.error(err);
    res.redirect("/signin");
  }
});

export default router;
