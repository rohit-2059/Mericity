const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// helper: create our JWT
function createJWT(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// 1) Google login (frontend sends id_token)
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload.email_verified) return res.status(400).json({ error: 'Google email not verified' });

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email: payload.email });
      if (user) {
        user.googleId = payload.sub; // link account
      } else {
        user = new User({
          googleId: payload.sub,
          email: payload.email,
          picture: payload.picture,
          profileComplete: false
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const tokenToClient = createJWT(user);

    res.json({ 
      token: tokenToClient, 
      user,
      needsProfile: !user.profileComplete // <--- tell frontend if profile is incomplete
    });

  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});


// 2) Manual register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'Email already registered. Please login.' });

  const hashed = await bcrypt.hash(password, 12);
  const user = new User({ email, password: hashed, name, profileComplete: false,  role: "user" });
  await user.save();

  const token = createJWT(user);
  res.json({ token, user, needsProfile: !user.profileComplete });
});


// 3) Manual login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Email not registered. Please register first.' });
  if (!user.password) return res.status(400).json({ error: 'Use Google login for this account.' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Incorrect password.' });

  user.lastLogin = new Date();
  await user.save();

  const token = createJWT(user);
  res.json({ token, user, needsProfile: !user.profileComplete });
});


module.exports = router;
