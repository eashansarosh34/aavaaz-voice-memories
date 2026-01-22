import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioBase64, context, conversationHistory, userId } = req.body;

    if (!audioBase64 || !context) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call Grok API with voice context
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: `Context: ${context}\n\nAudio content received. Please respond conversationally based on the context provided.`,
      },
    ];

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are a friendly voice conversation assistant. Keep responses concise and natural for voice interaction. The user wants to have a conversation about: ${context}`,
      messages: messages,
    });

    const grokResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    // Store conversation history
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: context },
      { role: 'assistant', content: grokResponse },
    ];

    return res.status(200).json({
      grokResponse,
      conversationHistory: newHistory,
      success: true,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
