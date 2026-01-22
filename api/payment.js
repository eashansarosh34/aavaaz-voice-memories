export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, userId, email, bookingId, description } = req.body;

    if (!amount || !userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Razorpay API Key
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Create basic auth header
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `receipt_${bookingId || userId}_${Date.now()}`,
      description: description || 'Aavaaz Voice Memory Call',
      notes: {
        userId: userId,
        email: email,
        bookingId: bookingId
      }
    };

    // Create order via Razorpay API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Razorpay API Error:', error);
      return res.status(response.status).json({ error: 'Failed to create payment order' });
    }

    const order = await response.json();

    // Return order details for frontend to complete payment
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: razorpayKeyId
    });
  } catch (err) {
    console.error('Payment Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Handler for payment verification (POST /api/verify-payment)
export async function verifyPayment(req, res) {
  try {
    const { orderId, paymentId, signature } = req.body;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (err) {
    console.error('Verification Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
