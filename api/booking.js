export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, name, eventTypeId, startTime, duration } = req.body;

    if (!email || !eventTypeId || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Cal.com API endpoint
    const calComUrl = 'https://api.cal.com/v1/bookings';
    const calComApiKey = process.env.CALCOM_API_KEY;

    const bookingData = {
      eventTypeId: parseInt(eventTypeId),
      email: email,
      name: name || 'Guest',
      guests: [email],
      start: startTime,
      timeZone: 'Asia/Kolkata',
      language: 'en',
      metadata: {
        userId: userId,
        appName: 'AavaazVoiceMemories'
      }
    };

    // Create booking via Cal.com API
    const response = await fetch(calComUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${calComApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cal.com API Error:', error);
      return res.status(response.status).json({ error: 'Failed to create booking' });
    }

    const booking = await response.json();

    return res.status(201).json({
      success: true,
      bookingId: booking.bookings[0]?.id,
      message: 'Booking created successfully'
    });
  } catch (err) {
    console.error('Booking Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
