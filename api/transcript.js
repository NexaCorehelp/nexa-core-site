export default async function handler(req, res) {
  const { id, auth } = req.query;
  
  if (!id) {
    return res.status(400).send('<h1>Missing transcript ID</h1>');
  }

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).send('<h1>GitHub token not configured</h1>');
  }
  
  try {
    // First, fetch the gist to get transcript content
    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'nexa-core-website',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      return res.status(404).send(`<h1>Transcript Not Found</h1><p>ID: ${id}</p>`);
    }
    
    const gist = await response.json();
    const fileName = Object.keys(gist.files)[0];
    const content = gist.files[fileName].content;
    
    // Extract ticket information from content
    let ticketOpenerUserId = null;
    let ticketId = null;
    
    // Parse the gist description to get ticket info
    const descMatch = gist.description.match(/Ticket (\w+) Transcript - (.+)/);
    if (descMatch) {
      ticketId = descMatch[1];
    }
    
    // Try to extract user ID from transcript content
    const userIdMatch = content.match(/User:\*\* [^|]+\|(\d+)/);
    if (userIdMatch) {
      ticketOpenerUserId = userIdMatch[1];
    } else {
      // Alternative: look for user mentions in the content
      const mentionMatch = content.match(/<@(\d+)>/);
      if (mentionMatch) {
        ticketOpenerUserId = mentionMatch[1];
      }
    }
    
    // Check permissions
    if (!auth) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Access Denied</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #36393f; 
                    color: #dcddde; 
                    text-align: center; 
                    padding: 50px; 
                }
                .container { 
                    max-width: 500px; 
                    margin: 0 auto; 
                    background: #2f3136; 
                    padding: 30px; 
                    border-radius: 8px; 
                }
                .error { color: #f04747; }
                .info { color: #faa61a; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="error">🔒 Access Denied</h1>
                <p>This transcript is private and requires authentication.</p>
                <p class="info">Only the ticket creator and NexaCore staff can view this transcript.</p>
                <p><small>Ticket ID: ${ticketId || 'Unknown'}</small></p>
            </div>
        </body>
        </html>
      `);
    }
    
    // Verify the auth token (you'll need to implement this based on your auth system)
    const authData = await verifyAuthToken(auth);
    if (!authData) {
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Invalid Authentication</title></head>
        <body style="font-family: Arial; background: #36393f; color: #dcddde; text-align: center; padding: 50px;">
            <h1 style="color: #f04747;">🚫 Invalid Authentication</h1>
            <p>The authentication token is invalid or expired.</p>
        </body>
        </html>
      `);
    }
    
    // Check if user is staff or the ticket opener
    const isStaff = authData.roles && authData.roles.some(role => 
      ['1396699975299108915', '1405348622404550737', '1405349637493100684'].includes(role)
    );
    
    const isTicketOpener = authData.userId === ticketOpenerUserId;
    
    if (!isStaff && !isTicketOpener) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Access Denied</title></head>
        <body style="font-family: Arial; background: #36393f; color: #dcddde; text-align: center; padding: 50px;">
            <h1 style="color: #f04747;">🔒 Access Denied</h1>
            <p>You don't have permission to view this transcript.</p>
            <p style="color: #faa61a;">Only the ticket creator and NexaCore staff can access this content.</p>
        </body>
        </html>
      `);
    }
    
    // [Rest of your existing transcript rendering code here...]
    // Function to parse Discord mentions and replace them
    function parseMentions(text) {
      // [Your existing parseMentions function code...]
    }
    
    // [Your existing message parsing and HTML generation code...]
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
}

// Authentication verification function
async function verifyAuthToken(token) {
  try {
    // Option 1: JWT Token verification
    if (token.startsWith('eyJ')) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    }
    
    // Option 2: Simple signed token (user_id:timestamp:signature)
    const [userId, timestamp, signature] = token.split(':');
    const expectedSig = require('crypto')
      .createHmac('sha256', process.env.AUTH_SECRET || 'your-secret-key')
      .update(`${userId}:${timestamp}`)
      .digest('hex');
    
    if (signature === expectedSig && Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000) {
      // Token is valid for 24 hours
      return { userId, timestamp };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
