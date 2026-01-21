# Aavaaz - Voice Memory Companion

Preserve the comfort of a loved one's voice. AI voice cloning for seniors and care homes.

## Features
- Voice cloning using ElevenLabs
- User authentication with Supabase
- Booking system with Cal.com
- Payment processing with Razorpay
- Grok AI integration for smart responses

## Project Structure
```
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── privacy.html
│   ├── styles.css
│   └── app.js
├── supabase/
│   └── functions/
│       ├── clone-voice/index.ts
│       ├── generate-speech/index.ts
│       └── handle-payment/index.ts
└── README.md
```

## Setup Instructions

### 1. Create Supabase Project
- Go to https://supabase.com and create a new project
- Run the SQL setup commands in the SQL editor
- Set your environment variables

### 2. Deploy to Vercel
- Connect this repository to Vercel
- Set environment variables in Vercel dashboard
- Deploy automatically on push

### 3. Configure Services
- ElevenLabs API key
- Cal.com integration
- Razorpay payment links
- Grok API key

## Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
ELEVENLABS_API_KEY=your_elevenlabs_key
GROK_API_KEY=your_grok_key
RAZORPAY_KEY_ID=your_razorpay_id
```

## Technologies Used
- Frontend: HTML, CSS, JavaScript
- Backend: Supabase Edge Functions
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth
- AI: ElevenLabs, Grok (xAI)
- Payments: Razorpay
- Booking: Cal.com
- Deployment: Vercel

## License
MIT
