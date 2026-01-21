// Aavaaz Voice Memory Companion
const SUPABASE_URL = 'https://hewchjwmckkhfxsqdpvk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iQVEINN476CRDgg87kcTA_4faq-u_B';

const supabase = window.supabase_js.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentSession = null;
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;
  
  if (session) {
    currentUser = session.user;
    document.getElementById('home')?.style.display = 'none';
    document.getElementById('dashboard')?.style.display = 'block';
    loadUserDashboard();
  }
});

// Authentication
document.getElementById('start-btn')?.addEventListener('click', () => {
  document.getElementById('auth').style.display = 'block';
});

document.getElementById('login-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    showNotification('Login failed: ' + error.message, 'error');
  } else {
    window.location.href = '/dashboard.html';
  }
});

document.getElementById('signup-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  
  const { error } = await supabase.auth.signUp({ email, password });
  
  if (error) {
    showNotification('Signup failed: ' + error.message, 'error');
  } else {
    showNotification('Signup successful! Please verify your email.', 'success');
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
});

// Load user dashboard
async function loadUserDashboard() {
  if (!currentSession) return;
  
  const { data: clones, error: clonesError } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('user_id', currentSession.user.id);
  
  if (clonesError) {
    console.error('Error loading clones:', clonesError);
    return;
  }
  
  const clonesContainer = document.getElementById('voice-clones-list');
  if (clonesContainer && clones.length > 0) {
    clonesContainer.innerHTML = clones.map(clone => `
      <div class="clone-card">
        <h3>${clone.name}</h3>
        <p>${clone.description}</p>
        <button onclick="selectClone('${clone.id}')">Select</button>
      </div>
    `).join('');
  }
}

// Voice cloning
document.getElementById('upload-audio-btn')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('audio-file');
  if (!fileInput.files.length) {
    showNotification('Please select an audio file', 'error');
    return;
  }
  
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('user_id', currentSession.user.id);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/clone-voice`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      showNotification('Voice clone created successfully!', 'success');
      loadUserDashboard();
    } else {
      showNotification('Error creating voice clone', 'error');
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
});

// Payment processing
document.getElementById('payment-btn')?.addEventListener('click', async () => {
  if (!currentSession) {
    showNotification('Please login first', 'error');
    return;
  }
  
  const plan = document.getElementById('plan-select')?.value || 'basic';
  const amount = plan === 'basic' ? 499 : 999; // in paise
  
  const response = await fetch('/api/create-payment-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      user_id: currentSession.user.id,
      plan
    })
  });
  
  const { order_id } = await response.json();
  initializePayment(order_id, amount);
});

function initializePayment(orderId, amount) {
  const options = {
    key: 'YOUR_RAZORPAY_KEY_ID',
    amount,
    currency: 'INR',
    order_id: orderId,
    handler: handlePaymentSuccess,
    prefill: {
      email: currentUser?.email,
      name: currentUser?.email
    }
  };
  
  const rzp = new Razorpay(options);
  rzp.open();
}

function handlePaymentSuccess(response) {
  showNotification('Payment successful!', 'success');
  updateUserSubscription(response.razorpay_payment_id);
}

async function updateUserSubscription(paymentId) {
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_active: true, payment_id: paymentId })
    .eq('user_id', currentSession.user.id);
  
  if (!error) {
    showNotification('Subscription activated!', 'success');
  }
}

// Booking system
async function selectClone(cloneId) {
  const bookingModal = document.getElementById('booking-modal');
  if (bookingModal) {
    bookingModal.style.display = 'block';
    document.getElementById('selected-clone-id').value = cloneId;
  }
}

document.getElementById('confirm-booking-btn')?.addEventListener('click', async () => {
  const cloneId = document.getElementById('selected-clone-id').value;
  const date = document.getElementById('booking-date').value;
  const time = document.getElementById('booking-time').value;
  
  const { error } = await supabase
    .from('bookings')
    .insert([
      {
        clone_id: cloneId,
        user_id: currentSession.user.id,
        booking_date: date,
        booking_time: time
      }
    ]);
  
  if (error) {
    showNotification('Booking failed: ' + error.message, 'error');
  } else {
    showNotification('Booking confirmed!', 'success');
    document.getElementById('booking-modal').style.display = 'none';
  }
});

// Notification helper
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 4px;
    z-index: 9999;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Export functions for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadUserDashboard,
    selectClone,
    initializePayment,
    showNotification
  };
}
