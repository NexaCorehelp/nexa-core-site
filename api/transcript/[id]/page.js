export default async function TranscriptPage({ params }) {
  const { id } = params;
  
  try {
    // Fetch the gist content
    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'nexa-core-website'
      }
    });
    
    if (!response.ok) {
      throw new Error('Transcript not found');
    }
    
    const gist = await response.json();
    const fileName = Object.keys(gist.files)[0];
    const content = gist.files[fileName].content;
    
    return (
      <div className="transcript-container">
        <div className="transcript-header">
          <h1>Support Ticket Transcript</h1>
          <p>Generated: {new Date(gist.created_at).toLocaleString()}</p>
        </div>
        <div className="transcript-content">
          <pre>{content}</pre>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="error-page">
        <h1>Transcript Not Found</h1>
        <p>The requested transcript could not be loaded.</p>
      </div>
    );
  }
}
