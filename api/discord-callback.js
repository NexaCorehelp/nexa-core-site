import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('discord-callback handler invoked');
  const code = req.query.code;
  console.log('Callback URL:', req.url, 'State:', req.query.state);
  if (!code) {
    res.status(400).send('No code provided');
    return;
  }

  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
  console.log('Using redirect_uri:', REDIRECT_URI);

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
      scope: 'identify email'
    })
  });
  const tokenData = await tokenRes.json();
  console.log('Token response:', tokenData);
  if (!tokenData.access_token) {
    res.status(400).send('Failed to get access token');
    return;
  }

  // Fetch user info
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const userData = await userRes.json();

    // Redirect to home page with user info as query params
    const params = new URLSearchParams({
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar,
      id: userData.id
    }).toString();
    res.redirect(`/?${params}`);
}
