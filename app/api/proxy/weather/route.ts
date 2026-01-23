import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  deductCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
  proxyCorsOptions,
} from "@/lib/proxy";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}

/**
 * @swagger
 * /api/proxy/weather:
 *   post:
 *     summary: Weather Data Proxy (OpenWeatherMap)
 *     description: |
 *       Proxied access to weather data including current conditions, forecasts,
 *       and historical data. Generated apps can display weather information
 *       without needing their own weather API key.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 100 requests per minute per project.
 *
 *       **Credits:** 2 credits per request.
 *
 *       **Operations:**
 *       - `current`: Get current weather for a location
 *       - `forecast`: Get 5-day forecast
 *       - `hourly`: Get hourly forecast for 48 hours
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [current, forecast, hourly]
 *                 description: Type of weather data to retrieve
 *               location:
 *                 type: string
 *                 description: City name (e.g., "New York" or "London,UK")
 *               lat:
 *                 type: number
 *                 description: Latitude (alternative to location)
 *               lon:
 *                 type: number
 *                 description: Longitude (alternative to location)
 *               units:
 *                 type: string
 *                 enum: [metric, imperial, standard]
 *                 default: metric
 *                 description: Temperature units (metric=Celsius, imperial=Fahrenheit)
 *     responses:
 *       200:
 *         description: Successful weather data retrieval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Weather data (structure varies by operation)
 *                 creditsUsed:
 *                   type: integer
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       402:
 *         description: Insufficient credits
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Weather service error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, "weather")) {
    return proxyError(
      "This API key does not have access to the Weather service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit (100 requests per minute)
  const rateLimit = await checkProxyRateLimit(projectId, "weather");
  if (!rateLimit.success) {
    return proxyError(
      "Rate limit exceeded. Maximum 100 requests per minute.",
      "RATE_LIMIT",
      429,
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { operation, location, lat, lon, units = "metric" } = body;

    if (!operation) {
      return proxyError(
        "Missing required field: operation",
        "INVALID_REQUEST",
        400,
      );
    }

    // Validate operation type
    const validOperations = ["current", "forecast", "hourly"];
    if (!validOperations.includes(operation)) {
      return proxyError(
        `Invalid operation. Must be one of: ${validOperations.join(", ")}`,
        "INVALID_REQUEST",
        400,
      );
    }

    // Validate location parameters
    if (!location && (!lat || !lon)) {
      return proxyError(
        "Either 'location' or both 'lat' and 'lon' are required",
        "INVALID_REQUEST",
        400,
      );
    }

    // Calculate credits (2 per request)
    const creditsRequired = 2;

    // Check credits
    const creditsCheck = await checkCredits(
      userId,
      plan,
      "weather",
      creditsRequired,
    );
    if (!creditsCheck) {
      return proxyError(
        "Insufficient credits. Weather operations cost 2 credits per request.",
        "INSUFFICIENT_CREDITS",
        402,
      );
    }

    // Execute weather operation
    let result;
    switch (operation) {
      case "current":
        result = await getCurrentWeather(location, lat, lon, units);
        break;
      case "forecast":
        result = await getForecast(location, lat, lon, units);
        break;
      case "hourly":
        result = await getHourlyForecast(location, lat, lon, units);
        break;
      default:
        return proxyError("Invalid operation", "INVALID_REQUEST", 400);
    }

    // Deduct credits
    await deductCredits(userId, "weather", creditsRequired);

    // Log usage
    await logProxyUsage({
      service: "weather" as const,
      operation,
      creditsUsed: creditsRequired,
      requestSize: JSON.stringify(body).length,
      responseSize: JSON.stringify(result).length,
      latencyMs: Date.now() - startTime,
      metadata: { operation, location: location || `${lat},${lon}`, units },
      success: true,
      apiKeyId,
      projectId,
      userId,
    });

    return proxySuccess(result, creditsRequired);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log failed request
    await logProxyUsage({
      service: "weather" as const,
      operation: "unknown",
      creditsUsed: 0,
      requestSize: 0,
      responseSize: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      errorCode: "INTERNAL_ERROR",
      apiKeyId: auth.context!.apiKeyId,
      projectId: auth.context!.projectId,
      userId: auth.context!.userId,
    });

    console.error("[Weather Proxy] Error:", errorMessage, error);
    return proxyError(
      `Weather service error: ${errorMessage}`,
      "INTERNAL_ERROR",
      500,
    );
  }
}

/**
 * Build query string for OpenWeatherMap API
 */
function buildWeatherQuery(
  location?: string,
  lat?: number,
  lon?: number,
  units: string = "metric",
): string {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const params = new URLSearchParams();

  if (location) {
    params.append("q", location);
  } else if (lat && lon) {
    params.append("lat", lat.toString());
    params.append("lon", lon.toString());
  }

  params.append("units", units);
  if (apiKey) {
    params.append("appid", apiKey);
  }

  return params.toString();
}

