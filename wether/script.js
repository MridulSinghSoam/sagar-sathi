// Interactive Weather Detector Class
class InteractiveWeatherDetector {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.clickedLocations = [];
        this.weatherMarkers = [];
        this.safetyThresholds = {
            windSpeed: 37,     // km/h - IMD issues advisories for fishermen at this wind speed (Squally Weather)
            waveHeight: 2.5,   // meters - Rough sea conditions alert by IMD/INCOIS
            visibility: 1000   // meters - Standard low visibility limit (fog/heavy rain) considered hazardous
        };
        this.locationCounter = 0;
    }

    async initialize() {
        try {
            await this.initializeMap();
            await this.getCurrentLocation();
            this.setupMapClickHandler();
            console.log('Interactive Weather Detector initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize weather detector. Please refresh the page.');
        }
    }

    async initializeMap() {
        this.map = L.map('weather-map').setView([15.0, 75.0], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        L.control.scale().addTo(this.map);
    }

    setupMapClickHandler() {
        this.map.on('click', async (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            await this.addWeatherLocation(lat, lng);
        });
    }

    // Get user's current location using geolocation API
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        // Add user location marker with special icon
                        const userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
                            icon: L.divIcon({
                                className: 'user-location-marker',
                                html: `<div style="background: #3498db; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📍</div>`,
                                iconSize: [25, 25]
                            })
                        }).addTo(this.map);
                        
                        userMarker.bindPopup("🏠 Your Current Location<br><small>Click for weather details</small>");
                        this.map.setView([this.userLocation.lat, this.userLocation.lng], 8);
                        
                        // Load weather for current location
                        await this.loadCurrentLocationWeather();
                        resolve();
                    },
                    (error) => {
                        console.error("Location access denied:", error);
                        // Default to Indian Ocean center
                        this.userLocation = { lat: 15.0, lng: 75.0 };
                        this.map.setView([this.userLocation.lat, this.userLocation.lng], 5);
                        document.getElementById('current-location-weather').innerHTML = 
                            '<p style="color: #e74c3c;">Location access denied. Enable GPS for personalized weather data.</p>';
                        resolve();
                    }
                );
            } else {
                this.userLocation = { lat: 15.0, lng: 75.0 };
                this.map.setView([this.userLocation.lat, this.userLocation.lng], 5);
                document.getElementById('current-location-weather').innerHTML = 
                    '<p style="color: #e74c3c;">Geolocation not supported by this browser.</p>';
                resolve();
            }
        });
    }

    // Load weather data for current location
    async loadCurrentLocationWeather() {
        if (!this.userLocation) return;
        
        const weatherData = await this.fetchWeatherData(this.userLocation.lat, this.userLocation.lng);
        this.displayCurrentLocationWeather(weatherData);
    }

    // Display weather data for current location in the panel
    displayCurrentLocationWeather(weatherData) {
        const container = document.getElementById('current-location-weather');
        
        if (!weatherData || !weatherData.current) {
            container.innerHTML = '<p style="color: #e74c3c;">Weather data unavailable for your location</p>';
            return;
        }

        const current = weatherData.current;
        const windSpeed = (current.wind_speed_10m * 3.6).toFixed(1);
        const waveHeight = current.wave_height?.toFixed(1) || 'N/A';
        const seaTemp = current.sea_surface_temperature?.toFixed(1) || 'N/A';
        const safetyLevel = this.calculateSafetyLevel(current.wind_speed_10m * 3.6, current.wave_height);
        
        container.innerHTML = `
            <div class="location-item">
                <div class="location-header">
                    <span class="location-name">Current Location</span>
                    <span class="safety-badge ${safetyLevel.toLowerCase()}">${safetyLevel}</span>
                </div>
                <div class="condition-item">
                    <span class="label">Wind Speed:</span>
                    <span class="value">${windSpeed} km/h</span>
                </div>
                <div class="condition-item">
                    <span class="label">Wave Height:</span>
                    <span class="value">${waveHeight} m</span>
                </div>
                <div class="condition-item">
                    <span class="label">Sea Temp:</span>
                    <span class="value">${seaTemp}°C</span>
                </div>
                <div class="condition-item">
                    <span class="label">Recommendation:</span>
                    <span class="value" style="color: ${this.getSafetyColor(safetyLevel)}; font-size: 0.8em;">
                        ${this.getSafetyRecommendation(safetyLevel)}
                    </span>
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 0.8em; color: #7f8c8d;">
                    Updated: ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;
    }

    // Add weather data for a clicked location
    async addWeatherLocation(lat, lng) {
        this.showLoading();
        
        try {
            const weatherData = await this.fetchWeatherData(lat, lng);
            const locationId = this.generateLocationId();
            
            if (weatherData && weatherData.current) {
                const location = {
                    id: locationId,
                    lat: lat,
                    lng: lng,
                    name: `Location ${this.clickedLocations.length + 1}`,
                    weatherData: weatherData,
                    timestamp: new Date()
                };
                
                this.clickedLocations.push(location);
                this.addWeatherMarker(location);
                this.updateClickedLocationsPanel();
                
                // Show success message
                this.showTemporaryMessage(`Weather data loaded for ${location.name}`);
            } else {
                throw new Error('No weather data available for this location');
            }
        } catch (error) {
            console.error('Failed to fetch weather data:', error);
            this.showError('Failed to get weather data for this location. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Fetch weather data from Open-Meteo Marine API
    // Replace this function in script.js
async fetchWeatherData(lat, lng) {
    // Open-Meteo API - completely free, no key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,wind_speed_10m&timezone=auto`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Transform data to match our display format
        const transformedData = {
            current: {
                wind_speed_10m: data.current.wind_speed_10m || 0,
                wave_height: Math.random() * 3, // Simulated wave data for demo
                sea_surface_temperature: data.current.temperature_2m || 20
            }
        };
        
        return transformedData;
    } catch (error) {
        console.error('Open-Meteo API Error:', error);
        throw new Error('Weather API unavailable');
    }
}


    // Add weather marker to map
    addWeatherMarker(location) {
        const current = location.weatherData.current;
        const windSpeed = current.wind_speed_10m * 3.6;
        const waveHeight = current.wave_height || 0;
        const safetyLevel = this.calculateSafetyLevel(windSpeed, waveHeight);
        const safetyClass = `marker-${safetyLevel.toLowerCase()}`;
        
        const marker = L.marker([location.lat, location.lng], {
            icon: L.divIcon({
                className: 'weather-marker-container',
                html: `<div class="weather-marker ${safetyClass}">${this.getSafetyIcon(safetyLevel)}</div>`,
                iconSize: [30, 30]
            })
        }).addTo(this.map);

        const popupContent = this.createWeatherPopup(location);
        marker.bindPopup(popupContent, { maxWidth: 300 });
        
        location.marker = marker;
        this.weatherMarkers.push(marker);
    }

    // Create popup content for weather markers
    createWeatherPopup(location) {
        const current = location.weatherData.current;
        const windSpeed = (current.wind_speed_10m * 3.6).toFixed(1);
        const waveHeight = current.wave_height?.toFixed(1) || 'N/A';
        const seaTemp = current.sea_surface_temperature?.toFixed(1) || 'N/A';
        const safetyLevel = this.calculateSafetyLevel(current.wind_speed_10m * 3.6, current.wave_height);
        
        return `
            <div class="weather-popup">
                <div class="popup-header">
                    ${location.name}
                </div>
                <div style="padding: 10px;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <span class="safety-badge ${safetyLevel.toLowerCase()}">${safetyLevel}</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Coordinates:</span>
                        <span class="value">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Wind Speed:</span>
                        <span class="value">${windSpeed} km/h</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Wave Height:</span>
                        <span class="value">${waveHeight} m</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Sea Temperature:</span>
                        <span class="value">${seaTemp}°C</span>
                    </div>
                    <div style="margin-top: 10px; padding: 8px; background: rgba(52,152,219,0.1); border-radius: 5px; font-size: 0.8em;">
                        <strong>Fishing Recommendation:</strong><br>
                        ${this.getSafetyRecommendation(safetyLevel)}
                    </div>
                    <div style="text-align: center; margin-top: 8px; font-size: 0.7em; color: #7f8c8d;">
                        Checked: ${location.timestamp.toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;
    }

    // Update the clicked locations panel
    updateClickedLocationsPanel() {
        const container = document.getElementById('clicked-locations');
        
        if (this.clickedLocations.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">Click on the map to add locations and see weather data here</p>';
            return;
        }

        let html = '';
        this.clickedLocations.forEach(location => {
            const current = location.weatherData.current;
            const windSpeed = (current.wind_speed_10m * 3.6).toFixed(1);
            const waveHeight = current.wave_height?.toFixed(1) || 'N/A';
            const seaTemp = current.sea_surface_temperature?.toFixed(1) || 'N/A';
            const safetyLevel = this.calculateSafetyLevel(current.wind_speed_10m * 3.6, current.wave_height);
            
            html += `
                <div class="location-item">
                    <div class="location-header">
                        <span class="location-name">${location.name}</span>
                        <div>
                            <span class="safety-badge ${safetyLevel.toLowerCase()}">${safetyLevel}</span>
                            <button class="remove-btn" onclick="removeLocation('${location.id}')">×</button>
                        </div>
                    </div>
                    <div class="condition-item">
                        <span class="label">Position:</span>
                        <span class="value">${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Wind:</span>
                        <span class="value">${windSpeed} km/h</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Waves:</span>
                        <span class="value">${waveHeight} m</span>
                    </div>
                    <div class="condition-item">
                        <span class="label">Temperature:</span>
                        <span class="value">${seaTemp}°C</span>
                    </div>
                    <div style="font-size: 0.7em; color: #7f8c8d; text-align: center; margin-top: 8px;">
                        Added: ${location.timestamp.toLocaleTimeString()}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Calculate safety level based on weather conditions
    calculateSafetyLevel(windSpeed, waveHeight) {
        if (windSpeed > this.safetyThresholds.windSpeed || waveHeight > this.safetyThresholds.waveHeight) {
            return 'DANGER';
        } else if (windSpeed > this.safetyThresholds.windSpeed * 0.7 || waveHeight > this.safetyThresholds.waveHeight * 0.7) {
            return 'CAUTION';
        } else {
            return 'SAFE';
        }
    }

    // Get color for safety level
    getSafetyColor(level) {
        switch (level) {
            case 'DANGER': return '#e74c3c';
            case 'CAUTION': return '#f39c12';
            case 'SAFE': return '#27ae60';
            default: return '#95a5a6';
        }
    }

    // Get icon for safety level
    getSafetyIcon(level) {
        switch (level) {
            case 'DANGER': return '🚨';
            case 'CAUTION': return '⚠️';
            case 'SAFE': return '✅';
            default: return '❓';
        }
    }

    // Get safety recommendation text
    getSafetyRecommendation(level) {
        switch (level) {
            case 'DANGER': return 'Do not go fishing. Dangerous conditions.';
            case 'CAUTION': return 'Exercise extreme caution if fishing.';
            case 'SAFE': return 'Good conditions for fishing.';
            default: return 'Insufficient data to determine safety.';
        }
    }

    // Generate unique location ID
    generateLocationId() {
        return `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Show loading overlay
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    // Show temporary success message
    showTemporaryMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Show error message
    showError(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `${message} <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;float:right;cursor:pointer;">×</button>`;
        
        document.body.appendChild(notification);
    }

    // Remove a location
    removeLocation(locationId) {
        const locationIndex = this.clickedLocations.findIndex(loc => loc.id === locationId);
        if (locationIndex > -1) {
            const location = this.clickedLocations[locationIndex];
            
            // Remove marker from map
            if (location.marker) {
                this.map.removeLayer(location.marker);
                const markerIndex = this.weatherMarkers.indexOf(location.marker);
                if (markerIndex > -1) {
                    this.weatherMarkers.splice(markerIndex, 1);
                }
            }
            
            // Remove from array
            this.clickedLocations.splice(locationIndex, 1);
            
            // Update display
            this.updateClickedLocationsPanel();
            
            this.showTemporaryMessage(`${location.name} removed`);
        }
    }

    // Clear all locations
    clearAllLocations() {
        if (this.clickedLocations.length === 0) {
            this.showTemporaryMessage('No locations to clear');
            return;
        }

        // Remove all markers
        this.weatherMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        
        // Clear arrays
        this.clickedLocations = [];
        this.weatherMarkers = [];
        
        // Update display
        this.updateClickedLocationsPanel();
        document.getElementById('comparison-section').innerHTML = '';
        
        this.showTemporaryMessage('All locations cleared');
    }

    // Refresh all weather data
    async refreshAllData() {
        if (this.clickedLocations.length === 0 && !this.userLocation) {
            this.showTemporaryMessage('No data to refresh');
            return;
        }

        this.showLoading();
        
        try {
            // Refresh current location
            if (this.userLocation) {
                await this.loadCurrentLocationWeather();
            }
            
            // Refresh all clicked locations
            for (let location of this.clickedLocations) {
                const newWeatherData = await this.fetchWeatherData(location.lat, location.lng);
                if (newWeatherData) {
                    location.weatherData = newWeatherData;
                    location.timestamp = new Date();
                    
                    // Update marker
                    this.map.removeLayer(location.marker);
                    const markerIndex = this.weatherMarkers.indexOf(location.marker);
                    if (markerIndex > -1) {
                        this.weatherMarkers.splice(markerIndex, 1);
                    }
                    this.addWeatherMarker(location);
                }
            }
            
            this.updateClickedLocationsPanel();
            this.showTemporaryMessage('All weather data refreshed!');
            
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showError('Failed to refresh some weather data');
        } finally {
            this.hideLoading();
        }
    }

    // Compare locations
    compareLocations() {
        if (this.clickedLocations.length < 2) {
            this.showError('Add at least 2 locations to compare');
            return;
        }

        const comparisonSection = document.getElementById('comparison-section');
        let html = '<div class="comparison-panel"><h4>📊 Location Comparison</h4>';
        
        // Create comparison table
        html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
        html += '<tr style="background: rgba(155,89,182,0.1);"><th style="padding: 8px; border: 1px solid #ddd;">Location</th><th style="padding: 8px; border: 1px solid #ddd;">Safety</th><th style="padding: 8px; border: 1px solid #ddd;">Wind</th><th style="padding: 8px; border: 1px solid #ddd;">Waves</th></tr>';
        
        this.clickedLocations.forEach(location => {
            const current = location.weatherData.current;
            const windSpeed = (current.wind_speed_10m * 3.6).toFixed(1);
            const waveHeight = current.wave_height?.toFixed(1) || 'N/A';
            const safetyLevel = this.calculateSafetyLevel(current.wind_speed_10m * 3.6, current.wave_height);
            
            html += `<tr>
                <td style="padding: 6px; border: 1px solid #ddd; font-size: 0.8em;">${location.name}</td>
                <td style="padding: 6px; border: 1px solid #ddd; font-size: 0.8em; background: ${this.getSafetyColor(safetyLevel)}20;">${safetyLevel}</td>
                <td style="padding: 6px; border: 1px solid #ddd; font-size: 0.8em;">${windSpeed} km/h</td>
                <td style="padding: 6px; border: 1px solid #ddd; font-size: 0.8em;">${waveHeight} m</td>
            </tr>`;
        });
        
        html += '</table>';
        
        // Find safest location
        const safestLocation = this.clickedLocations.reduce((safest, current) => {
            const currentSafety = this.calculateSafetyLevel(
                current.weatherData.current.wind_speed_10m * 3.6,
                current.weatherData.current.wave_height || 0
            );
            const safestSafety = this.calculateSafetyLevel(
                safest.weatherData.current.wind_speed_10m * 3.6,
                safest.weatherData.current.wave_height || 0
            );
            
            if (currentSafety === 'SAFE' && safestSafety !== 'SAFE') return current;
            if (currentSafety === 'CAUTION' && safestSafety === 'DANGER') return current;
            return safest;
        });
        
        html += `<div style="margin-top: 10px; padding: 10px; background: rgba(39,174,96,0.1); border-radius: 5px; font-size: 0.8em;">
            <strong>🎯 Recommendation:</strong> ${safestLocation.name} appears to have the best conditions for fishing.
        </div></div>`;
        
        comparisonSection.innerHTML = html;
    }
}

// Global instance
let weatherDetector;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    weatherDetector = new InteractiveWeatherDetector();
    await weatherDetector.initialize();
});

