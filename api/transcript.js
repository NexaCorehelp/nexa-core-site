export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).send('<h1>Missing transcript ID</h1>');
  }

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).send('<h1>GitHub token not configured</h1>');
  }
  
  try {
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
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
}
