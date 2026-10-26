
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const message = document.getElementById("message");
const weatherContainer = document.getElementById("weather");
const forecastContainer = document.getElementById("forecast");
const recentContainer = document.getElementById("recent-searches");
const themeButton = document.getElementById("theme-toggle");
const mapCaption = document.getElementById("map-caption");
const effectsContainer = document.getElementById("weather-effects");

const weatherMap = L.map("map").setView([20.5937, 78.9629], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(weatherMap);

let mapMarker = null;

function setTheme(theme) {
    const darkMode = theme === "dark";

    document.body.classList.toggle("dark-mode", darkMode);
    themeButton.textContent = darkMode ? "Light Mode" : "Dark Mode";

    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
}

let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("theme") || "light";
} catch (error) {
    savedTheme = "light";
}

setTheme(savedTheme);

themeButton.addEventListener("click", () => {
    const darkMode = document.body.classList.contains("dark-mode");
    setTheme(darkMode ? "light" : "dark");
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        cityInput.focus();
        return;
    }

    await getWeather(city);
});

async function getWeather(city) {
    message.textContent = `Searching for weather in ${city}...`;
    form.querySelector('button[type="submit"]').disabled = true;

    try {
        const locationResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!locationResponse.ok) {
            throw new Error("Unable to search for this city.");
        }

        const locationData = await locationResponse.json();

        if (!locationData.results || locationData.results.length === 0) {
            throw new Error("City not found. Please check the spelling.");
        }

        const place = locationData.results[0];

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
        );

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch weather data.");
        }

        const data = await weatherResponse.json();

        if (!data.current || !data.daily) {
            throw new Error("Weather information is unavailable.");
        }

        displayWeather(place, data.current);
        displayForecast(data.daily);
        displayMap(place, data.current);
        updateWeatherEffects(data.current.weather_code);
        saveRecentCity(place.name);

        const region = place.admin1 ? `, ${place.admin1}` : "";
        message.textContent = `Weather updated for ${place.name}${region}.`;
    } catch (error) {
        message.textContent =
            error instanceof TypeError
                ? "Network error. Check your internet connection."
                : error.message || "Something went wrong. Please try again.";

        if (mapMarker) {
            weatherMap.removeLayer(mapMarker);
            mapMarker = null;
        }

        mapCaption.textContent =
            "Search for a valid city to display its location.";

        weatherContainer.innerHTML = "";
        forecastContainer.innerHTML = "";

        clearWeatherEffects();

        weatherMap.setView([20.5937, 78.9629], 4);
        weatherMap.invalidateSize();
    } finally {
        form.querySelector('button[type="submit"]').disabled = false;
    }
}

function getWeatherDescription(code) {
    const descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Freezing drizzle",
        57: "Heavy freezing drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Light snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        77: "Snow grains",
        80: "Light rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Light snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Heavy thunderstorm with hail"
    };

    return descriptions[code] || "Weather unavailable";
}

function getWeatherType(code) {
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "snow";
    }

    if ([95, 96, 99].includes(code)) {
        return "storm";
    }

    if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
    ) {
        return "rain";
    }

    if ([45, 48].includes(code)) {
        return "fog";
    }

    if (code === 3) {
        return "cloudy";
    }

    if (code === 2) {
        return "partly-cloudy";
    }

    if (code === 0 || code === 1) {
        return "sunny";
    }

    return "cloudy";
}

