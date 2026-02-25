# Check-in to Reality 🏨

A hotel analysis web application that helps users discover the reality behind hotel listings by analyzing review gaps, neighborhood quality, and location features.

## Overview

Check-in to Reality is a Flask-based web application that provides comprehensive hotel data analysis with interactive maps, advanced filtering, and neighborhood scoring. The application helps travelers make informed decisions by revealing the gap between advertised ratings and actual guest experiences.

## Features

### 📊 Interactive Dashboard
- **Real-time Map Visualization**: Interactive Leaflet map with clustered hotel markers
- **Advanced Filtering**: Filter by city, review scores, distance from center, amenities, and review count
- **Gap Score Analysis**: Identify hotels where reality might differ from expectations
- **Neighborhood Scoring**: Custom algorithm scoring neighborhood quality (0-10)

### 🏷️ Location Badges
Hotels are automatically tagged with smart badges:
- **Metro Connected**: Direct metro/railway access
- **Foodie Paradise**: 10+ top-rated restaurants nearby
- **Nightlife Hub**: 5+ nightlife spots within 500m
- **Green & Quiet**: Parks nearby with low noise levels
- **Walk Everywhere**: Transport within 200m
- **City Center**: Less than 1km from city center

### 📈 Analysis Features
- **Complaint/Praise Analysis**: Categorized guest feedback
- **Reality Score**: Predicted actual experience score
- **Risk Assessment**: Identifies potential booking risks
- **Amenity Tracking**: WiFi, parking, pool, gym, breakfast, AC, and more

## Tech Stack

- **Backend**: Flask 3.0.0
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Mapping**: Leaflet.js with marker clustering
- **UI Framework**: Bootstrap 5 with Font Awesome icons

## Project Structure

```
checkin_to_reality/
├── app.py                      # Main Flask application
├── database.py                 # Database helper functions
├── init_db.py                  # Database initialization script
├── requirements.txt            # Python dependencies
├── data/
│   └── hotels.csv             # Hotel dataset (50MB+)
├── static/
│   ├── css/                   # Stylesheets
│   └── js/                    # JavaScript files
└── templates/                 # HTML templates
    ├── index.html             # Homepage
    ├── dashboard_enhanced.html # Interactive map dashboard
    ├── hotels.html            # Hotel listing page
    ├── analysis.html          # Analysis dashboard
    └── about.html             # About page
```

## Installation

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip

### Setup Steps

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure PostgreSQL**
   - Create a PostgreSQL database named `hotel_webapp`
   - Update database credentials in `database.py` and `init_db.py`:
     ```python
     DB_CONFIG = {
         'dbname': 'hotel_webapp',
         'user': 'postgres',
         'password': 'your_password',
         'host': 'localhost',
         'port': 5432
     }
     ```

3. **Initialize the database**
   ```bash
   python init_db.py
   ```
   This will create the hotels table and load data from `data/hotels.csv`

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the app**
   Open your browser and navigate to `http://localhost:5000`

## Database Schema

The application uses a PostgreSQL database with a single `hotels` table containing:
- Hotel identification (hotel_id, title, city, country)
- Location data (lat, lon, distance_from_center_km)
- Review metrics (review_score, number_of_reviews, predicted_reality_score)
- Gap analysis (gap_score, gap_category, risk_level)
- Amenities (has_wifi, has_parking, has_pool, has_gym, etc.)
- Neighborhood features (metro access, restaurants, parks, noise sources)
- Sentiment analysis (main_complaints, main_praises)
- Categorized feedback (complaint_noise, praise_location, etc.)

## API Endpoints

### Hotels
- `GET /api/hotels` - Get all hotels (with optional limit)
- `GET /api/search?q=<query>` - Search hotels by name/location
- `POST /api/hotels/filtered` - Get filtered hotels with advanced criteria
- `GET /api/hotels/markers` - Get hotel data optimized for map markers

### Metadata
- `GET /api/stats` - Get database statistics
- `GET /api/cities` - Get list of cities with hotels

## Features in Detail

### Filtering Options
- **City**: Filter by specific city
- **Review Score Range**: Min/max review scores
- **Distance**: Maximum distance from city center (km)
- **Minimum Reviews**: Filter by review count threshold
- **Gap Categories**: Filter by expectation gap levels
- **Amenities**: Filter by specific amenities (WiFi, parking, pool, etc.)

### Neighborhood Scoring Algorithm
The app calculates a neighborhood quality score (0-10) based on:
- **Positive factors**: Metro access, restaurant count/quality, parks, transport proximity
- **Negative factors**: Noise sources, excessive nightlife
- **Balanced approach**: Considers both convenience and tranquility

## Usage Tips

1. **Finding Safe Bets**: Filter by gap_category "Low Gap" to find hotels that match their ratings
2. **Location Seekers**: Use the map to visually explore hotel locations and their neighborhoods
3. **Amenity Focused**: Apply multiple amenity filters to find exactly what you need
4. **City Exploration**: Select a city to see all hotels and their relative positions

## Development

### Running in Debug Mode
Debug mode is enabled by default in `app.py`:
```python
if __name__ == '__main__':
    app.run(debug=True)
```

### Adding New Features
- **New filters**: Update `get_filtered_hotels()` in `database.py`
- **New badges**: Modify `calculate_location_badges()` in `database.py`
- **UI changes**: Edit templates in `templates/` folder
- **Styling**: Update CSS files in `static/css/`

## Security Notes

⚠️ **Important**: Before deploying to production:
1. Change `app.config['SECRET_KEY']` to a secure random value
2. Update database credentials
3. Set `debug=False` in production
4. Use environment variables for sensitive configuration
5. Implement proper authentication if needed

## Performance Considerations

- The CSV file is 50MB+, so initial database load may take a few minutes
- Database indexes are created automatically on initialization
- Map marker clustering handles large datasets efficiently
- Filtering is optimized with PostgreSQL queries

## Contributing

To contribute to this project:
1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly with sample data
4. Submit a pull request

## License

This project is for educational and analytical purposes.

## Support

For issues or questions, please check the database connection settings first, then verify that the CSV data loaded correctly by checking the total row count.

---

**Built with Flask, PostgreSQL, and a passion for honest travel experiences** ✈️