/**
 * Get current weather
 */
async function getCurrentWeather(
  location?: string,
  lat?: number,
  lon?: number,
  units: string = "metric",
) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Weather] OPENWEATHER_API_KEY not configured, returning mock data",
    );
    return {
      location: location || `${lat},${lon}`,
      temperature: 22,
      feelsLike: 21,
      humidity: 65,
      pressure: 1013,
      windSpeed: 5.2,
      windDirection: 180,
      conditions: "Partly cloudy",
      description: "Partly cloudy with a chance of sunshine",
      icon: "02d",
      units,
      mock: true,
    };
  }

  const query = buildWeatherQuery(location, lat, lon, units);
  const url = `https://api.openweathermap.org/data/2.5/weather?${query}`;

  const response = await fetch(url);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to fetch weather data");
  }

  return {
    location: data.name,
    country: data.sys.country,
    coordinates: {
      lat: data.coord.lat,
      lon: data.coord.lon,
    },
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    windDirection: data.wind.deg,
    conditions: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    cloudiness: data.clouds.all,
    visibility: data.visibility,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    timezone: data.timezone,
    units,
  };
}

/**
 * Get 5-day forecast
 */
async function getForecast(
  location?: string,
  lat?: number,
  lon?: number,
  units: string = "metric",
) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Weather] OPENWEATHER_API_KEY not configured, returning mock data",
    );
    const mockDays = [];
    for (let i = 0; i < 5; i++) {
      mockDays.push({
        date: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
        tempMin: 15 + Math.random() * 5,
        tempMax: 20 + Math.random() * 10,
        conditions: i % 2 === 0 ? "Sunny" : "Cloudy",
        icon: i % 2 === 0 ? "01d" : "02d",
        humidity: 60 + Math.random() * 20,
      });
    }
    return {
      location: location || `${lat},${lon}`,
      forecast: mockDays,
      units,
      mock: true,
    };
  }

  const query = buildWeatherQuery(location, lat, lon, units);
  const url = `https://api.openweathermap.org/data/2.5/forecast?${query}`;

  const response = await fetch(url);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to fetch forecast data");
  }

  // Group by day and get daily min/max
  const dailyForecasts: any[] = [];
  const days = new Map();

  data.list.forEach((item: any) => {
    const date = item.dt_txt.split(" ")[0];
    if (!days.has(date)) {
      days.set(date, []);
    }
    days.get(date).push(item);
  });

  days.forEach((items, date) => {
    const temps = items.map((i: any) => i.main.temp);
    const middayItem = items[Math.floor(items.length / 2)];

    dailyForecasts.push({
      date,
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      conditions: middayItem.weather[0].main,
      description: middayItem.weather[0].description,
      icon: middayItem.weather[0].icon,
      humidity: middayItem.main.humidity,
      windSpeed: middayItem.wind.speed,
      pop: middayItem.pop * 100, // Probability of precipitation
    });
  });

  return {
    location: data.city.name,
    country: data.city.country,
    forecast: dailyForecasts.slice(0, 5),
    units,
  };
}

/**
 * Get hourly forecast (48 hours)
 */
async function getHourlyForecast(
  location?: string,
  lat?: number,
  lon?: number,
  units: string = "metric",
) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Weather] OPENWEATHER_API_KEY not configured, returning mock data",
    );
    const mockHours = [];
    for (let i = 0; i < 24; i++) {
      mockHours.push({
        time: new Date(Date.now() + i * 3600000).toISOString(),
        temperature: 18 + Math.random() * 8,
        conditions: i % 3 === 0 ? "Clear" : "Cloudy",
        icon: i % 3 === 0 ? "01d" : "02d",
        humidity: 60 + Math.random() * 20,
      });
    }
    return {
      location: location || `${lat},${lon}`,
      hourly: mockHours,
      units,
      mock: true,
    };
  }

  const query = buildWeatherQuery(location, lat, lon, units);
  const url = `https://api.openweathermap.org/data/2.5/forecast?${query}`;

  const response = await fetch(url);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to fetch hourly forecast");
  }

  // OpenWeatherMap returns 3-hour intervals, take first 48 hours (16 items)
  const hourlyForecasts = data.list.slice(0, 16).map((item: any) => ({
    time: item.dt_txt,
    timestamp: item.dt,
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    conditions: item.weather[0].main,
    description: item.weather[0].description,
    icon: item.weather[0].icon,
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
    windDirection: item.wind.deg,
    pop: item.pop * 100, // Probability of precipitation
    cloudiness: item.clouds.all,
  }));

  return {
    location: data.city.name,
    country: data.city.country,
    hourly: hourlyForecasts,
    units,
  };
}
