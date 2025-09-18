import { createClient } from '@supabase/supabase-js'

// Supabase setup
const SUPABASE_URL = 'https://mlnqzxfcgchxocwwjvjz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbnF6eGZjZ2NoeG9jd3dqdmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDYxNTMsImV4cCI6MjA3Mzc4MjE1M30.MRzFmpfz0pCKAbiBvC0QSQAYcp0rtq_UKhP68XQCTjc'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper to safely update visitor count element
function setVisitorCount(count) {
  const el = document.getElementById('visitorCount')
  if (el) {
    el.textContent = count
  } else {
    console.warn('visitorCount element not found in DOM')
  }
}

// Insert visitor + update count
async function updateVisitorCount(country) {
  const { error: insertError } = await supabase.from('visitors').insert([{ country }])
  if (insertError) {
    console.error('Insert failed:', insertError)
    return
  }

  const { count, error } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Count failed:', error)
    return
  }

  setVisitorCount(count)
}

// Fetch only visitor count
async function fetchVisitorCount() {
  const { count, error } = await supabase
    .from('visitors')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Count failed:', error)
    return
  }

  setVisitorCount(count)
}

document.addEventListener('DOMContentLoaded', function () {
  fetchVisitorCount()

  if (!localStorage.getItem('countrySelected')) {
    const modal = new bootstrap.Modal(document.getElementById('countryModal'), {
      backdrop: 'static',
      keyboard: false,
    })
    modal.show()

    document.getElementById('submitCountry').addEventListener('click', async function () {
      const country = document.getElementById('countrySelect').value
      if (!country) return alert('Please select a country!')
      localStorage.setItem('countrySelected', country)
      await updateVisitorCount(country)
      modal.hide()
    })
  }
})


// page animations


 document.addEventListener('DOMContentLoaded', function() {
      // Elements to animate
      const fadeElements = document.querySelectorAll('.fade-in');
      const slideLeftElements = document.querySelectorAll('.slide-in-left');
      const slideRightElements = document.querySelectorAll('.slide-in-right');
      const scaleElements = document.querySelectorAll('.scale-in');
      const staggeredElements = document.querySelectorAll('.staggered-item');
      
      // Progress bar
      const progressBar = document.getElementById('progressBar');
      
      // Check if element is in viewport
      function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
          rect.bottom >= 0
        );
      }
      
      // Add visible class to elements in viewport
      function checkScroll() {
        // Progress bar calculation
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = (window.scrollY / documentHeight) * 100;
        progressBar.style.width = scrolled + '%';
        
        // Animation triggers
        fadeElements.forEach(element => {
          if (isInViewport(element)) {
            element.classList.add('visible');
          }
        });
        
        slideLeftElements.forEach(element => {
          if (isInViewport(element)) {
            element.classList.add('visible');
          }
        });
        
        slideRightElements.forEach(element => {
          if (isInViewport(element)) {
            element.classList.add('visible');
          }
        });
        
        scaleElements.forEach(element => {
          if (isInViewport(element)) {
            element.classList.add('visible');
          }
        });
        
        // Staggered animation with delay
        staggeredElements.forEach((element, index) => {
          if (isInViewport(element)) {
            setTimeout(() => {
              element.classList.add('visible');
            }, index * 150); // 150ms delay between each item
          }
        });
      }
      
      // Initial check on page load
      checkScroll();
      
      // Check on scroll
      window.addEventListener('scroll', checkScroll);
      
      // Add smooth scroll to all links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href');
          if (targetId === '#') return;
          
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 80, // Adjust for fixed header
              behavior: 'smooth'
            });
          }
        });
      });
    });