let map;
let mapData;
let highlightedPolygon;
let markerClusterGroup;

// Load and initialize dashboard
async function initDashboard() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        mapData = data;
        
        // Apply brand colors
        applyBrandColors(data.brand);
        
        // Initialize components
        renderExpenseChart(data.expenses);
        renderActivityChart(data.weeklyActivity);
        renderListings(data.listings);
        initializeMap(data.mapConfig, data.listings);
        
        // Update brand name
        document.getElementById('brandName').textContent = data.brand.name;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Apply brand colors to CSS variables
function applyBrandColors(brand) {
    document.documentElement.style.setProperty('--primary', brand.primary);
    document.documentElement.style.setProperty('--secondary', brand.secondary);
}

// Render pie chart for expenses
function renderExpenseChart(expenses) {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const legend = document.getElementById('expenseLegend');
    
    const total = expenses.reduce((sum, item) => sum + item.value, 0);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;
    
    let currentAngle = -Math.PI / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pie segments
    expenses.forEach(expense => {
        const sliceAngle = (expense.value / total) * 2 * Math.PI;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = expense.color;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Draw inner circle (donut hole)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw center text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('30%', centerX, centerY - 5);
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Entertainment', centerX, centerY + 15);
    
    // Render legend
    legend.innerHTML = '';
    expenses.forEach(expense => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${expense.color}"></span>
            <span>${expense.label}</span>
        `;
        legend.appendChild(legendItem);
    });
}

// Render bar chart for weekly activity
function renderActivityChart(data) {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / data.labels.length / 2.5;
    const maxValue = Math.max(...data.deposit, ...data.withdraw);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bars
    data.labels.forEach((label, index) => {
        const x = padding + (index * (chartWidth / data.labels.length));
        const depositHeight = (data.deposit[index] / maxValue) * chartHeight;
        const withdrawHeight = (data.withdraw[index] / maxValue) * chartHeight;
        
        // Deposit bar
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary');
        ctx.fillRect(x, canvas.height - padding - depositHeight, barWidth, depositHeight);
        
        // Withdraw bar
        ctx.fillStyle = '#5b8def';
        ctx.fillRect(x + barWidth + 4, canvas.height - padding - withdrawHeight, barWidth, withdrawHeight);
        
        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth, canvas.height - padding + 20);
    });
}

// Render property listings
function renderListings(listings) {
    const container = document.getElementById('listingsContainer');
    container.innerHTML = '';
    
    listings.forEach(listing => {
        const listingElement = document.createElement('div');
        listingElement.className = 'listing-item';
        listingElement.innerHTML = `
            <img src="${listing.image}" alt="${listing.title}" class="listing-image">
            <div class="listing-content">
                <div class="listing-title">${listing.title}</div>
                <div class="listing-meta">
                    <span>⭐ ${listing.rating}</span>
                    <span>${listing.host}</span>
                    <span>${listing.guests} guests</span>
                    <span>${listing.bedrooms} bedroom</span>
                    <span>${listing.bathrooms} bathroom</span>
                </div>
                <div class="listing-type">${listing.type}</div>
                <div class="listing-price">$${listing.price}/night</div>
            </div>
        `;
        
        // Add click handler to highlight on map
        listingElement.addEventListener('click', () => {
            if (map) {
                map.setView(listing.coordinates, 15);
            }
        });
        
        container.appendChild(listingElement);
    });
}

// Initialize Leaflet map
function initializeMap(config, listings) {
    // Initialize map
    map = L.map('map').setView(config.center, config.zoom);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Initialize marker cluster group
    markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50
    });
    
    // Add property markers
    listings.forEach(listing => {
        const marker = L.marker(listing.coordinates);
        const popupContent = `
            <div class="custom-popup">
                <div class="popup-content">
                    <div class="popup-title">${listing.title}</div>
                    <div class="popup-price">$${listing.price}/night</div>
                    <div class="popup-meta">
                        ⭐ ${listing.rating} • ${listing.guests} guests • ${listing.bedrooms} bed • ${listing.bathrooms} bath
                    </div>
                    <div class="popup-meta">${listing.type}</div>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
        markerClusterGroup.addLayer(marker);
    });
    
    map.addLayer(markerClusterGroup);
    
    // Add highlighted area polygon
    if (config.highlightedArea) {
        highlightedPolygon = L.polygon(config.highlightedArea.coordinates, {
            color: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
            weight: 2,
            opacity: 0.8,
            fillColor: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
            fillOpacity: 0.1
        }).addTo(map);
        
        // Show info card for highlighted area
        showMapInfoCard(config.highlightedArea);
        
        // Add click handler for polygon
        highlightedPolygon.on('click', () => {
            showMapInfoCard(config.highlightedArea);
        });
    }
    
    // Add price markers
    if (config.priceMarkers) {
        config.priceMarkers.forEach(priceMarker => {
            const priceIcon = L.divIcon({
                className: 'price-marker',
                html: priceMarker.price,
                iconSize: [60, 25],
                iconAnchor: [30, 25]
            });
            
            L.marker(priceMarker.coordinates, { icon: priceIcon }).addTo(map);
        });
    }
    
    // Add map event handlers
    map.on('click', () => {
        hideMapInfoCard();
    });
}

// Show map info card
function showMapInfoCard(areaData) {
    const infoCard = document.getElementById('mapInfoCard');
    const image = document.getElementById('mapInfoImage');
    const price = document.getElementById('mapInfoPrice');
    const details = document.getElementById('mapInfoDetails');
    const address = document.getElementById('mapInfoAddress');
    
    image.src = areaData.image;
    price.textContent = areaData.price;
    details.textContent = `${areaData.beds} beds • ${areaData.baths} baths • ${areaData.sqft} sqft`;
    address.textContent = areaData.address;
    
    infoCard.style.display = 'flex';
}

// Hide map info card
function hideMapInfoCard() {
    const infoCard = document.getElementById('mapInfoCard');
    infoCard.style.display = 'none';
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);
