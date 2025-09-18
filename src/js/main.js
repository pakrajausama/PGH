
document.addEventListener('DOMContentLoaded', function() {
  // Load stored data (or empty object)
  let countryStats = JSON.parse(localStorage.getItem('countryStats')) || {};

  // Chart setup
  const ctx = document.getElementById('countryChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(58, 123, 213, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 210, 255, 0.3)');

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(countryStats),
      datasets: [{
        label: 'Visitors by Country',
        data: Object.values(countryStats),
        backgroundColor: gradient,
        borderColor: 'rgba(58, 123, 213, 1)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(255, 99, 132, 0.8)',
        hoverBorderColor: 'rgba(255, 99, 132, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { weight: 'bold' } } },
        x: { ticks: { font: { weight: 'bold' } } }
      }
    }
  });

  // Show modal if not already selected
  if (!localStorage.getItem('countrySelected')) {
    const modal = new bootstrap.Modal(document.getElementById('countryModal'), {
      backdrop: 'static',
      keyboard: false
    });
    modal.show();

    document.getElementById('submitCountry').addEventListener('click', function() {
      const country = document.getElementById('countrySelect').value;
      if (country) {
        // Save selection
        localStorage.setItem('countrySelected', country);

        // Update stats
        countryStats[country] = (countryStats[country] || 0) + 1;
        localStorage.setItem('countryStats', JSON.stringify(countryStats));

        // Update chart
        chart.data.labels = Object.keys(countryStats);
        chart.data.datasets[0].data = Object.values(countryStats);
        chart.update();

        modal.hide();
      }
    });
  }
});

