const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/moodEntry');

// Create a new mood entry
router.post('/', async (req, res) => {
  try {
    const moodEntry = new MoodEntry({
      mood: req.body.mood,
      notes: req.body.notes || '',
      user: req.user.id
    });
    await moodEntry.save();
    res.status(201).json({ message: 'Mood entry created successfully', data: moodEntry });
  } catch (error) {
    res.status(500).json({ message: 'Error creating mood entry', error });
  }
});

// Get all mood entries for the current user
router.get('/', async (req, res) => {
  try {
    const moodEntries = await MoodEntry.find({ user: req.user.id });
    res.json({ message: 'Mood entries retrieved successfully', data: moodEntries });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving mood entries', error });
  }
});

// Update a mood entry
router.put('/:id', async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { mood: req.body.mood, notes: req.body.notes || '' },
      { new: true }
    );
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.json({ message: 'Mood entry updated successfully', data: moodEntry });
  } catch (error) {
    res.status(500).json({ message: 'Error updating mood entry', error });
  }
});

// Delete a mood entry
router.delete('/:id', async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mood entry', error });
  }
});

module.exports = router;