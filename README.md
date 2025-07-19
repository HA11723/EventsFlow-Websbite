# EventFlow - Social Event Management Application

## 📋 Project Overview

EventFlow is a social event management application that allows users to create, discover, and join events in their community. Users can create events, view all available events, join events they're interested in, and manage their profile.

## 🚀 Features

- **User Authentication**: Sign up and sign in functionality
- **Event Creation**: Create events with detailed information
- **Event Discovery**: Browse all available events with filtering
- **Event Participation**: Join and leave events
- **User Profiles**: View and manage user information
- **Real-time Updates**: Events update dynamically
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with official Node.js driver
- **Frontend**: EJS templating engine
- **Validation**: Express-validator, JSON Schema validation
- **Styling**: Custom CSS with modern design
- **Authentication**: bcrypt for password hashing

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone [your-repo-url]
   cd eventflow-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your MongoDB connection string:

   ```
   MONGODB_URI=mongodb://localhost:27017/eventflow
   SESSION_SECRET=your-super-secret-session-key
   PORT=3000
   ```

4. **Start the application**

   ```bash
   npm start
   ```

5. **Access the application**
   - Web Interface: http://localhost:3000
   - API Endpoints: http://localhost:3000/api/v1/

## 📚 API Documentation

### Base URL

`http://localhost:3000/api/v1`

### Authentication Endpoints

All endpoints return JSON responses with the following format:

```json
{
  "success": true/false,
  "data": {...},
  "message": "Success/Error message"
}
```

### Events API

#### GET /api/v1/events

Get all events with optional filtering.

**Query Parameters:**

- `creator` (optional): Filter by creator ID
- `date` (optional): Filter by specific date

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "event_id",
      "name": "Event Name",
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "16:00",
      "location": "Event Location",
      "info": "Event description",
      "creatorId": "user_id",
      "creatorName": "John Doe",
      "attendeesCount": 5,
      "maxCapacity": 50
    }
  ],
  "count": 1
}
```

#### GET /api/v1/events/:id

Get a specific event by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "event_id",
    "name": "Event Name",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "location": "Event Location",
    "info": "Event description",
    "creatorId": "user_id",
    "creatorName": "John Doe",
    "attendeesList": ["John Doe", "Jane Smith"],
    "attendeesCount": 2,
    "maxCapacity": 50
  }
}
```

#### POST /api/v1/events

Create a new event.

**Request Body:**

```json
{
  "name": "Event Name",
  "date": "2024-01-15",
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Event Location",
  "info": "Event description",
  "creatorId": "user_id",
  "maxCapacity": 50
}
```

**Response:**

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "new_event_id",
    "name": "Event Name",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "location": "Event Location",
    "info": "Event description",
    "creatorId": "user_id",
    "attendees": [],
    "maxCapacity": 50,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

#### POST /api/v1/events/:id/join

Join an event.

**Request Body:**

```json
{
  "userId": "user_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully joined the event"
}
```

#### POST /api/v1/events/:id/leave

Leave an event.

**Request Body:**

```json
{
  "userId": "user_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully left the event"
}
```

### Users API

#### GET /api/v1/users/:id

Get user profile information.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "createdEventsCount": 3,
    "attendingEventsCount": 5
  }
}
```

## 🗄️ Database Schema

### Users Collection

```json
{
  "firstName": "string (2-50 chars)",
  "lastName": "string (2-50 chars)",
  "email": "string (valid email format)",
  "password": "string (min 6 chars)",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Events Collection

```json
{
  "name": "string (3-100 chars)",
  "date": "date",
  "startTime": "string (HH:MM format)",
  "endTime": "string (HH:MM format)",
  "location": "string (3-200 chars)",
  "info": "string (10-1000 chars)",
  "creatorId": "ObjectId",
  "attendees": "array of ObjectIds",
  "maxCapacity": "integer (1-1000, optional)",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 🔧 Technical Requirements Met

### ✅ MongoDB Database

- ✅ Uses official MongoDB Node.js driver
- ✅ Two collections: Users and Events
- ✅ JSON Schema validation implemented
- ✅ References linking documents between collections
- ✅ Environment variables for credentials

### ✅ Node.js and Express Backend

- ✅ Organized with routing and controller logic separated
- ✅ Middleware for validation and authentication
- ✅ REST API with JSON responses
- ✅ URL versioning (/api/v1/)
- ✅ Resource-based endpoint names
- ✅ Sensible response codes
- ✅ Filter parameters in URL

### ✅ Data Validation

- ✅ Two levels of validation:
  1. Express-validator middleware (controller level)
  2. JSON Schema validation (database level)
- ✅ Input sanitization and validation
- ✅ Error handling with proper messages

### ✅ API Features

- ✅ GET and POST routes implemented
- ✅ REST conventions followed
- ✅ JSON format responses
- ✅ URL versioning (/api/v1/)
- ✅ Resource-based endpoints
- ✅ Proper HTTP status codes
- ✅ Filter parameters support

## 🎯 Features I'm Proud Of

1. **Modern UI/UX Design**: Glass-morphism effects, responsive design, beautiful animations
2. **Comprehensive API**: Full REST API with proper validation and error handling
3. **Database Design**: Proper schema validation and relationships
4. **Security**: Password hashing, input validation, session management
5. **Performance**: Database indexing, efficient queries
6. **User Experience**: Intuitive interface, real-time updates, clear feedback
7. **Code Quality**: Modular architecture, proper error handling, clean code

## 🚀 How to Use the Application

1. **Sign Up/In**: Create an account or sign in with existing credentials
2. **Browse Events**: View all available events on the Live Events page
3. **Create Events**: Use the Create Events page to add new events
4. **Join Events**: Click "Join" on any event you're interested in
5. **Manage Profile**: View your profile and event statistics
6. **API Access**: Use the REST API for programmatic access

## 📚 References

### MongoDB Documentation

- **Source**: https://docs.mongodb.com/drivers/node/
- **Used in**: `config/database.js` (lines 1-25)

### Express.js Documentation

- **Source**: https://expressjs.com/
- **Used in**: `app.js` (lines 1-15), `routes/apiRoutes.js` (lines 1-10)

### Express-validator Documentation

- **Source**: https://express-validator.github.io/docs/
- **Used in**: `routes/apiRoutes.js` (lines 2, 15-20)

### bcrypt Documentation

- **Source**: https://github.com/dcodeIO/bcrypt.js
- **Used in**: `routes/authRoutes.js` (password hashing)

### Font Awesome Icons

- **Source**: https://fontawesome.com/
- **Used in**: All EJS templates for UI icons

## 🐛 Testing

The application has been thoroughly tested for:

- ✅ User registration and authentication
- ✅ Event creation and management
- ✅ API endpoint functionality
- ✅ Database operations
- ✅ Input validation and error handling
- ✅ Responsive design on different devices
- ✅ Cross-browser compatibility


---

**Developed for CPSC 2600 Final Project**
_EventFlow - Bringing communities together through events_
