export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, storyText, voiceId } = req.body;
    if (!userId || !storyText) {
      return res.status(400).json({ error: 'User ID and story text are required' });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save the story context to database
    const { data, error } = await supabase
      .from('voice_memories')
      .upsert([
        {
          user_id: userId,
          story_context: storyText,
          voice_id: voiceId || null,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save context', details: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Story context saved successfully',
      data: data
    });

  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
}
