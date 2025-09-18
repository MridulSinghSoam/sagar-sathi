// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Navigation functionality
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                
                // Remove active class from all links and sections
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Show corresponding section
                const targetSection = this.getAttribute('data-section');
                document.getElementById(targetSection).classList.add('active');
            }
        });
    });

    // Animate numbers on page load
    animateNumbers();
    
    // Update stats periodically
    setInterval(updateStats, 30000); // Update every 30 seconds
});

function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');
    
    numbers.forEach(number => {
        const target = parseInt(number.textContent.replace(/,/g, ''));
        const increment = target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            number.textContent = Math.floor(current).toLocaleString();
        }, 30);
    });
}

function updateStats() {
    // Simulate real-time data updates
    const stats = [
        { selector: '.stat-number', values: [1247, 3892, 856, 2341] }
    ];
    
    // Add small random variations to simulate live data
    document.querySelectorAll('.stat-number').forEach((element, index) => {
        const baseValues = [1247, 3892, 856, 2341];
        const variation = Math.floor(Math.random() * 10) - 5;
        const newValue = baseValues[index] + variation;
        element.textContent = newValue.toLocaleString();
    });
}

function showZoneInfo() {
    alert('Zone information panel would display detailed fishing regulations, seasonal restrictions, and permit requirements.');
}

function downloadData() {
    // Simulate data download
    const loadingBtn = event.target;
    const originalText = loadingBtn.innerHTML;
    
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    loadingBtn.disabled = true;
    
    setTimeout(() => {
        loadingBtn.innerHTML = originalText;
        loadingBtn.disabled = false;
        alert('Marine ecosystem data package downloaded successfully!');
    }, 2000);
}

function redirectTo3D(species) {
    // This would redirect to the 3D model page
    alert(`Redirecting to 3D model viewer for ${species}...`);
    // In a real implementation:
    // window.location.href = `3d-model.html?species=${species}`;
}

// Real-time updates simulation
function addRecentUpdate(title, description) {
    const updatesList = document.querySelector('.update-list');
    const newUpdate = document.createElement('div');
    newUpdate.className = 'update-item';
    newUpdate.innerHTML = `
        <div class="update-date">Just now</div>
        <div class="update-content">
            <h4>${title}</h4>
            <p>${description}</p>
        </div>
    `;
    
    updatesList.insertBefore(newUpdate, updatesList.firstChild);
    
    // Remove oldest update if more than 5
    const updates = updatesList.querySelectorAll('.update-item');
    if (updates.length > 5) {
        updates[updates.length - 1].remove();
    }
}

// Simulate periodic updates
setInterval(() => {
    const updates = [
        {title: 'Whale Migration Detected', description: 'Humpback whales spotted in Pacific Migration Corridor'},
        {title: 'Water Temperature Alert', description: 'Unusual temperature spike recorded in Arctic Zone 12B'},
        {title: 'Fishing Quota Updated', description: 'Commercial fishing limits adjusted for Atlantic Cod'},
        {title: 'Research Vessel Data', description: 'New biodiversity survey completed in Indian Ocean'}
    ];
    
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    addRecentUpdate(randomUpdate.title, randomUpdate.description);
}, 60000); // Add update every minute
