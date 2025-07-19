// app.js - Updated for CPSC 2600 requirements
import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import methodOverride from "method-override";
import { connectToDatabase, getDatabase } from "./config/database.js";
import { userSchema, eventSchema } from "./schemas/validation.js";
import authRoutes from "./routes/authRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "eventflow-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
  })
);

console.log("Middleware configured");

// Initialize database with schema validation
async function initializeDatabase() {
  try {
    const db = await connectToDatabase();

    // Create collections with JSON Schema validation
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes("users")) {
      await db.createCollection("users", userSchema);
      console.log("✅ Users collection created with schema validation");
    }

    if (!collectionNames.includes("events")) {
      await db.createCollection("events", eventSchema);
      console.log("✅ Events collection created with schema validation");
    }

    // Create indexes for better performance
    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ firstName: 1, lastName: 1 });

    const eventsCollection = db.collection("events");
    await eventsCollection.createIndex({ creatorId: 1 });
    await eventsCollection.createIndex({ date: 1 });
    await eventsCollection.createIndex({ attendees: 1 });

    console.log("✅ Database indexes created");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

// Home Route
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect("/live-events");
  } else {
    res.redirect("/signin");
  }
});

// Routes
app.use("/", authRoutes);
app.use("/", eventsRoutes);
app.use("/api", apiRoutes); // API routes for JSON responses

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Check environment variables
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  console.error(
    "💡 Please create a .env file with your MongoDB connection string"
  );
  process.exit(1);
}

console.log("🔗 Attempting to connect to MongoDB...");

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();

    // Start the server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api/v1/`);
      console.log(`🌐 Web interface at http://localhost:${PORT}/live-events`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);

    // Provide specific error guidance
    if (error.message.includes("Authentication failed")) {
      console.error(
        "🔐 Authentication Error: Check your username and password"
      );
    } else if (
      error.message.includes("network") ||
      error.message.includes("timeout")
    ) {
      console.error(
        "🌐 Network Error: Check your internet connection and MongoDB IP whitelist"
      );
    } else if (error.message.includes("serverSelectionTimeoutMS")) {
      console.error("⏰ Connection Timeout: MongoDB is not responding");
    }

    console.error("💡 Troubleshooting steps:");
    console.error("   1. Check MongoDB cluster status");
    console.error("   2. Verify your IP is whitelisted");
    console.error("   3. Check your internet connection");
    console.error("   4. Verify connection string in .env file");

    process.exit(1);
  }
}

// Start the application
startServer();
