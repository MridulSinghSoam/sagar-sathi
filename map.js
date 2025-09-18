// Marine ecosystem map functionality
let map;
let fishingZonesLayer;
let protectedAreasLayer;
let speciesMarkersLayer;
let activeMarker = null;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadMarineData();
});

function initializeMap() {
    // Initialize Leaflet map
    map = L.map('map', {
        center: [20.0, 0.0], // Center on Atlantic Ocean
        zoom: 3,
        minZoom: 2,
        maxZoom: 18
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize layer groups
    fishingZonesLayer = L.layerGroup().addTo(map);
    protectedAreasLayer = L.layerGroup().addTo(map);
    speciesMarkersLayer = L.layerGroup().addTo(map);

    // Add scale control
    L.control.scale().addTo(map);
}

function loadMarineData() {
    showLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
        createFishingZones();
        createProtectedAreas();
        createSpeciesMarkers();
        showLoading(false);
    }, 1500);
}

function createFishingZones() {
    // Sample fishing zones data (in real app, this would come from your datasets)
    const fishingZones = [
        {
            name: "North Atlantic Fishing Ground",
            coordinates: [[45, -50], [55, -50], [55, -30], [45, -30]],
            status: "open",
            species: ["Atlantic Cod", "Haddock", "Pollock"],
            regulations: "Commercial fishing permitted with valid license"
        },
        {
            name: "Pacific Commercial Zone",
            coordinates: [[35, -130], [45, -130], [45, -110], [35, -110]],
            status: "open",
            species: ["Pacific Salmon", "Tuna", "Halibut"],
            regulations: "Seasonal restrictions apply June-August"
        },
        {
            name: "Gulf Stream Fishing Area",
            coordinates: [[25, -80], [35, -80], [35, -60], [25, -60]],
            status: "restricted",
            species: ["Mahi-mahi", "Marlin", "Sailfish"],
            regulations: "Limited access - permit required"
        }
    ];

    fishingZones.forEach(zone => {
        const color = zone.status === 'open' ? '#27ae60' : 
                     zone.status === 'restricted' ? '#f39c12' : '#e74c3c';
        
        const polygon = L.polygon(zone.coordinates, {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2
        }).addTo(fishingZonesLayer);

        polygon.bindPopup(createZonePopup(zone));
        
        polygon.on('click', function(e) {
            showAreaDetails(zone);
        });
    });
}

function createProtectedAreas() {
    // Sample protected areas data
    const protectedAreas = [
        {
            name: "Great Barrier Reef Marine Park",
            coordinates: [[-16, 146], [-24, 146], [-24, 154], [-16, 154]],
            type: "Marine Protected Area",
            established: "1975",
            size: "344,400 km²",
            species: ["Coral Trout", "Giant Clam", "Green Sea Turtle"],
            restrictions: "Fishing strictly prohibited"
        },
        {
            name: "Monterey Bay Marine Sanctuary",
            coordinates: [[36, -122], [37, -122], [37, -121], [36, -121]],
            type: "National Marine Sanctuary",
            established: "1992",
            size: "15,744 km²",
            species: ["Gray Whale", "Sea Otter", "Blue Rockfish"],
            restrictions: "No commercial fishing, research permitted"
        },
        {
            name: "Papahānaumokuākea",
            coordinates: [[23, -165], [28, -165], [28, -160], [23, -160]],
            type: "Marine National Monument",
            established: "2006",
            size: "1,508,870 km²",
            species: ["Hawaiian Monk Seal", "Green Sea Turtle", "Laysan Albatross"],
            restrictions: "Access by special permit only"
        }
    ];

    protectedAreas.forEach(area => {
        const polygon = L.polygon(area.coordinates, {
            color: '#e74c3c',
            fillColor: '#e74c3c',
            fillOpacity: 0.4,
            weight: 3,
            dashArray: '10, 10'
        }).addTo(protectedAreasLayer);

        polygon.bindPopup(createProtectedAreaPopup(area));
        
        polygon.on('click', function(e) {
            showAreaDetails(area);
        });
    });
}

