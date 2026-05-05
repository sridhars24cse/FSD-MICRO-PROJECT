const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sprint_tracker')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Models
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  leetcodeUsername: String
}));

const Task = mongoose.model('Task', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  completed: { type: Boolean, default: false },
  category: { type: String, default: 'Work' },
  date: { type: Date, default: Date.now }
}));

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access Denied');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// Routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, password, leetcodeUsername } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await new User({ username, password: hashedPassword, leetcodeUsername }).save();
    res.send({ message: 'User created' });
  } catch (err) { res.status(400).send(err.message); }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('Username not found');
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send('Invalid password');
  
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'secret');
  res.send({ token, leetcodeUsername: user.leetcodeUsername });
});



app.get('/tasks', auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.user._id }).sort({ date: -1 });
  res.send(tasks);
});

app.post('/tasks', auth, async (req, res) => {
  const task = await new Task({ ...req.body, userId: req.user._id }).save();
  res.send(task);
});

app.put('/tasks/:id', auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.send(task);
});

app.delete('/tasks/:id', auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.send({ message: 'Task deleted' });
  } catch (err) { res.status(500).send('Error deleting task'); }
});

app.get('/leetcode/:username', async (req, res) => {
  try {
    const response = await axios.post('https://leetcode.com/graphql', {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum { difficulty count }
            }
          }
        }
      `,
      variables: { username: req.params.username }
    });
    res.send(response.data);
  } catch (err) { res.status(500).send('Leetcode fetch failed'); }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
