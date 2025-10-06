import { createClient } from '@supabase/supabase-js'

// Supabase setup
const SUPABASE_URL = 'https://mlnqzxfcgchxocwwjvjz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbnF6eGZjZ2NoeG9jd3dqdmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDYxNTMsImV4cCI6MjA3Mzc4MjE1M30.MRzFmpfz0pCKAbiBvC0QSQAYcp0rtq_UKhP68XQCTjc'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Global variable to track if we've shown welcome this session
let welcomeShownThisSession = false;

// Helper to safely update visitor count element
function setVisitorCount(count) {
  const el = document.getElementById('visitorCount')
  if (el) {
    el.textContent = count
  }
}

// Simple toast function that doesn't depend on Bootstrap
function showSimpleToast(message, type = 'info') {
  // Remove any existing simple toasts
  const existingToasts = document.querySelectorAll('.simple-toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `simple-toast position-fixed top-0 end-0 p-3`;
  toast.style.zIndex = '9999';
  
  const toastInner = document.createElement('div');
  toastInner.className = `alert alert-${type} alert-dismissible fade show`;
  toastInner.innerHTML = `
    <strong>PakGeoHub:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  toast.appendChild(toastInner);
  document.body.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 5000);
}

// Enhanced toast function that tries Bootstrap first, then falls back to simple toast
function showWelcomeMessage(userName, isNewUser = false) {
  const message = isNewUser 
    ? `Welcome to PakGeoHub, ${userName}! We're glad to have you here.`
    : `Welcome back, ${userName}! Great to see you again.`;
  
  // Try Bootstrap toast first
  const toastElement = document.getElementById('welcomeToast');
  const toastMessage = document.getElementById('toastMessage');
  
  if (toastElement && toastMessage && window.bootstrap && window.bootstrap.Toast) {
    try {
      toastMessage.textContent = message;
      const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
      });
      toast.show();
      console.log('Bootstrap toast shown successfully');
      return;
    } catch (error) {
      console.error('Bootstrap toast failed, falling back to simple toast:', error);
    }
  }
  
  // Fallback to simple toast
  console.log('Using simple toast fallback');
  showSimpleToast(message, 'success');
}

// Check if user exists and handle registration/returning user
async function handleUserSession() {
  const userEmail = localStorage.getItem('userEmail');
  
  if (userEmail) {
    try {
      const { data: user, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          localStorage.removeItem('userEmail');
          showRegistrationModal();
        }
        return;
      }

      if (user) {
        const newVisitCount = (user.visit_count || 0) + 1;
        
        const { error: updateError } = await supabase
          .from('visitors')
          .update({ 
            visit_count: newVisitCount,
            last_visit: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating visit count:', updateError);
        } else {
          await fetchVisitorCount();
        }

        // Show welcome back message for returning users
        if (!welcomeShownThisSession) {
          console.log('Showing welcome back for returning user:', user.name);
          showWelcomeMessage(user.name, false);
          welcomeShownThisSession = true;
        }
      }
    } catch (error) {
      console.error('Error in handleUserSession:', error);
    }
  } else {
    showRegistrationModal();
  }
}

// Show registration modal
function showRegistrationModal() {
  const modalElement = document.getElementById('userModal');
  if (!modalElement) {
    console.error('Modal element not found');
    return;
  }

  try {
    const modal = new bootstrap.Modal(modalElement, {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();

    // Remove any existing event listeners and add new one
    const submitBtn = document.getElementById('submitUser');
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    document.getElementById('submitUser').addEventListener('click', handleUserRegistration);
  } catch (error) {
    console.error('Error showing modal:', error);
  }
}

// Handle new user registration
async function handleUserRegistration() {
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const country = document.getElementById('countrySelect').value;

  if (!name || !email || !country) {
    alert('Please fill in all fields!');
    return;
  }

  try {
    let isNewUser = false;
    let userName = name;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('visitors')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
    }

    if (existingUser) {
      // Update existing user
      const newVisitCount = (existingUser.visit_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('visitors')
        .update({ 
          visit_count: newVisitCount,
          last_visit: new Date().toISOString(),
          name: name,
          country: country
        })
        .eq('id', existingUser.id);

      if (updateError) {
        alert('There was an error updating your information. Please try again.');
        return;
      }

      userName = existingUser.name;
      console.log('Updated existing user:', userName);
    } else {
      // Insert new user
      const { error: insertError } = await supabase
        .from('visitors')
        .insert([{ 
          name, 
          email, 
          country,
          visit_count: 1,
          last_visit: new Date().toISOString()
        }]);

      if (insertError) {
        alert('There was an error registering. Please try again.');
        return;
      }

      isNewUser = true;
      console.log('Created new user:', userName);
    }

    localStorage.setItem('userEmail', email);
    await fetchVisitorCount();
    
    // Hide modal
    const modalElement = document.getElementById('userModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    // Show welcome message after registration
    console.log('Showing welcome message for:', userName, 'isNew:', isNewUser);
    showWelcomeMessage(userName, isNewUser);
    welcomeShownThisSession = true;

  } catch (error) {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred. Please try again.');
  }
}

// Fetch total visitor count
async function fetchVisitorCount() {
  try {
    const { count, error } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      setVisitorCount(count);
    }
  } catch (error) {
    console.error('Error fetching visitor count:', error);
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded - initializing...');
  
  // Wait for Bootstrap to be fully loaded
  const checkBootstrap = setInterval(() => {
    if (window.bootstrap) {
      clearInterval(checkBootstrap);
      console.log('Bootstrap loaded, starting session...');
      fetchVisitorCount();
      handleUserSession();
    }
  }, 100);
  
  // Fallback if Bootstrap doesn't load
  setTimeout(() => {
    if (!window.bootstrap) {
      console.log('Bootstrap not detected, using fallback methods');
      fetchVisitorCount();
      handleUserSession();
    }
  }, 2000);
});

// Page animations (keep your existing code)
document.addEventListener('DOMContentLoaded', function() {
  const fadeElements = document.querySelectorAll('.fade-in');
  const slideLeftElements = document.querySelectorAll('.slide-in-left');
  const slideRightElements = document.querySelectorAll('.slide-in-right');
  const scaleElements = document.querySelectorAll('.scale-in');
  const staggeredElements = document.querySelectorAll('.staggered-item');
  
  const progressBar = document.getElementById('progressBar');
  
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
      rect.bottom >= 0
    );
  }
  
  function checkScroll() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = (window.scrollY / documentHeight) * 100;
    if (progressBar) progressBar.style.width = scrolled + '%';
    
    fadeElements.forEach(element => {
      if (isInViewport(element)) element.classList.add('visible');
    });
    
    slideLeftElements.forEach(element => {
      if (isInViewport(element)) element.classList.add('visible');
    });
    
    slideRightElements.forEach(element => {
      if (isInViewport(element)) element.classList.add('visible');
    });
    
    scaleElements.forEach(element => {
      if (isInViewport(element)) element.classList.add('visible');
    });
    
    staggeredElements.forEach((element, index) => {
      if (isInViewport(element)) {
        setTimeout(() => element.classList.add('visible'), index * 150);
      }
    });
  }
  
  checkScroll();
  window.addEventListener('scroll', checkScroll);
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
});