export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = req.body;

    if (!user) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate story using Grok AI
    // For now, generating a mock story. In production, integrate with Grok API
    const grokPrompt = `Generate a heartwarming story about a person's voice memories and how they help preserve cherished moments.`;
    
    const storyContent = `Once upon a time, there was a person who treasured the voice of their loved ones. These precious voice memories became bridges connecting hearts across time and distance. Each recording carried not just words, but emotions, laughter, and the essence of human connection.`;
    
    const title = 'A Voice Through Time';

    // Generate audio using ElevenLabs (mock for now)
    // In production, call ElevenLabs API with the story content
    const audioUrl = null; // Will be generated via ElevenLabs in production

    return res.status(200).json({
      success: true,
      title: title,
      content: storyContent,
      audio: audioUrl,
      message: 'Story generated successfully!'
    });

  } catch (error) {
    console.error('Error generating story:', error);
    return res.status(500).json({ 
      error: 'Failed to generate story',
      details: error.message 
    });
  }
}
