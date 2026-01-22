export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, audioBase64, voiceId, context, conversation } = req.body;

    if (!context) {
      return res.status(400).json({ error: 'Missing context' });
    }

    // Build messages array for Grok conversation
    const messages = conversation && Array.isArray(conversation) ? conversation : [];
    
    messages.push({
      role: 'user',
      content: context,
    });

    // Call Grok API
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
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
      }),
    });

    if (!grokResponse.ok) {
      const error = await grokResponse.text();
      console.error('Grok API error:', error);
      return res.status(grokResponse.status).json({
        error: `Grok API error: ${error}`,
      });
    }

    const grokData = await grokResponse.json();
    const responseText = grokData.choices[0].message.content;

    // Update conversation history
    const updatedConversation = [
      ...messages,
      {
        role: 'assistant',
        content: responseText,
      },
    ];

    return res.status(200).json({
      grokResponse: responseText,
      conversation: updatedConversation,
      success: true,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
