const axios = require("axios");

class GeocodingService {
  constructor() {
    // Ensure dotenv is loaded
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      require("dotenv").config();
    }
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = "https://maps.googleapis.com/maps/api/geocode/json";
  }

  // Get detailed address from coordinates using Google Geocoding API
  async getCityFromCoordinates(lat, lng) {
    try {
      console.log(`Geocoding coordinates: ${lat}, ${lng}`);
      console.log(
        `Using API key: ${this.googleApiKey ? "Present" : "Missing"}`
      );

      if (!this.googleApiKey) {
        console.log("Google API key not found, using fallback method");
        return this.getFallbackCity(lat, lng);
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.googleApiKey,
          language: "en",
          result_type:
            "street_address|premise|subpremise|establishment|point_of_interest",
          location_type: "ROOFTOP|RANGE_INTERPOLATED|GEOMETRIC_CENTER",
        },
      });

      console.log(`Geocoding API status: ${response.data.status}`);
      console.log(
        `Geocoding API results count: ${response.data.results?.length || 0}`
      );

      if (response.data.status === "OK" && response.data.results.length > 0) {
        const result = response.data.results[0];
        const addressComponents = result.address_components;

        let streetNumber = "";
        let route = "";
        let premise = "";
        let subpremise = "";
        let establishment = "";
        let pointOfInterest = "";
        let locality = "";
        let sublocality1 = "";
        let sublocality2 = "";
        let sublocality3 = "";
        let city = "";
        let state = "";
        let district = "";
        let postalCode = "";
        let country = "";

        // Extract all address components with more detail
        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("premise")) {
            premise = component.long_name;
          } else if (types.includes("subpremise")) {
            subpremise = component.long_name;
          } else if (types.includes("establishment")) {
            establishment = component.long_name;
          } else if (types.includes("point_of_interest")) {
            pointOfInterest = component.long_name;
          } else if (
            types.includes("sublocality_level_1") ||
            types.includes("sublocality")
          ) {
            sublocality1 = component.long_name;
          } else if (types.includes("sublocality_level_2")) {
            sublocality2 = component.long_name;
          } else if (types.includes("sublocality_level_3")) {
            sublocality3 = component.long_name;
          } else if (types.includes("locality")) {
            locality = component.long_name;
          } else if (types.includes("administrative_area_level_2")) {
            district = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
          } else if (types.includes("postal_code")) {
            postalCode = component.long_name;
          } else if (types.includes("country")) {
            country = component.long_name;
          }
        });

        // Build comprehensive street address - extract from the full formatted address
        let streetAddress = "";

        // Try to extract street address from Google's formatted address
        const formattedParts = result.formatted_address.split(", ");
        const streetParts = [];

        // Add premise/building info
        if (premise) streetParts.push(premise);
        if (subpremise) streetParts.push(subpremise);

        // Add street number and route
        if (streetNumber && route) {
          streetParts.push(`${streetNumber} ${route}`);
        } else if (route) {
          streetParts.push(route);
        }

        // Add establishment or point of interest if available
        if (
          establishment &&
          !streetParts.some((part) => part.includes(establishment))
        ) {
          streetParts.push(establishment);
        }
        if (
          pointOfInterest &&
          !streetParts.some((part) => part.includes(pointOfInterest))
        ) {
          streetParts.push(pointOfInterest);
        }

        // If we have street parts, use them
        if (streetParts.length > 0) {
          streetAddress = streetParts.join(", ");
        } else {
          // Extract the first part of Google's formatted address as street address
          const firstPart = formattedParts[0];
          // Check if first part contains numbers or street-like words
          if (
            firstPart &&
            (/\d/.test(firstPart) || // contains numbers
              /road|street|lane|gali|marg|path|colony|nagar|basti/i.test(
                firstPart
              )) // contains street words
          ) {
            streetAddress = firstPart;
          } else {
            // Use sublocality as fallback
            streetAddress = sublocality1 || sublocality2 || sublocality3 || "";
          }
        }

        // Determine city name (prefer locality, fallback to district)
        city = locality || district || "Unknown City";

        // Build comprehensive detailed address - use the full formatted address from Google
        // but also build our own version for cases where we want more control
        let detailedAddress = result.formatted_address; // Use Google's full formatted address

        // Build a custom detailed address as backup
        const customAddressParts = [];

        // Add all street-level details
        if (premise) customAddressParts.push(premise);
        if (subpremise) customAddressParts.push(subpremise);
        if (streetNumber && route) {
          customAddressParts.push(`${streetNumber} ${route}`);
        } else if (route) {
          customAddressParts.push(route);
        }
        if (
          establishment &&
          !customAddressParts.some((part) => part.includes(establishment))
        ) {
          customAddressParts.push(establishment);
        }

        // Add area/neighborhood details
        if (
          sublocality1 &&
          !customAddressParts.some((part) => part.includes(sublocality1))
        ) {
          customAddressParts.push(sublocality1);
        }
        if (
          sublocality2 &&
          !customAddressParts.some((part) => part.includes(sublocality2))
        ) {
          customAddressParts.push(sublocality2);
        }
        if (
          sublocality3 &&
          !customAddressParts.some((part) => part.includes(sublocality3))
        ) {
          customAddressParts.push(sublocality3);
        }

        // Add city, state, postal code, country
        if (city) customAddressParts.push(city);
        if (state) customAddressParts.push(state);
        if (postalCode) customAddressParts.push(postalCode);
        if (country) customAddressParts.push(country);

        const customDetailedAddress = customAddressParts.join(", ");

        // Use the longer/more detailed address
        if (customDetailedAddress.length > detailedAddress.length) {
          detailedAddress = customDetailedAddress;
        }

        return {
          city: city,
          state: state,
          streetAddress: streetAddress,
          premise: premise,
          subpremise: subpremise,
          establishment: establishment,
          pointOfInterest: pointOfInterest,
          sublocality: sublocality1,
          sublocality1: sublocality1,
          sublocality2: sublocality2,
          sublocality3: sublocality3,
          district: district,
          postalCode: postalCode,
          country: country,
          formattedAddress: result.formatted_address,
          detailedAddress: detailedAddress,
          coordinates: {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          },
          source: "google_geocoding",
        };
      }

      throw new Error("No results found for the given coordinates");
    } catch (error) {
      console.error("Geocoding error:", error.message);

      // Fallback: Use a simple coordinate-to-city mapping for major Indian cities
      return this.getFallbackCity(lat, lng);
    }
  }

  // Fallback method with approximate city boundaries for major Indian cities
  getFallbackCity(lat, lng) {
    console.log(`Using fallback geocoding for coordinates: ${lat}, ${lng}`);

    const cityBounds = [
      {
        city: "Mumbai",
        state: "Maharashtra",
        bounds: { north: 19.27, south: 18.89, east: 72.97, west: 72.77 },
      },
      {
        city: "Delhi",
        state: "Delhi",
        bounds: { north: 28.88, south: 28.4, east: 77.35, west: 76.84 },
      },
      {
        city: "Bangalore",
        state: "Karnataka",
        bounds: { north: 13.14, south: 12.83, east: 77.78, west: 77.46 },
      },
      {
        city: "Hyderabad",
        state: "Telangana",
        bounds: { north: 17.56, south: 17.27, east: 78.65, west: 78.25 },
      },
      {
        city: "Chennai",
        state: "Tamil Nadu",
        bounds: { north: 13.23, south: 12.83, east: 80.35, west: 80.12 },
      },
      {
        city: "Kolkata",
        state: "West Bengal",
        bounds: { north: 22.73, south: 22.4, east: 88.51, west: 88.27 },
      },
      {
        city: "Pune",
        state: "Maharashtra",
        bounds: { north: 18.63, south: 18.41, east: 73.99, west: 73.73 },
      },
      {
        city: "Ahmedabad",
        state: "Gujarat",
        bounds: { north: 23.13, south: 22.96, east: 72.68, west: 72.48 },
      },
      {
        city: "Jaipur",
        state: "Rajasthan",
        bounds: { north: 26.95, south: 26.8, east: 75.87, west: 75.73 },
      },
      {
        city: "Udaipur",
        state: "Rajasthan",
        bounds: { north: 24.65, south: 24.52, east: 73.78, west: 73.65 },
      },
      {
        city: "Jodhpur",
        state: "Rajasthan",
        bounds: { north: 26.32, south: 26.2, east: 73.08, west: 72.95 },
      },
      {
        city: "Kota",
        state: "Rajasthan",
        bounds: { north: 25.25, south: 25.15, east: 75.9, west: 75.8 },
      },
    ];

    for (const cityData of cityBounds) {
      const { bounds } = cityData;
      if (
        lat <= bounds.north &&
        lat >= bounds.south &&
        lng <= bounds.east &&
        lng >= bounds.west
      ) {
        console.log(`Found city match: ${cityData.city}, ${cityData.state}`);
        return {
          city: cityData.city,
          state: cityData.state,
          streetAddress: `Coordinates: ${lat}, ${lng}`,
          sublocality: "",
          district: cityData.city,
          postalCode: "",
          country: "India",
          formattedAddress: `${cityData.city}, ${cityData.state}, India`,
          detailedAddress: `Coordinates: ${lat}, ${lng}, ${cityData.city}, ${cityData.state}, India`,
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          source: "fallback",
        };
      }
    }

    // State-level fallback based on coordinate ranges
    const stateInfo = this.getStateFromCoordinates(lat, lng);
    console.log(
      `No city match found, using state-level fallback: ${stateInfo.state}`
    );

    return {
      city: stateInfo.city,
      state: stateInfo.state,
      streetAddress: `Coordinates: ${lat}, ${lng}`,
      sublocality: "",
      district: stateInfo.city,
      postalCode: "",
      country: "India",
      formattedAddress: `${stateInfo.city}, ${stateInfo.state}, India`,
      detailedAddress: `Coordinates: ${lat}, ${lng}, ${stateInfo.city}, ${stateInfo.state}, India`,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      source: "state-fallback",
    };
  }

  // State-level fallback for coordinates
  getStateFromCoordinates(lat, lng) {
    const stateBounds = [
      {
        state: "Rajasthan",
        bounds: { north: 30.12, south: 23.03, east: 78.17, west: 69.3 },
        defaultCity: "Jaipur",
      },
      {
        state: "Maharashtra",
        bounds: { north: 22.03, south: 15.6, east: 80.89, west: 72.66 },
        defaultCity: "Mumbai",
      },
      {
        state: "Gujarat",
        bounds: { north: 24.71, south: 20.06, east: 74.47, west: 68.16 },
        defaultCity: "Ahmedabad",
      },
      {
        state: "Delhi",
        bounds: { north: 28.88, south: 28.4, east: 77.35, west: 76.84 },
        defaultCity: "Delhi",
      },
      {
        state: "Karnataka",
        bounds: { north: 18.45, south: 11.31, east: 78.59, west: 74.05 },
        defaultCity: "Bangalore",
      },
      {
        state: "Tamil Nadu",
        bounds: { north: 13.49, south: 8.07, east: 80.34, west: 76.23 },
        defaultCity: "Chennai",
      },
      {
        state: "West Bengal",
        bounds: { north: 27.13, south: 21.25, east: 89.85, west: 85.82 },
        defaultCity: "Kolkata",
      },
      {
        state: "Telangana",
        bounds: { north: 19.92, south: 15.89, east: 81.78, west: 77.27 },
        defaultCity: "Hyderabad",
      },
    ];

    for (const stateData of stateBounds) {
      const { bounds } = stateData;
      if (
        lat <= bounds.north &&
        lat >= bounds.south &&
        lng <= bounds.east &&
        lng >= bounds.west
      ) {
        return {
          city: stateData.defaultCity,
          state: stateData.state,
        };
      }
    }

    // Final fallback
    return {
      city: "Unknown City",
      state: "Unknown State",
    };
  }

  // Batch geocoding for multiple coordinates
  async batchGeocode(coordinates) {
    const results = [];

    for (const coord of coordinates) {
      try {
        const result = await this.getCityFromCoordinates(coord.lat, coord.lng);
        results.push({ ...coord, ...result });

        // Add delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          ...coord,
          city: "Unknown City",
          state: "Unknown State",
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new GeocodingService();
