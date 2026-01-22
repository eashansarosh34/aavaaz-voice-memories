export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, recordingContent } = req.body;

    if (!user) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const xaiKey = process.env.XAI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!xaiKey || !elevenLabsKey) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    // Generate story using Grok API
    const grokPrompt = `Based on this voice memory: "${recordingContent || 'A cherished voice memory'}", create a heartwarming story about a person who treasured the voice of their loved ones. The story should be about 150-200 words and help understand how preserving voice memories helps cherish moments. Keep it touching and meaningful.`;

    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'user',
            content: grokPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!grokResponse.ok) {
      const error = await grokResponse.text();
      console.error('Grok API error:', error);
      return res.status(500).json({ error: 'Failed to generate story with Grok' });
    }

    const grokData = await grokResponse.json();
    const storyContent = grokData.choices?.[0]?.message?.content || 'Once upon a time, there was a person who treasured the voice of their loved ones...';
    const title = 'Voice Memory Story';

    // Generate audio using ElevenLabs API
    let audioUrl = null;
    try {
      const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey
        },
        body: JSON.stringify({
          text: storyContent.substring(0, 500),
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (elevenLabsResponse.ok) {
        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
      } else {
        console.error('ElevenLabs error:', elevenLabsResponse.status);
      }
    } catch (audioError) {
      console.error('Audio generation error:', audioError);
    }

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
