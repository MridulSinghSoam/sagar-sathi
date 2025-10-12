// Fish database (in production, this would come from an API)
const fishDatabase = {
    "Atlantic Cod": {
        scientific_name: "Gadus morhua",
        locations: [
            {lat: 55.0, lng: -10.0, region: "North Atlantic", status: "caution"},
            {lat: 60.0, lng: -15.0, region: "Norwegian Sea", status: "caution"},
            {lat: 50.0, lng: -5.0, region: "Celtic Sea", status: "danger"}
        ],
        current_status: "declining",
        population_trend: -2.5,
        extinction_risk: "moderate",
        conservation_status: "Vulnerable",
        habitat_depth: "50-200m"
    },
    "Bluefin Tuna": {
        scientific_name: "Thunnus thynnus",
        locations: [
            {lat: 35.0, lng: -75.0, region: "Western Atlantic", status: "safe"},
            {lat: 40.0, lng: -70.0, region: "Gulf of Maine", status: "caution"},
            {lat: 30.0, lng: -80.0, region: "Caribbean", status: "safe"}
        ],
        current_status: "recovering",
        population_trend: 1.2,
        extinction_risk: "low",
        conservation_status: "Near Threatened",
        habitat_depth: "0-500m"
    },
    "Devils Hole Pupfish": {
        scientific_name: "Cyprinodon diabolis",
        locations: [
            {lat: 36.25, lng: -115.6, region: "Devils Hole, Nevada", status: "danger"}
        ],
        current_status: "critically_endangered",
        population_trend: -5.8,
        extinction_risk: "extreme",
        conservation_status: "Critically Endangered",
        habitat_depth: "1-15m"
    },
    "Salmon": {
        scientific_name: "Salmo salar",
        locations: [
            {lat: 45.0, lng: -67.0, region: "Bay of Fundy", status: "caution"},
            {lat: 58.0, lng: -6.0, region: "Scottish Highlands", status: "safe"},
            {lat: 60.0, lng: 5.0, region: "Norwegian Fjords", status: "safe"}
        ],
        current_status: "stable",
        population_trend: 0.3,
        extinction_risk: "low",
        conservation_status: "Least Concern",
        habitat_depth: "0-100m"
    }
};

// Global variables
let map;
let currentMarkers = [];
let fishNameInput;
let yearsInput;
let suggestionsDiv;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();
    setupAutoComplete();
});

// Initialize the Leaflet map
function initializeMap() {
    map = L.map('map').setView([40, -30], 3);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 10
    }).addTo(map);
}

// Set up event listeners
function initializeEventListeners() {
    fishNameInput = document.getElementById('fishName');
    yearsInput = document.getElementById('years');
    suggestionsDiv = document.getElementById('suggestions');
    
    // Enter key submission
    fishNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            predictFish();
        }
    });
    
    yearsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            predictFish();
        }
    });
}

