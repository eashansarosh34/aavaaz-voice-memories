// Cal.com Booking Integration for Aavaaz Voice Memories
// This file handles the integration with Cal.com for scheduling voice cloning sessions

const CAL_CONFIG = {
  // Replace with your Cal.com username or calendar link
  calUsername: 'YOUR_CAL_COM_USERNAME',
  // Cal.com public booking page URL
  calUrl: 'https://cal.com/YOUR_CAL_COM_USERNAME/voice-cloning-session',
  // Event type name in Cal.com
  eventType: 'voice-cloning-session',
  // Duration in minutes
  duration: 30,
  // Buffer time before next booking (minutes)
  bufferTime: 15,
};

// Initialize Cal.com embed
function initializeCalBooking() {
  // Load Cal.com embed script
  const script = document.createElement('script');
  script.src = 'https://cal.com/api/embed/v1.js';
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    if (window.Cal) {
      window.Cal.ns = {};
      window.Cal("init", { origin: "https://cal.com" });
      window.Cal("ui", {
        styles: {
          branding: {
            brandColor: "#000000",
          },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    }
  };
}

// Open Cal.com booking modal
function openCalBooking() {
  if (window.Cal) {
    window.Cal("openModal", {
      calLink: CAL_CONFIG.calUrl,
      config: {
        layout: "month_view",
      },
    });
  } else {
    console.error('Cal.com not loaded');
    window.open(CAL_CONFIG.calUrl, '_blank');
  }
}

// Pre-fill booking with user details
function openCalBookingWithDetails(userEmail, userName) {
  const params = new URLSearchParams();
  params.append('email', userEmail);
  params.append('name', userName);
  
  const bookingUrl = `${CAL_CONFIG.calUrl}?${params.toString()}`;
  
  if (window.Cal) {
    window.Cal("openModal", {
      calLink: bookingUrl,
      config: {
        layout: "month_view",
      },
    });
  } else {
    window.open(bookingUrl, '_blank');
  }
}

// Handle booking confirmation
function handleBookingConfirmation(eventData) {
  console.log('Booking confirmed:', eventData);
  // Send booking data to backend
  fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      eventId: eventData.eventId,
      startTime: eventData.startTime,
      email: eventData.email,
      name: eventData.name,
    }),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Booking saved:', data);
    // Show success message
    showNotification('Booking confirmed!', 'success');
  })
  .catch(error => {
    console.error('Error saving booking:', error);
    showNotification('Error saving booking', 'error');
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CAL_CONFIG,
    initializeCalBooking,
    openCalBooking,
    openCalBookingWithDetails,
    handleBookingConfirmation,
  };
}
