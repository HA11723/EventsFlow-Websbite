// routes/authRoutes.js - Updated for MongoDB driver with email-only auth
import express from "express";
import { getCollection } from "../config/database.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// GET: Sign In Page
router.get("/signin", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/live-events");
  }
  res.render("signin");
});

// GET: Sign Up Page
router.get("/signup", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/live-events");
  }
  res.render("signup");
});

// POST: Handle Sign Up
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, age, location, bio } = req.body;

    if (!firstName || !lastName || !email || !age || !location || !bio) {
      return res.render("error", {
        message: "Please fill in all required fields.",
        redirectTo: "/signup",
      });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      return res.render("error", {
        message: "Please enter a valid age between 13 and 120.",
        redirectTo: "/signup",
      });
    }

    const usersCollection = getCollection("users");
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.render("error", {
        message: "This email is already registered. Please sign in.",
        redirectTo: "/signup",
      });
    }

    const newUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      age: ageNum,
      location: location.trim(),
      bio: bio.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    req.session.message = "Account created successfully! Please sign in.";
    res.redirect("/signin");
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).render("error", {
      message: "An error occurred while signing up. Please try again.",
      redirectTo: "/signup",
    });
  }
});

// POST: Handle Email-Only Sign In
router.post("/signin", async (req, res) => {
  try {
    const normalizedEmail = req.body.email.trim().toLowerCase();

    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user) {
      return res.render("error", {
        message: "This email is not registered.",
        redirectTo: "/signin",
      });
    }

    // ✅ Email-only sign in (no password check)
    req.session.userId = user._id.toString();
    req.session.firstName = user.firstName;

    console.log("🔐 Signed in without password:", normalizedEmail);
    res.redirect("/live-events");
  } catch (err) {
    console.error("❌ Signin error (email-only):", err);
    res.status(500).render("error", {
      message: "An error occurred during sign in. Please try again.",
      redirectTo: "/signin",
    });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/signin");
  });
});

export default router;
