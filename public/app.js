// Aavaaz App
const SUPABASE_URL='YOUR_SUPABASE_URL';
const SUPABASE_KEY='YOUR_SUPABASE_ANON_KEY';
const supabase=window.supabase_js.createClient(SUPABASE_URL,SUPABASE_KEY);
let currentSession=null;
document.addEventListener('DOMContentLoaded',async()=>{const {data:{session}}=await supabase.auth.getSession();currentSession=session;if(session){document.getElementById('home').style.display='none';document.getElementById('dashboard').style.display='block';}});
document.getElementById('start-btn')?.addEventListener('click',()=>{document.getElementById('auth').style.display='block';});
document.getElementById('login-btn')?.addEventListener('click',async()=>{const email=document.getElementById('email').value;const password=document.getElementById('password').value;const {error}=await supabase.auth.signInWithPassword({email,password});if(!error)window.location.href='/dashboard.html';});
document.getElementById('signup-btn')?.addEventListener('click',async()=>{const email=document.getElementById('email').value;const password=document.getElementById('password').value;await supabase.auth.signUp({email,password});});
document.getElementById('logout-btn')?.addEventListener('click',async()=>{await supabase.auth.signOut();window.location.href='/index.html';});
