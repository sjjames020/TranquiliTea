const mongoose = require('mongoose');

// Define the User schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  moodEntries: [
    {
      moodRating: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
      },
    },
  ],
});

// Create the User model
const User = mongoose.model('User', UserSchema);

module.exports = User;