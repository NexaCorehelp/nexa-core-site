import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { code, state, error, error_description } = req.query;
    if (error) {
      res.status(400).send(`OAuth error: ${error}${error_description ? ` - ${error_description}` : ''}`);
      return;
    }
    if (!code) {
      const url = req.url || '';
      res.status(400).send(`No code provided. This endpoint must be called by Discord after authorization. URL received: ${url}`);
      return;
    }

    // Prefer NexaPatch-specific env vars; fallback to generic ones if present
    const CLIENT_ID = process.env.DISCORD_NEXAPATCH_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_NEXAPATCH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET;
    // Use explicit env if provided, else derive from request URL path (matches registered redirect)
    const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
    const derivedRedirect = `${proto}://${host}${req.url.split('?')[0]}`;
    const REDIRECT_URI = process.env.DISCORD_NEXAPATCH_REDIRECT_URI || derivedRedirect;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      res.status(500).send('Discord client configuration missing');
      return;
    }

    // Exchange code for access token (scope parameter is optional for token exchange)
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      res.status(400).send('Failed to get access token');
      return;
    }

    // Fetch user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();

    // Optional: fetch guilds if scope includes guilds (ignore failure gracefully)
    let guildCount;
    try {
      const guildRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (guildRes.ok) {
        const guilds = await guildRes.json();
        guildCount = Array.isArray(guilds) ? guilds.length : undefined;
      }
    } catch {}

    // Decide where to redirect next
    // Prefer explicit state hint if provided, else default to server select
    let nextPath = '/nexapatch/nexapatch_server_select.html';
    if (state && typeof state === 'string') {
      const s = state.toLowerCase();
      if (s === 'dashboard' || s === 'admin') nextPath = '/nexapatch/nexapatch_dashboard.html';
      else if (s === 'player') nextPath = '/nexapatch/nexapatch_player.html';
      else if (s === 'select' || s === 'server_select') nextPath = '/nexapatch/nexapatch_server_select.html';
    }

    // Redirect with minimal info for client-side persistence
    const params = new URLSearchParams({
      username: userData?.username || '',
      id: userData?.id || '',
      avatar: userData?.avatar || '',
      ...(guildCount != null ? { guilds: String(guildCount) } : {})
    }).toString();
    res.redirect(`${nextPath}?${params}`);
  } catch (err) {
    res.status(500).send('Internal error');
  }
}
