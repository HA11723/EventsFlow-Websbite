// JSON Schema validation for MongoDB collections
export const userSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["firstName", "lastName", "email", "age", "location", "bio"],
      properties: {
        firstName: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50,
          description:
            "First name must be a string between 2 and 50 characters",
        },
        lastName: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50,
          description: "Last name must be a string between 2 and 50 characters",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email must be a valid email format",
        },
        age: {
          bsonType: "int",
          minimum: 13,
          maximum: 120,
          description: "Age must be between 13 and 120",
        },
        location: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100,
          description: "Location must be a string between 2 and 100 characters",
        },
        bio: {
          bsonType: "string",
          minLength: 10,
          maxLength: 500,
          description: "Bio must be between 10 and 500 characters",
        },

        createdAt: {
          bsonType: "date",
          description: "Creation timestamp",
        },
        updatedAt: {
          bsonType: "date",
          description: "Last update timestamp",
        },
      },
    },
  },
};

export const eventSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "name",
        "date",
        "startTime",
        "endTime",
        "location",
        "info",
        "creatorId",
      ],
      properties: {
        name: {
          bsonType: "string",
          minLength: 3,
          maxLength: 100,
          description:
            "Event name must be a string between 3 and 100 characters",
        },
        date: {
          bsonType: "date",
          description: "Event date must be a valid date",
        },
        startTime: {
          bsonType: "string",
          pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
          description: "Start time must be in HH:MM format",
        },
        endTime: {
          bsonType: "string",
          pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
          description: "End time must be in HH:MM format",
        },
        location: {
          bsonType: "string",
          minLength: 3,
          maxLength: 200,
          description: "Location must be a string between 3 and 200 characters",
        },
        info: {
          bsonType: "string",
          minLength: 10,
          maxLength: 1000,
          description:
            "Event description must be between 10 and 1000 characters",
        },
        creatorId: {
          bsonType: "objectId",
          description: "Creator ID must be a valid ObjectId",
        },
        attendees: {
          bsonType: "array",
          items: {
            bsonType: "objectId",
          },
          description: "Attendees must be an array of ObjectIds",
        },
        maxCapacity: {
          bsonType: ["int", "null"],
          minimum: 1,
          maximum: 1000,
          description: "Maximum capacity must be between 1 and 1000",
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp",
        },
        updatedAt: {
          bsonType: "date",
          description: "Last update timestamp",
        },
      },
    },
  },
};
