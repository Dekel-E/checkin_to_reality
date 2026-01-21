// Global variables
let map;
let markersLayer;
let hotelsData = [];
let cities = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadCities();
    loadInitialHotels();
    setupEventListeners();
});

// Initialize the Leaflet map
function initializeMap() {
    // Create map centered on Europe (since we have Rome in the data)
    map = L.map('map').setView([41.9028, 12.4964], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Initialize marker cluster group
    markersLayer = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
    });

    map.addLayer(markersLayer);
}

// Load list of cities for the filter dropdown
async function loadCities() {
    try {
        const response = await fetch('/api/cities');
        cities = await response.json();

        // Populate city filter dropdown
        const citySelect = document.getElementById('city-filter');
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Load initial hotels data
async function loadInitialHotels() {
    showLoading(true);
    try {
        const response = await fetch('/api/hotels/markers');

        if (!response.ok) {
            console.error('Failed to load hotels:', response.status);
            alert('Failed to load hotel data. Please refresh the page.');
            showLoading(false);
            return;
        }

        hotelsData = await response.json();

        if (!Array.isArray(hotelsData)) {
            console.error('Invalid hotel data format:', hotelsData);
            alert('Received invalid hotel data');
            showLoading(false);
            return;
        }

        console.log(`Loaded ${hotelsData.length} hotels initially`);
        displayHotelsOnMap(hotelsData);
        updateStatistics(hotelsData);
    } catch (error) {
        console.error('Error loading hotels:', error);
        alert(`Error loading hotels: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Display hotels on the map
function displayHotelsOnMap(hotels) {
    // Clear existing markers
    markersLayer.clearLayers();

    hotels.forEach(hotel => {
        // Parse and validate coordinates
        const lat = parseFloat(hotel.lat);
        const lon = parseFloat(hotel.lon);

        // Check if coordinates are valid numbers and in valid range
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            // Determine marker color based on gap score category
            let markerColor = 'blue';
            const gapScore = parseFloat(hotel.gap_score) || 0;
            if (hotel.gap_category === 'Low Risk' || gapScore < 30) {
                markerColor = 'green';
            } else if (hotel.gap_category === 'Medium Risk' || (gapScore >= 30 && gapScore < 70)) {
                markerColor = 'orange';
            } else if (hotel.gap_category === 'High Risk' || gapScore >= 70) {
                markerColor = 'red';
            }

            // Create custom icon
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            // Create marker
            const marker = L.marker([lat, lon], { icon: icon });

            // Create popup content
            const popupContent = createPopupContent(hotel);
            marker.bindPopup(popupContent, {
                maxWidth: 350,
                className: 'hotel-popup'
            });

            markersLayer.addLayer(marker);
        }
    });

    // Adjust map bounds to show all markers
    if (hotels.length > 0) {
        const bounds = markersLayer.getBounds();
        if (bounds.isValid()) {
            // If only a few hotels, zoom in more; if many, fit all
            if (hotels.length < 5) {
                map.fitBounds(bounds, { padding: [100, 100], maxZoom: 14 });
            } else {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    } else {
        // If no hotels found, show a message
        console.log('No hotels found matching the current filters');
    }
}

// Create popup content for hotel
function createPopupContent(hotel) {
    // Determine gap category class
    let gapClass = 'gap-low';
    const gapScore = parseFloat(hotel.gap_score) || 0;
    if (hotel.gap_category === 'Medium Risk' || (gapScore >= 30 && gapScore < 70)) {
        gapClass = 'gap-medium';
    } else if (hotel.gap_category === 'High Risk' || gapScore >= 70) {
        gapClass = 'gap-high';
    }

    // Create amenities list (check for "1" string or truthy value)
    const amenities = [];
    if (hotel.has_wifi === '1' || hotel.has_wifi === 1) amenities.push('WiFi');
    if (hotel.has_parking === '1' || hotel.has_parking === 1) amenities.push('Parking');
    if (hotel.has_pool === '1' || hotel.has_pool === 1) amenities.push('Pool');
    if (hotel.has_gym === '1' || hotel.has_gym === 1) amenities.push('Gym');
    if (hotel.has_breakfast === '1' || hotel.has_breakfast === 1) amenities.push('Breakfast');
    if (hotel.has_ac === '1' || hotel.has_ac === 1) amenities.push('AC');

    const amenitiesHtml = amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('');

    // Parse complaints and praises
    let complaintsHtml = '';
    if (hotel.main_complaints) {
        const complaints = hotel.main_complaints.split(',').slice(0, 3);
        complaintsHtml = complaints.map(c => `<li>${c.trim()}</li>`).join('');
    }

    let praisesHtml = '';
    if (hotel.main_praises) {
        const praises = hotel.main_praises.split(',').slice(0, 3);
        praisesHtml = praises.map(p => `<li>${p.trim()}</li>`).join('');
    }

    return `
        <div class="hotel-popup">
            <div class="popup-title">${hotel.title || 'Hotel'}</div>

            <div class="popup-section">
                <div class="popup-label">City: ${hotel.city}</div>
                <div class="popup-label">Distance from Center: ${hotel.distance_from_center_km ? parseFloat(hotel.distance_from_center_km).toFixed(1) : 'N/A'} km</div>
            </div>

            <div class="popup-section">
                <div class="popup-label">Review Score: <strong>${hotel.review_score || 'N/A'}/10</strong></div>
                <div class="popup-label">Reality Score: <strong>${hotel.predicted_reality_score ? parseFloat(hotel.predicted_reality_score).toFixed(1) : 'N/A'}/10</strong></div>
                <div class="popup-label">Gap Score:
                    <span class="gap-score-badge ${gapClass}">
                        ${hotel.gap_score ? parseFloat(hotel.gap_score).toFixed(0) : 'N/A'} - ${hotel.gap_category || 'Unknown'}
                    </span>
                </div>
                <div class="popup-label">Risk Level: ${hotel.risk_level || 'Unknown'}</div>
            </div>

            <div class="popup-section">
                <div class="popup-label">Reviews: ${hotel.number_of_reviews || 0}</div>
                ${amenitiesHtml ? `<div class="popup-label">Amenities: ${amenitiesHtml}</div>` : ''}
            </div>

            ${complaintsHtml ? `
                <div class="popup-section">
                    <div class="popup-label">Top Complaints:</div>
                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.85rem;">
                        ${complaintsHtml}
                    </ul>
                </div>
            ` : ''}

            ${praisesHtml ? `
                <div class="popup-section">
                    <div class="popup-label">Top Praises:</div>
                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.85rem;">
                        ${praisesHtml}
                    </ul>
                </div>
            ` : ''}

            <div class="popup-section" style="margin-top: 10px;">
                <a href="${hotel.url}" target="_blank" class="btn btn-sm btn-primary">View on Booking.com</a>
            </div>
        </div>
    `;
}

// Update statistics
function updateStatistics(hotels) {
    document.getElementById('total-hotels').textContent = hotels.length;

    const uniqueCities = [...new Set(hotels.map(h => h.city))];
    document.getElementById('cities-count').textContent = uniqueCities.length;

    // Show a message if no hotels found
    if (hotels.length === 0) {
        const cityFilter = document.getElementById('city-filter').value;
        if (cityFilter) {
            alert(`No hotels found in ${cityFilter} matching your current filters. Try adjusting the filters or selecting a different city.`);
        } else {
            alert('No hotels found matching your current filters. Try adjusting the filter settings.');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // City filter - auto-apply when changed
    const cityFilter = document.getElementById('city-filter');
    cityFilter.addEventListener('change', function() {
        applyFilters();
    });

    // Review score sliders
    const reviewMin = document.getElementById('review-min');
    const reviewMax = document.getElementById('review-max');
    const reviewMinValue = document.getElementById('review-min-value');
    const reviewMaxValue = document.getElementById('review-max-value');

    reviewMin.addEventListener('input', function() {
        reviewMinValue.textContent = this.value;
        if (parseFloat(this.value) > parseFloat(reviewMax.value)) {
            reviewMax.value = this.value;
            reviewMaxValue.textContent = this.value;
        }
    });

    reviewMax.addEventListener('input', function() {
        reviewMaxValue.textContent = this.value;
        if (parseFloat(this.value) < parseFloat(reviewMin.value)) {
            reviewMin.value = this.value;
            reviewMinValue.textContent = this.value;
        }
    });

    // Distance slider
    const distanceFilter = document.getElementById('distance-filter');
    const distanceValue = document.getElementById('distance-value');

    distanceFilter.addEventListener('input', function() {
        distanceValue.textContent = this.value;
    });

    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', applyFilters);

    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
}

// Apply filters
async function applyFilters() {
    showLoading(true);

    // Collect filter values
    const filters = {};

    // City filter
    const cityFilter = document.getElementById('city-filter').value;
    if (cityFilter) {
        filters.city = cityFilter;
    }

    // Review score filters
    filters.review_min = parseFloat(document.getElementById('review-min').value);
    filters.review_max = parseFloat(document.getElementById('review-max').value);

    // Gap categories
    const gapCategories = [];
    document.querySelectorAll('.gap-filter:checked').forEach(checkbox => {
        gapCategories.push(checkbox.value);
    });
    if (gapCategories.length > 0) {
        filters.gap_categories = gapCategories;
    }

    // Amenities
    const amenities = [];
    document.querySelectorAll('.amenity-filter:checked').forEach(checkbox => {
        amenities.push(checkbox.value);
    });
    if (amenities.length > 0) {
        filters.amenities = amenities;
    }

    // Distance filter
    filters.max_distance = parseFloat(document.getElementById('distance-filter').value);

    console.log('Sending filters:', filters);

    try {
        const response = await fetch('/api/hotels/filtered', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters)
        });

        // Check if response is successful
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            alert(`Error: ${errorData.error || 'Failed to apply filters'}`);
            showLoading(false);
            return;
        }

        const filteredHotels = await response.json();
        console.log(`Received ${filteredHotels.length} hotels`);

        // Check if we got valid data
        if (!Array.isArray(filteredHotels)) {
            console.error('Invalid response format:', filteredHotels);
            alert('Received invalid data from server');
            showLoading(false);
            return;
        }

        displayHotelsOnMap(filteredHotels);
        updateStatistics(filteredHotels);
    } catch (error) {
        console.error('Error applying filters:', error);
        alert(`Error applying filters: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Reset all filters
function resetFilters() {
    // Reset city
    document.getElementById('city-filter').value = '';

    // Reset review scores
    document.getElementById('review-min').value = 7;
    document.getElementById('review-max').value = 10;
    document.getElementById('review-min-value').textContent = '7.0';
    document.getElementById('review-max-value').textContent = '10.0';

    // Reset gap categories
    document.getElementById('gap-low').checked = true;
    document.getElementById('gap-medium').checked = true;
    document.getElementById('gap-high').checked = false;

    // Reset amenities
    document.querySelectorAll('.amenity-filter').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reset distance
    document.getElementById('distance-filter').value = 20;
    document.getElementById('distance-value').textContent = '20';

    // Reload initial hotels
    loadInitialHotels();
}

// Show/hide loading overlay
function showLoading(show) {
    const loadingOverlay = document.getElementById('loading');
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}