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