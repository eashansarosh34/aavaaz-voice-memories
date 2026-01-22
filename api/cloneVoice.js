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
    const messages = conversationHistory && Array.isArray(conversationHistory) 
      ? conversationHistory
      : [];

    messages.push({
      role: 'user',
      content: context,
    });

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', error);
      return res.status(response.status).json({
        error: `Grok API error: ${error}`,
      });
    }

    const data = await response.json();
    const grokResponse = data.choices[0].message.content;

    // Update conversation history
    const newHistory = [
      ...messages,
      {
        role: 'assistant',
        content: grokResponse,
      },
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