function createSpeciesMarkers() {
    // Sample species location data
    const speciesLocations = [
        {
            name: "Atlantic Cod Population",
            coordinates: [50, -40],
            species: "Atlantic Cod",
            population: "Recovering",
            season: "Year-round",
            depth: "50-200m"
        },
        {
            name: "Bluefin Tuna Migration Route",
            coordinates: [40, -70],
            species: "Bluefin Tuna",
            population: "Endangered",
            season: "Summer migration",
            depth: "Surface-200m"
        },
        {
            name: "Coral Reef Ecosystem",
            coordinates: [-20, 150],
            species: "Multiple reef species",
            population: "Stable",
            season: "Year-round",
            depth: "0-50m"
        },
        {
            name: "Deep Sea Anglerfish",
            coordinates: [30, -90],
            species: "Deep Sea Anglerfish",
            population: "Unknown",
            season: "Year-round",
            depth: "1000-2000m"
        }
    ];

    speciesLocations.forEach(location => {
        const icon = L.divIcon({
            className: 'species-marker',
            html: '<i class="fas fa-fish"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker(location.coordinates, { icon: icon })
            .addTo(speciesMarkersLayer);

        marker.bindPopup(createSpeciesPopup(location));
        
        marker.on('click', function(e) {
            showSpeciesDetails(location);
        });
    });
}

function createZonePopup(zone) {
    return `
        <div class="popup-content">
            <h3>${zone.name}</h3>
            <p><strong>Status:</strong> <span class="status-${zone.status}">${zone.status.toUpperCase()}</span></p>
            <p><strong>Primary Species:</strong> ${zone.species.join(', ')}</p>
            <p><strong>Regulations:</strong> ${zone.regulations}</p>
            <button onclick="showAreaDetails('${zone.name}')">View Details</button>
        </div>
    `;
}

function createProtectedAreaPopup(area) {
    return `
        <div class="popup-content">
            <h3>${area.name}</h3>
            <p><strong>Type:</strong> ${area.type}</p>
            <p><strong>Established:</strong> ${area.established}</p>
            <p><strong>Size:</strong> ${area.size}</p>
            <p><strong>Key Species:</strong> ${area.species.join(', ')}</p>
            <button onclick="showAreaDetails('${area.name}')">View Details</button>
        </div>
    `;
}

function createSpeciesPopup(location) {
    return `
        <div class="popup-content">
            <h3>${location.name}</h3>
            <p><strong>Species:</strong> ${location.species}</p>
            <p><strong>Population:</strong> ${location.population}</p>
            <p><strong>Season:</strong> ${location.season}</p>
            <p><strong>Depth Range:</strong> ${location.depth}</p>
            <button onclick="view3DModel('${location.species}')">View 3D Model</button>
        </div>
    `;
}

function toggleLayer(layerType) {
    const button = document.getElementById(layerType + 'Toggle');
    
    switch(layerType) {
        case 'fishing':
            if (map.hasLayer(fishingZonesLayer)) {
                map.removeLayer(fishingZonesLayer);
                button.classList.remove('active');
            } else {
                map.addLayer(fishingZonesLayer);
                button.classList.add('active');
            }
            break;
        case 'protected':
            if (map.hasLayer(protectedAreasLayer)) {
                map.removeLayer(protectedAreasLayer);
                button.classList.remove('active');
            } else {
                map.addLayer(protectedAreasLayer);
                button.classList.add('active');
            }
            break;
        case 'species':
            if (map.hasLayer(speciesMarkersLayer)) {
                map.removeLayer(speciesMarkersLayer);
                button.classList.remove('active');
            } else {
                map.addLayer(speciesMarkersLayer);
                button.classList.add('active');
            }
            break;
    }
}

function centerMap() {
    map.setView([20.0, 0.0], 3);
}

function showAreaDetails(areaName) {
    const panel = document.getElementById('infoPanel');
    const title = document.getElementById('panelTitle');
    const content = document.getElementById('panelContent');
    
    title.textContent = typeof areaName === 'string' ? areaName : areaName.name;
    
    // Generate detailed information
    content.innerHTML = `
        <div class="area-details">
            <h4>Area Information</h4>
            <p>Detailed information about marine ecosystem, fishing regulations, and conservation status would be displayed here.</p>
            
            <h4>Recent Activity</h4>
            <ul>
                <li>Research vessel survey completed</li>
                <li>Water quality assessment - Normal</li>
                <li>Fish population monitoring ongoing</li>
            </ul>
            
            <h4>Species Found</h4>
            <div class="species-list">
                <div class="species-item" onclick="view3DModel('cod')">
                    <strong>Atlantic Cod</strong> - Click to view 3D model
                </div>
                <div class="species-item" onclick="view3DModel('tuna')">
                    <strong>Bluefin Tuna</strong> - Click to view 3D model
                </div>
                <div class="species-item" onclick="view3DModel('salmon')">
                    <strong>Salmon</strong> - Click to view 3D model
                </div>
            </div>
        </div>
    `;
    
    panel.classList.remove('hidden');
}

function showSpeciesDetails(location) {
    showAreaDetails(location);
}

function closeInfoPanel() {
    document.getElementById('infoPanel').classList.add('hidden');
}

function showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

function view3DModel(species) {
    // This would redirect to your 3D model page
    alert(`Redirecting to 3D model for ${species}...`);
    // In real implementation:
    // window.location.href = `3d-fish.html?species=${species}`;
}

// Add custom CSS for species markers
const style = document.createElement('style');
style.textContent = `
    .species-marker {
        background: #3498db;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    
    .popup-content button {
        background: #3498db;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
    }
    
    .status-open { color: #27ae60; font-weight: bold; }
    .status-restricted { color: #f39c12; font-weight: bold; }
    .status-closed { color: #e74c3c; font-weight: bold; }
    
    .species-item {
        padding: 10px;
        margin: 5px 0;
        background: #f8f9fa;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s ease;
    }
    
    .species-item:hover {
        background: #e9ecef;
    }
`;
document.head.appendChild(style);