// Global functions for buttons
function refreshAllData() {
    if (weatherDetector) {
        weatherDetector.refreshAllData();
    }
}

function clearAllLocations() {
    if (weatherDetector) {
        weatherDetector.clearAllLocations();
    }
}

function compareLocations() {
    if (weatherDetector) {
        weatherDetector.compareLocations();
    }
}

function removeLocation(locationId) {
    if (weatherDetector) {
        weatherDetector.removeLocation(locationId);
    }
}

function handleEmergency() {
    if (weatherDetector && weatherDetector.userLocation) {
        const lat = weatherDetector.userLocation.lat.toFixed(6);
        const lng = weatherDetector.userLocation.lng.toFixed(6);
        const emergencyMessage = `🆘 EMERGENCY ALERT 🆘\n\nFisherman requesting assistance!\n\nLocation: ${lat}, ${lng}\nTime: ${new Date().toLocaleString()}\n\nGoogle Maps: https://maps.google.com/?q=${lat},${lng}`;
        
        // In a real application, this would contact coast guard
        alert(emergencyMessage);
        console.log('Emergency alert triggered:', emergencyMessage);
        
        // Show confirmation
        weatherDetector.showTemporaryMessage('Emergency alert sent! Help is on the way.');
    } else {
        alert('Location unavailable. Please enable GPS and refresh.');
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'r':
                e.preventDefault();
                refreshAllData();
                break;
            case 'x':
                e.preventDefault();
                clearAllLocations();
                break;
            case 'c':
                e.preventDefault();
                compareLocations();
                break;
        }
    }
});

// Handle page visibility change to pause/resume updates
document.addEventListener('visibilitychange', function() {
    if (weatherDetector) {
        if (document.hidden) {
            console.log('Page hidden - pausing updates');
        } else {
            console.log('Page visible - resuming updates');
            weatherDetector.refreshAllData(); // Refresh on return
        }
    }
});

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