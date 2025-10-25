const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Load environment variables
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// Callback endpoint for Discord OAuth2
router.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  // Exchange code for access token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify email bot'
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(400).send('Failed to get access token');

  // Fetch user info
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const userData = await userRes.json();

  // Example: send user info as JSON (customize as needed)
  res.json({
    username: userData.username,
    email: userData.email,
    avatar: userData.avatar,
    id: userData.id
  });
});

module.exports = router;
