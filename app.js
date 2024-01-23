const express = require('express');
const mongoose = require('mongoose');
const User = require('./mood-tracker-backend/models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');




// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const app = express();
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  }));

app.use(passport.initialize());
app.use(passport.session());

// Register route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const user = new User({ email, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: 'User registered successfully' });
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
    expiresIn: '1h',
  });

  res.json({ message: 'Logged in successfully', token });
});

// CRUD operations

// Get all mood entries for a user
app.get('/mood-entries', async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(authorization, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);

    res.json(user.moodEntries);
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Add a new mood entry
app.post('/mood-entries', async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(authorization, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);

    const { moodRating, notes } = req.body;

    user.moodEntries.push({ moodRating, notes, date: new Date() });
    await user.save();

    res.status(201).json({ message: 'Mood entry added successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Update a mood entry
app.put('/mood-entries/:id', async (req, res) => {
  const { authorization } = req.headers;
  const { id } = req.params;

  if (!authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(authorization, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);

    const moodEntry = user.moodEntries.id(id);

    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    const { moodRating, notes } = req.body;

    moodEntry.moodRating = moodRating;
    moodEntry.notes = notes;

    await user.save();

    res.json({ message: 'Mood entry updated successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Delete a mood entry
app.delete('/mood-entries/:id', async (req, res) => {
  const { authorization } = req.headers;
  const { id } = req.params;

  if (!authorization) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(authorization, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);

    const moodEntry = user.moodEntries.id(id);

    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    moodEntry.remove();
    await user.save();

    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});