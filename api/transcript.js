export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).send('<h1>Missing transcript ID</h1>');
  }
  
  try {
    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'nexa-core-website'
      }
    });
    
    if (!response.ok) {
      return res.status(404).send('<h1>Transcript Not Found</h1>');
    }
    
    const gist = await response.json();
    const fileName = Object.keys(gist.files)[0];
    const content = gist.files[fileName].content;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>NexaCore - Support Transcript</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #5865F2;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            color: #2c2f33;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }
        .meta {
            color: #72767d;
            font-size: 16px;
            margin-top: 10px;
        }
        .transcript {
            background: #f8f9fa;
            border: 2px solid #e3e5e8;
            border-radius: 8px;
            padding: 25px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
            line-height: 1.5;
            font-size: 14px;
            color: #2c2f33;
            max-height: 600px;
            overflow-y: auto;
        }
        .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e3e5e8;
            color: #72767d;
            font-size: 14px;
        }
        .logo {
            color: #5865F2;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Support Ticket Transcript</h1>
            <div class="meta">Generated: ${new Date(gist.created_at).toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
        </div>
        <div class="transcript">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div class="footer">
            Powered by <span class="logo">NexaCore</span> Support System
        </div>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <h1>Error Loading Transcript</h1>
      <p>Please try again later or contact support.</p>
    `);
  }
}
