# WeatherSphere — Live Weather Dashboard

A responsive weather dashboard that lets users search for cities around the world and explore current weather conditions, a five-day forecast, and the city location on an interactive map. The interface also includes dark/light mode and animated weather effects that change according to the weather condition returned by the weather API.

## Features

- **Search worldwide:** Find a city by name.
- **Current weather:** View temperature, feels-like temperature, humidity, wind speed, and weather condition.
- **Five-day forecast:** View daily weather conditions and high/low temperatures.
- **Interactive map:** Zoom to the searched city and click its marker to see weather details.
- **Animated weather effects:** Sunny, partly cloudy, cloudy, foggy, rainy, snowy, and thunderstorm effects.
- **Dark and light themes:** Save your preferred theme in browser local storage.
- **Recent searches:** Quickly search again for recently selected cities.
- **Responsive design:** Layout adapts to desktop and mobile screens.
- **Error handling:** Displays a message when a city cannot be found or weather data cannot be loaded.

## Built With

- HTML5
- CSS3 and CSS animations
- JavaScript (ES6+, Fetch API, async/await, and localStorage)
- [Open-Meteo](https://open-meteo.com/) for geocoding and weather data
- [Leaflet](https://leafletjs.com/) for the interactive map
- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles

## Project Structure

```text
weather-dashboard-live/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run the Project

1. Clone or download this repository.

   ```bash
   git clone <your-repository-url>
   ```

2. Open the project folder in Visual Studio Code.
3. Start `index.html` using the **Live Server** extension.
4. Make sure you have an internet connection so the weather API, map tiles, and Leaflet libraries can load.
5. Enter a city such as `Mumbai`, `London`, or `Srinagar` and click **Search**.

No Open-Meteo API key is required for the endpoints used by this project.

## How It Works

1. The app sends the searched city to the Open-Meteo Geocoding API to obtain its latitude and longitude.
2. It requests current weather and daily forecast data for those coordinates.
3. It updates the weather card, forecast cards, and map marker.
4. It reads the returned weather code and displays the corresponding animated effect.
5. It saves the selected theme and recent searches in the browser's local storage.

## APIs and Map Attribution

- **Weather and geocoding:** [Open-Meteo](https://open-meteo.com/)
- **Interactive map library:** [Leaflet](https://leafletjs.com/)
- **Map data and tiles:** [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright)

The map requires an internet connection. In dark