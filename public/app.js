// Aavaaz Voice Memory Companion - Fixed Version
const SUPABASE_URL = 'https://hewchjwmckkhfxsqdpvk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iQVEINN476CRDgg87kcTA_4faq-u_B';

let currentSession = null;
let currentUser = null;
let supabase = null;

// Initialize Supabase when DOM is ready
if (window.supabase_js) {
  supabase = window.supabase_js.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!supabase) {
      console.error('Supabase not initialized');
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    currentSession = session;
    
    if (session) {
      currentUser = session.user;
      const homeEl = document.getElementById('home');
      const dashboardEl = document.getElementById('dashboard');
      const dashLinkEl = document.getElementById('dash-link');
      const logoutBtnEl = document.getElementById('logout-btn');
      
      if (homeEl) homeEl.style.display = 'none';
      if (dashboardEl) dashboardEl.style.display = 'block';
      if (dashLinkEl) dashLinkEl.style.display = 'block';
      if (logoutBtnEl) logoutBtnEl.style.display = 'block';
      
      loadUserDashboard();
    }
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

function setupEventListeners() {
  // Start Free Pilot button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const authSection = document.getElementById('auth');
      if (authSection) {
        authSection.style.display = 'block';
        authSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Close auth button
  const closeAuthBtn = document.getElementById('close-auth-btn');
  if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const authSection = document.getElementById('auth');
      if (authSection) {
        authSection.style.display = 'none';
      }
    });
  }
  
  // Login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
  
  // Signup button
  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', handleSignup);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  if (!supabase) return;
  
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  
  if (!email || !password) {
    showNotification('Please enter email and password', 'error');
    return;
  }
  
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      showNotification('Login failed: ' + error.message, 'error');
    } else {
      showNotification('Login successful!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  if (!supabase) return;
  
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  
  if (!email || !password) {
    showNotification('Please enter email and password', 'error');
    return;
  }
  
  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      showNotification('Signup failed: ' + error.message, 'error');
    } else {
      showNotification('Signup successful! Please verify your email.', 'success');
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

async function handleLogout(e) {
  e.preventDefault();
  if (!supabase) return;
  
  try {
    await supabase.auth.signOut();
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 500);
  } catch (error) {
    showNotification('Error logging out: ' + error.message, 'error');
  }
}

// Load user dashboard
async function loadUserDashboard() {
  if (!currentSession || !supabase) return;
  
  try {
    const { data: clones, error: clonesError } = await supabase
      .from('voice_clones')
      .select('*')
      .eq('user_id', currentSession.user.id);
    
    if (clonesError) {
      console.error('Error loading clones:', clonesError);
      return;
    }
    
    const clonesContainer = document.getElementById('voice-clones-list');
    if (clonesContainer && clones && clones.length > 0) {
      clonesContainer.innerHTML = clones.map(clone => `
        <div class="clone-card">
          <h3>${clone.name}</h3>
          <p>${clone.description || 'Voice clone'}</p>
          <button onclick="selectClone('${clone.id}')" class="btn btn-primary">Select</button>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error in loadUserDashboard:', error);
  }
}

// Select clone for booking
async function selectClone(cloneId) {
  if (!currentSession) {
    showNotification('Please login first', 'error');
    return;
  }
  
  const bookingModal = document.getElementById('booking-modal');
  if (bookingModal) {
    bookingModal.style.display = 'block';
    const selectedCloneEl = document.getElementById('selected-clone-id');
    if (selectedCloneEl) {
      selectedCloneEl.value = cloneId;
    }
  }
}

// Confirm booking - CASH ON DELIVERY
async function confirmBooking(e) {
  if (e) e.preventDefault();
  if (!currentSession || !supabase) return;
  
  try {
    const cloneId = document.getElementById('selected-clone-id')?.value;
    const date = document.getElementById('booking-date')?.value;
    const time = document.getElementById('booking-time')?.value;
    const paymentMethod = document.getElementById('payment-method')?.value || 'cash';
    
    if (!cloneId || !date || !time) {
      showNotification('Please fill all booking details', 'error');
      return;
    }
    
    const { error } = await supabase
      .from('bookings')
      .insert([
        {
          clone_id: cloneId,
          user_id: currentSession.user.id,
          booking_date: date,
          booking_time: time,
          payment_method: paymentMethod,
          status: 'pending'
        }
      ]);
    
    if (error) {
      showNotification('Booking failed: ' + error.message, 'error');
    } else {
      showNotification('Booking confirmed! We will contact you soon for payment details.', 'success');
      const bookingModal = document.getElementById('booking-modal');
      if (bookingModal) {
        bookingModal.style.display = 'none';
      }
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

// Notification helper
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background-color: ${bgColor};
    color: white;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-weight: bold;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
