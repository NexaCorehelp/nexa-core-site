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
    
    // Parse the transcript to extract messages
    const messages = [];
    const lines = content.split('\n');
    let currentMessage = null;
    
    for (const line of lines) {
      // Match timestamp and username pattern: [timestamp] username: message
      const messageMatch = line.match(/^\[([^\]]+)\] ([^:]+): (.*)$/);
      if (messageMatch) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          timestamp: messageMatch[1],
          username: messageMatch[2],
          content: messageMatch[3],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(messageMatch[2])}&background=5865f2&color=fff&size=40`
        };
      } else if (currentMessage && line.trim()) {
        // Continue multi-line message
        currentMessage.content += '\n' + line;
      } else if (line.includes('[EMBED:') || line.includes('[ATTACHMENTS:')) {
        if (currentMessage) {
          currentMessage.content += '\n' + line;
        }
      }
    }
    
    if (currentMessage) {
      messages.push(currentMessage);
    }

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>NexaCore - Support Transcript</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Whitney:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #36393f;
            color: #dcddde;
            font-size: 16px;
            line-height: 1.375;
        }
        
        .header {
            background-color: #2f3136;
            border-bottom: 1px solid #202225;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .channel-name {
            font-weight: 600;
            font-size: 16px;
            color: #ffffff;
            margin-left: 8px;
        }
        
        .channel-icon {
            width: 24px;
            height: 24px;
            color: #8e9297;
        }
        
        .transcript-info {
            background-color: #2f3136;
            border-bottom: 1px solid #202225;
            padding: 16px;
            text-align: center;
            color: #b9bbbe;
            font-size: 14px;
        }
        
        .messages-container {
            flex: 1;
            padding: 16px 0;
            max-width: 100%;
        }
        
        .message {
            padding: 2px 48px 2px 72px;
            margin-bottom: 8px;
            position: relative;
            min-height: 44px;
            display: flex;
            align-items: flex-start;
        }
        
        .message:hover {
            background-color: rgba(4, 4, 5, 0.07);
        }
        
        .message.first-in-group {
            margin-top: 16px;
            padding-top: 8px;
        }
        
        .avatar {
            position: absolute;
            left: 16px;
            top: 8px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
        }
        
        .avatar img {
            width: 100%;
            height: 100%;
        }
        
        .message-content {
            flex: 1;
            min-width: 0;
        }
        
        .message-header {
            display: flex;
            align-items: baseline;
            margin-bottom: 4px;
        }
        
        .username {
            font-weight: 500;
            color: #ffffff;
            margin-right: 8px;
            cursor: pointer;
        }
        
        .username:hover {
            text-decoration: underline;
        }
        
        .timestamp {
            font-size: 12px;
            color: #72767d;
            font-weight: 400;
        }
        
        .message-text {
            color: #dcddde;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .embed-indicator {
            background-color: #2f3136;
            border-left: 4px solid #5865f2;
            padding: 8px 12px;
            margin-top: 4px;
            border-radius: 3px;
            font-size: 14px;
            color: #b9bbbe;
        }
        
        .attachment-indicator {
            background-color: #2f3136;
            border: 1px solid #40444b;
            padding: 8px 12px;
            margin-top: 4px;
            border-radius: 3px;
            font-size: 14px;
            color: #b9bbbe;
        }
        
        .system-message {
            background-color: rgba(88, 101, 242, 0.1);
            border-left: 4px solid #5865f2;
            padding: 12px 16px;
            margin: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        ::-webkit-scrollbar {
            width: 14px;
        }
        
        ::-webkit-scrollbar-track {
            background-color: #2e3338;
        }
        
        ::-webkit-scrollbar-thumb {
            background-color: #202225;
            border: 3px solid #2e3338;
            border-radius: 7px;
        }
    </style>
</head>
<body>
    <div class="header">
        <svg class="channel-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41381C8.43914 3.17456 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41381C16.4391 3.17456 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5862C15.3209 20.8254 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5862C7.32088 20.8254 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z"/>
        </svg>
        <span class="channel-name">ticket-${id.substring(0, 8)} - View Transcript</span>
    </div>
    
    <div class="transcript-info">
        Generated on ${new Date(gist.created_at).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} • Powered by NexaCore Support System
    </div>
    
    <div class="messages-container">
        ${messages.map((message, index) => {
          const isFirstInGroup = index === 0 || messages[index - 1].username !== message.username;
          const messageClass = isFirstInGroup ? 'message first-in-group' : 'message';
          
          let messageContent = message.content;
          let additionalContent = '';
          
          // Handle embeds and attachments
          if (messageContent.includes('[EMBED:')) {
            const embedMatch = messageContent.match(/\[EMBED: ([^\]]+)\]/);
            if (embedMatch) {
              additionalContent += `<div class="embed-indicator">📋 Embed: ${embedMatch[1]}</div>`;
              messageContent = messageContent.replace(/\[EMBED: [^\]]+\]/g, '');
            }
          }
          
          if (messageContent.includes('[ATTACHMENTS:')) {
            const attachMatch = messageContent.match(/\[ATTACHMENTS: ([^\]]+)\]/);
            if (attachMatch) {
              additionalContent += `<div class="attachment-indicator">📎 Attachments: ${attachMatch[1]}</div>`;
              messageContent = messageContent.replace(/\[ATTACHMENTS: [^\]]+\]/g, '');
            }
          }
          
          return `
            <div class="${messageClass}">
              ${isFirstInGroup ? `
                <div class="avatar">
                  <img src="${message.avatar}" alt="${message.username}">
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="username">${message.username}</span>
                    <span class="timestamp">${message.timestamp}</span>
                  </div>
                  <div class="message-text">${messageContent.trim()}</div>
                  ${additionalContent}
                </div>
              ` : `
                <div class="message-content" style="margin-left: -56px;">
                  <div class="message-text">${messageContent.trim()}</div>
                  ${additionalContent}
                </div>
              `}
            </div>
          `;
        }).join('')}
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