function getWeatherIcon(code) {
    const type = getWeatherType(code);

    const icons = {
        sunny: "☀️",
        "partly-cloudy": "🌤️",
        cloudy: "☁️",
        fog: "🌫️",
        rain: "🌧️",
        snow: "❄️",
        storm: "⛈️"
    };

    return icons[type] || "🌡️";
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function displayWeather(place, current) {
    const cityName = escapeHTML(place.name);
    const region = place.admin1
        ? `, ${escapeHTML(place.admin1)}`
        : "";

    const condition = getWeatherDescription(current.weather_code);
    const icon = getWeatherIcon(current.weather_code);
    const type = getWeatherType(current.weather_code);

    weatherContainer.innerHTML = `
        <article class="weather-card">
            <div class="weather-top">
                <div>
                    <h2>${cityName}${region}</h2>
                    <p>${condition}</p>
                </div>
                <span class="weather-icon ${type}">${icon}</span>
            </div>

            <p class="temperature">${current.temperature_2m}°C</p>

            <div class="weather-details">
                <div>
                    <span>Feels like</span>
                    <strong>${current.apparent_temperature}°C</strong>
                </div>

                <div>
                    <span>Humidity</span>
                    <strong>${current.relative_humidity_2m}%</strong>
                </div>

                <div>
                    <span>Wind speed</span>
                    <strong>${current.wind_speed_10m} km/h</strong>
                </div>

                <div>
                    <span>Condition</span>
                    <strong>${condition}</strong>
                </div>
            </div>
        </article>
    `;
}

function displayMap(place, current) {
    const latitude = place.latitude;
    const longitude = place.longitude;
    const cityName = escapeHTML(place.name);

    const region = place.admin1
        ? `, ${escapeHTML(place.admin1)}`
        : "";

    const condition = getWeatherDescription(current.weather_code);
    const icon = getWeatherIcon(current.weather_code);

    weatherMap.setView([latitude, longitude], 11);

    if (mapMarker) {
        weatherMap.removeLayer(mapMarker);
    }

    mapMarker = L.marker([latitude, longitude]).addTo(weatherMap);

    mapMarker.bindPopup(`
        <div class="map-popup">
            <strong>${cityName}${region}</strong><br>
            ${icon} ${condition}<br>
            Temperature: ${current.temperature_2m}°C<br>
            Feels like: ${current.apparent_temperature}°C<br>
            Wind: ${current.wind_speed_10m} km/h<br>
            Humidity: ${current.relative_humidity_2m}%
        </div>
    `).openPopup();

    mapCaption.textContent =
        `Showing ${place.name}${place.admin1 ? ", " + place.admin1 : ""} and its current weather.`;

    weatherMap.invalidateSize();
}

function displayForecast(daily) {
    forecastContainer.innerHTML = "";

    daily.time.forEach((date, index) => {
        const day = new Date(`${date}T12:00:00`);

        const dayName = day.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

        const code = daily.weather_code[index];
        const condition = getWeatherDescription(code);
        const icon = getWeatherIcon(code);
        const type = getWeatherType(code);

        forecastContainer.innerHTML += `
            <article class="forecast-card">
                <h3>${dayName}</h3>
                <div class="forecast-icon ${type}">${icon}</div>
                <p>${condition}</p>
                <p><strong>${daily.temperature_2m_max[index]}°C</strong></p>
                <p>Low: ${daily.temperature_2m_min[index]}°C</p>
            </article>
        `;
    });
}

function clearWeatherEffects() {
    if (!effectsContainer) {
        return;
    }

    const types = [
        "sunny",
        "partly-cloudy",
        "cloudy",
        "fog",
        "rain",
        "snow",
        "storm"
    ];

    document.body.classList.remove(
        ...types.map(type => `weather-${type}`)
    );

    effectsContainer.replaceChildren();
}

function updateWeatherEffects(code) {
    if (!effectsContainer) {
        return;
    }

    clearWeatherEffects();

    if (code === null || code === undefined) {
        return;
    }

    const type = getWeatherType(code);

    document.body.classList.add(`weather-${type}`);

    if (type === "sunny" || type === "partly-cloudy") {
        const sun = document.createElement("div");
        sun.className = "weather-sun";
        effectsContainer.appendChild(sun);
    }

    if (["partly-cloudy", "cloudy", "fog"].includes(type)) {
        const count = type === "partly-cloudy" ? 2 : 4;

        for (let i = 0; i < count; i++) {
            const cloud = document.createElement("div");

            cloud.className = "weather-cloud";
            cloud.style.top = `${12 + i * 17}%`;
            cloud.style.animationDuration = `${28 + i * 9}s`;
            cloud.style.animationDelay = `${-i * 8}s`;

            effectsContainer.appendChild(cloud);
        }
    }

    if (type === "fog") {
        const fog = document.createElement("div");
        fog.className = "weather-fog-layer";
        effectsContainer.appendChild(fog);
    }

    if (type === "rain" || type === "storm") {
        for (let i = 0; i < 48; i++) {
            const drop = document.createElement("span");

            drop.className = "weather-rain-drop";
            drop.style.setProperty("--left", `${Math.random() * 100}%`);
            drop.style.setProperty(
                "--duration",
                `${0.6 + Math.random() * 0.7}s`
            );
            drop.style.setProperty(
                "--delay",
                `${-Math.random() * 2}s`
            );

            effectsContainer.appendChild(drop);
        }
    }

    if (type === "snow") {
        for (let i = 0; i < 45; i++) {
            const flake = document.createElement("span");

            flake.className = "weather-snowflake";
            flake.textContent = Math.random() > 0.5 ? "❄" : "❅";

            flake.style.setProperty("--left", `${Math.random() * 100}%`);
            flake.style.setProperty(
                "--size",
                `${10 + Math.random() * 15}px`
            );
            flake.style.setProperty(
                "--duration",
                `${7 + Math.random() * 10}s`
            );
            flake.style.setProperty(
                "--delay",
                `${-Math.random() * 15}s`
            );
            flake.style.setProperty(
                "--drift",
                `${Math.random() * 140 - 70}px`
            );

            effectsContainer.appendChild(flake);
        }
    }

    if (type === "storm") {
        const lightning = document.createElement("div");
        lightning.className = "weather-lightning";
        effectsContainer.appendChild(lightning);
    }
}

function saveRecentCity(city) {
    let cities = [];

    try {
        const storedCities = JSON.parse(
            localStorage.getItem("recentCities") || "[]"
        );

        if (Array.isArray(storedCities)) {
            cities = storedCities.filter(
                item => typeof item === "string"
            );
        }
    } catch (error) {
        cities = [];
    }

    cities = [
        city,
        ...cities.filter(
            item => item.toLowerCase() !== city.toLowerCase()
        )
    ].slice(0, 5);

    try {
        localStorage.setItem("recentCities", JSON.stringify(cities));
    } catch (error) {
        console.warn("Recent searches could not be saved.");
    }

    displayRecentCities();
}

function displayRecentCities() {
    let cities = [];

    try {
        const storedCities = JSON.parse(
            localStorage.getItem("recentCities") || "[]"
        );

        if (Array.isArray(storedCities)) {
            cities = storedCities.filter(
                item => typeof item === "string"
            ).slice(0, 5);
        }
    } catch (error) {
        cities = [];
    }

    recentContainer.innerHTML = "";

    cities.forEach(city => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = city;

        button.addEventListener("click", () => {
            cityInput.value = city;
            getWeather(city);
        });

        recentContainer.appendChild(button);
    });
}

displayRecentCities();

window.addEventListener("load", () => {
    setTimeout(() => weatherMap.invalidateSize(), 100);
});
