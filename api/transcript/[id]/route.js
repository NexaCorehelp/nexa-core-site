export async function GET(request, { params }) {
  const { id } = params;
  
  try {
    // Fetch the gist from GitHub
    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'nexa-core-website'
      }
    });
    
    if (!response.ok) {
      return new Response('Transcript not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    const gist = await response.json();
    const fileName = Object.keys(gist.files)[0];
    const content = gist.files[fileName].content;
    
    // Return HTML page
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
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 28px;
        }
        .meta {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .transcript {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 20px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
            line-height: 1.4;
            font-size: 13px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
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
            <div class="meta">Generated: ${new Date(gist.created_at).toLocaleString()}</div>
        </div>
        <div class="transcript">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div class="footer">
            Powered by <span class="logo">NexaCore</span> Support System
        </div>
    </div>
</body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
