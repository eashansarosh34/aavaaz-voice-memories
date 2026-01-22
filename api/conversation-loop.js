export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, audioBase64, voiceId } = req.body;
    if (!userId || !audioBase64 || !voiceId) {
      return res.status(400).json({ error: 'User ID, audio, and voice ID are required' });
    }

    // 1. SPEECH-TO-TEXT: Convert audio to text using Whisper API
    console.log('Step 1: Converting speech to text...');
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    const sttFormData = new FormData();
    sttFormData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    sttFormData.append('model', 'whisper-1');
    
    const sttResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: sttFormData
    });

    if (!sttResponse.ok) {
      const error = await sttResponse.text();
      console.error('STT error:', error);
      return res.status(500).json({ error: 'Failed to transcribe audio', details: error });
    }

    const sttData = await sttResponse.json();
    const userQuestion = sttData.text;
    console.log('Transcribed question:', userQuestion);

    // 2. FETCH STORY CONTEXT from database
    console.log('Step 2: Fetching story context...');
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contextData, error: dbError } = await supabase
      .from('voice_memories')
      .select('story_context')
      .eq('user_id', userId)
      .single();

    const storyContext = contextData?.story_context || 'No specific context';
    console.log('Story context:', storyContext);

    // 3. GROK API: Get emotionally intelligent response
    console.log('Step 3: Getting Grok response...');
    const grokPrompt = `You are an emotionally intelligent companion. The user has a memory: "${storyContext}"

The user just asked: "${userQuestion}"

Respond with warmth and empathy (2-3 sentences max). Reference their memory if relevant.`;

    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate companion for voice memory conversations. Be warm, concise, and emotionally aware.'
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
      console.error('Grok error:', error);
      return res.status(500).json({ error: 'Failed to get Grok response', details: error });
    }

    const grokData = await grokResponse.json();
    const responseText = grokData.choices?.[0]?.message?.content || 'I understand your feelings';
    console.log('Grok response:', responseText);

    // 4. ELEVENLABS TTS: Convert response to speech in cloned voice
    console.log('Step 4: Converting to speech...');
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: responseText,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('TTS error:', error);
      return res.status(500).json({ error: 'Failed to generate audio', details: error });
    }

    const audioBuffer2 = await ttsResponse.arrayBuffer();
    const audioBase64Output = Buffer.from(audioBuffer2).toString('base64');

    console.log('Successfully completed conversation loop');
    return res.status(200).json({
      success: true,
      userQuestion: userQuestion,
      grokResponse: responseText,
audioBase64: audioBase64Output,      message: 'Conversation completed successfully'
    });

  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({
      error: 'Failed to process conversation',
      details: error.message
    });
  }
}
