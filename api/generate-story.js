export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, userInput, voiceId } = req.body;

    if (!user) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const xaiKey = process.env.XAI_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!xaiKey || !elevenLabsKey) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    // Generate emotionally intelligent response using Grok AI
    const grokPrompt = `You are an emotionally intelligent companion speaking with someone about their voice memories and cherished moments. 
    User said: "${userInput || 'Please respond with warmth and empathy'}"
    
    Respond with a heartfelt, concise response (2-3 sentences max) that acknowledges their feelings and helps them reflect on cherished moments. Be warm, personal, and emotionally aware.`;

    console.log('Calling Grok API with prompt...', grokPrompt.substring(0, 100));

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
            role: 'system',
            content: 'You are a compassionate, emotionally aware companion for voice memory preservation. Respond warmly and concisely.'
          },
          {
            role: 'user',
            content: grokPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!grokResponse.ok) {
      const error = await grokResponse.text();
      console.error('Grok API error:', error);
      return res.status(500).json({ error: 'Failed to generate response from Grok', details: error });
    }

    const grokData = await grokResponse.json();
    const responseText = grokData.choices?.[0]?.message?.content || 'I hear you. Your voice memories are precious moments to cherish.';
    console.log('Grok response:', responseText);

    // Use provided voiceId or default to a professional voice
    const selectedVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default ElevenLabs voice

    // Generate audio using ElevenLabs with the reference voice
    let audioUrl = null;
    try {
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey
        },
        body: JSON.stringify({
          text: responseText,
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
        console.log('Audio generated successfully');
      } else {
        const errorText = await elevenLabsResponse.text();
        console.error('ElevenLabs error:', elevenLabsResponse.status, errorText);
      }
    } catch (audioError) {
      console.error('Audio generation error:', audioError);
    }

    return res.status(200).json({
      success: true,
      response: responseText,
      audio: audioUrl,
      voiceUsed: selectedVoiceId,
      message: 'Response generated with emotional intelligence!'
    });
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
}