// Setup autocomplete functionality
function setupAutoComplete() {
    fishNameInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        suggestionsDiv.innerHTML = '';
        
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        const matches = Object.keys(fishDatabase).filter(fish => 
            fish.toLowerCase().includes(query)
        );
        
        if (matches.length > 0) {
            matches.forEach(fish => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = fish;
                div.onclick = () => selectFish(fish);
                suggestionsDiv.appendChild(div);
            });
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Hide suggestions when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.form-group')) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// Select fish from autocomplete
function selectFish(fishName) {
    fishNameInput.value = fishName;
    suggestionsDiv.style.display = 'none';
}

// Main prediction function
async function predictFish() {
    const fishName = fishNameInput.value.trim();
    const years = parseInt(yearsInput.value);
    
    // Validation
    if (!fishName) {
        alert('Please enter a fish species name');
        return;
    }
    
    if (!years || years < 1 || years > 100) {
        alert('Please enter a valid number of years (1-100)');
        return;
    }
    
    // Show loading state
    showLoading(true);
    hideResults();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get fish data
    const fishData = fishDatabase[fishName];
    
    if (!fishData) {
        showLoading(false);
        alert(`Fish "${fishName}" not found in database. Available fish: ${Object.keys(fishDatabase).join(', ')}`);
        return;
    }
    
    // Generate predictions
    const predictions = generatePredictions(fishData, years);
    
    // Display results
    displayResults(fishName, fishData, predictions, years);
    updateMap(fishData);
    
    showLoading(false);
    showResults();
}

// Generate predictions based on current data and years
function generatePredictions(fishData, years) {
    const currentTrend = fishData.population_trend;
    const extinctionRisk = fishData.extinction_risk;
    
    // Calculate future population change
    let futureChange = currentTrend * years;
    let futureStatus = 'stable';
    
    if (futureChange < -10) {
        futureStatus = 'severely declining';
    } else if (futureChange < -5) {
        futureStatus = 'declining';
    } else if (futureChange < -2) {
        futureStatus = 'slightly declining';
    } else if (futureChange < 2) {
        futureStatus = 'stable';
    } else if (futureChange < 5) {
        futureStatus = 'slightly increasing';
    } else {
        futureStatus = 'increasing';
    }
    
    // Calculate extinction probability
    let extinctionProbability = 0;
    if (extinctionRisk === 'extreme') extinctionProbability = Math.min(90, 30 + years * 2);
    else if (extinctionRisk === 'high') extinctionProbability = Math.min(70, 15 + years * 1.5);
    else if (extinctionRisk === 'moderate') extinctionProbability = Math.min(40, 5 + years * 1);
    else extinctionProbability = Math.min(20, years * 0.5);
    
    return {
        futureStatus,
        futureChange,
        extinctionProbability,
        recommendation: generateRecommendation(extinctionRisk, futureChange)
    };
}

// Generate fishing recommendation
function generateRecommendation(extinctionRisk, futureChange) {
    if (extinctionRisk === 'extreme' || futureChange < -10) {
        return {
            type: 'danger',
            message: '🚫 DO NOT FISH - This species is at critical risk of extinction. Fishing is strongly discouraged.'
        };
    } else if (extinctionRisk === 'high' || futureChange < -5) {
        return {
            type: 'caution',
            message: '⚠️ FISH WITH EXTREME CAUTION - Limited, sustainable fishing only. Follow strict quotas.'
        };
    } else if (extinctionRisk === 'moderate' || futureChange < -2) {
        return {
            type: 'caution',
            message: '⚠️ FISH RESPONSIBLY - Moderate fishing allowed with proper management and monitoring.'
        };
    } else {
        return {
            type: 'safe',
            message: '✅ SAFE TO FISH - Population is stable or recovering. Follow standard conservation practices.'
        };
    }
}

// Display prediction results
function displayResults(fishName, fishData, predictions, years) {
    // Species information
    document.getElementById('speciesName').textContent = fishName;
    document.getElementById('scientificName').textContent = `(${fishData.scientific_name})`;
    
    const statusBadge = document.getElementById('conservationStatus');
    statusBadge.textContent = fishData.conservation_status;
    statusBadge.className = `status-badge ${getStatusClass(fishData.extinction_risk)}`;
    
    // Population trend
    document.getElementById('populationTrend').textContent = 
        `Current trend: ${fishData.population_trend > 0 ? '+' : ''}${fishData.population_trend}% per year\n` +
        `Predicted in ${years} years: ${predictions.futureStatus}`;
    
    const trendChart = document.getElementById('trendChart');
    trendChart.className = `trend-indicator ${getTrendClass(predictions.futureChange)}`;
    
    // Extinction risk
    document.getElementById('extinctionRisk').textContent = 
        `Current risk level: ${capitalizeFirst(fishData.extinction_risk)}\n` +
        `Extinction probability in ${years} years: ${predictions.extinctionProbability.toFixed(1)}%`;
    
    const riskLevel = document.getElementById('riskLevel');
    riskLevel.className = `risk-indicator ${getRiskClass(fishData.extinction_risk)}`;
    
    // Fishing recommendation
    const adviceBox = document.getElementById('fishingAdvice');
    adviceBox.textContent = predictions.recommendation.message;
    adviceBox.className = `advice-box advice-${predictions.recommendation.type}`;
}

// Update map with fish locations
function updateMap(fishData) {
    // Clear existing markers
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
    
    if (fishData.locations.length === 0) return;
    
    // Add new markers
    fishData.locations.forEach(location => {
        const markerColor = getMarkerColor(location.status);
        
        const marker = L.circleMarker([location.lat, location.lng], {
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.7,
            radius: 8
        }).addTo(map);
        
        marker.bindPopup(`
            <strong>${location.region}</strong><br>
            Status: ${capitalizeFirst(location.status)}<br>
            Depth: ${fishData.habitat_depth}
        `);
        
        currentMarkers.push(marker);
    });
    
    // Fit map to show all locations
    if (fishData.locations.length > 1) {
        const group = new L.featureGroup(currentMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    } else {
        map.setView([fishData.locations[0].lat, fishData.locations[0].lng], 6);
    }
}

// Utility functions
function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

function getStatusClass(risk) {
    if (risk === 'extreme' || risk === 'high') return 'status-danger';
    if (risk === 'moderate') return 'status-caution';
    return 'status-safe';
}

function getTrendClass(change) {
    if (change > 2) return 'trend-positive';
    if (change < -2) return 'trend-negative';
    return 'trend-stable';
}

function getRiskClass(risk) {
    if (risk === 'extreme' || risk === 'high') return 'risk-high';
    if (risk === 'moderate') return 'risk-moderate';
    return 'risk-low';
}

function getMarkerColor(status) {
    switch(status) {
        case 'safe': return '#28a745';
        case 'caution': return '#ffc107';
        case 'danger': return '#dc3545';
        default: return '#6c757d';
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function googleTranslateElementInit() {
            new google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'hi,ta,te,gu,bn,mr,ml,kn,or,pa', // Indian languages
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                }, 
                'google_translate_element'
            );
        }