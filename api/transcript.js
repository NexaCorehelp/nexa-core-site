export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { id } = req.query;
  
  if (!id) {
    res.status(400).send(`
      <html>
        <body>
          <h1>Missing Transcript ID</h1>
          <p>Please provide a gist ID in the URL: ?id=your-gist-id</p>
        </body>
      </html>
    `);
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    res.status(500).send(`
      <html>
        <body>
          <h1>Configuration Error</h1>
          <p>GitHub token not configured.</p>
        </body>
      </html>
    `);
    return;
  }
  
  try {
    console.log('Fetching gist:', id);
    
    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'nexa-core-website',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    console.log('GitHub response status:', response.status);
    
    if (!response.ok) {
      res.status(404).send(`
        <html>
          <body>
            <h1>Transcript Not Found</h1>
            <p>Could not find transcript with ID: ${id}</p>
            <p>Status: ${response.status}</p>
          </body>
        </html>
      `);
      return;
    }
    
    const gist = await response.json();
    const fileName = Object.keys(gist.files)[0];
    const content = gist.files[fileName].content;
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>NexaCore - Support Transcript</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 20px auto; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            border-bottom: 2px solid #5865F2; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
        }
        .transcript { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 5px; 
            white-space: pre-wrap; 
            font-family: monospace; 
            border: 1px solid #ddd;
            max-height: 500px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Support Ticket Transcript</h1>
            <p>Generated: ${new Date(gist.created_at).toLocaleString()}</p>
        </div>
        <div class="transcript">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <p><small>Powered by NexaCore Support System</small></p>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error Loading Transcript</h1>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
}`;

Try these steps and let me know what happens with the test API endpoint first!export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { id } = req.query;
  
  if (!id) {
    res.status(400).send(`
      <html>
        <body>
          <h1>Missing Transcript ID</h1>
          <p>Please provide a gist ID in the URL: ?id=your-gist-id</p>
        </body>
      </html>
    `);
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    res.status(500).send(`
      <html>
        <body>
          <h1>Configuration Error</h1>
          <p>GitHub token not configured.</p>
        </body>
      </html>
    `);
    return;
  }
  
  try {
    console.log('Fetching gist:', id);
    
    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'nexa-core-website',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    console.log('GitHub response status:', response.status);
    
    if (!response.ok) {
      res.status(404).send(`
        <html>
          <body>
            <h1>Transcript Not Found</h1>
            <p>Could not find transcript with ID: ${id}</p>
            <p>Status: ${response.status}</p>
          </body>
        </html>
      `);
      return;
    }
    
    const gist = await response.json();
    const fileName = Object.keys(gist.files)[0];
    const content = gist.files[fileName].content;
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>NexaCore - Support Transcript</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 20px auto; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            border-bottom: 2px solid #5865F2; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
        }
        .transcript { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 5px; 
            white-space: pre-wrap; 
            font-family: monospace; 
            border: 1px solid #ddd;
            max-height: 500px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Support Ticket Transcript</h1>
            <p>Generated: ${new Date(gist.created_at).toLocaleString()}</p>
        </div>
        <div class="transcript">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <p><small>Powered by NexaCore Support System</small></p>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error Loading Transcript</h1>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
}`;

Try these steps and let me know what happens with the test API endpoint first!
