(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

// 🚆 Fetch Suggestions for Railway Stations
async function fetchSuggestions(query, suggestionListId) {
  if (!query) {
    document.getElementById(suggestionListId).innerHTML = "";
    return;
  }

  try {
    const response = await fetch(
      `https://api.railyatri.in/api/common_city_station_search.json?q=${query}&user_id=-174240357`
    );
    const data = await response.json();

    if (data.success) {
      const suggestions = data.items;
      const suggestionList = document.getElementById(suggestionListId);
      suggestionList.innerHTML = "";

      suggestions.forEach((station) => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.textContent = `${station.station_name} (${station.station_code}) - ${station.state_name}`;
        li.onclick = () => {
          document.getElementById(
            suggestionListId === "fromStationSuggestions"
              ? "fromStation"
              : "toStation"
          ).value = station.station_code;
          suggestionList.innerHTML = ""; // Clear suggestions after selection
        };
        suggestionList.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error fetching station suggestions:", error);
  }
}

// 🗺️ Fetch Suggestions for Cities (Mapbox)
const MAPBOX_API_TOKEN =
  "pk.eyJ1IjoibWFuZ2VzaDE2MzUiLCJhIjoiY205MzJ0YThlMDkwajJrc2M4ODNzZ3FwZSJ9.koFFbt4SVnWANUJ3yMPGBw"; // Replace with your token

function fetchCitySuggestions(query, targetDiv, inputElement) {
  if (!query) {
    targetDiv.innerHTML = "";
    return;
  }

  fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_API_TOKEN}&types=place&country=IN`
  )
    .then((res) => res.json())
    .then((data) => {
      targetDiv.innerHTML = "";
      data.features.forEach((place) => {
        const div = document.createElement("div");
        div.classList.add("suggestion-item");
        div.textContent = place.text;

        div.onclick = () => {
          inputElement.value = place.text;
          targetDiv.innerHTML = "";
        };

        targetDiv.appendChild(div);
      });
    })
    .catch((err) => {
      console.error("Error fetching city suggestions:", err);
    });
}

// 🚀 Debounce Function to Reduce API Calls
function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// 🌍 City Suggestions (Mapbox)
const sourceInput = document.getElementById("source");
const destinationInput = document.getElementById("destination");
const sourceSuggestions = document.getElementById("source-suggestions");
const destinationSuggestions = document.getElementById("destination-suggestions");

sourceInput?.addEventListener(
  "input",
  debounce(() => fetchCitySuggestions(sourceInput.value, sourceSuggestions, sourceInput))
);
destinationInput?.addEventListener(
  "input",
  debounce(() => fetchCitySuggestions(destinationInput.value, destinationSuggestions, destinationInput))
);

// 🏨 Hotel / General Location Input (Mapbox)
const locationInput = document.getElementById("location");
const locationSuggestions = document.getElementById("location-suggestions");

locationInput?.addEventListener(
  "input",
  debounce(() => fetchCitySuggestions(locationInput.value, locationSuggestions, locationInput))
);

// 🏨 Hotel form - location input for autocomplete
const hotelLocationInput = document.getElementById("hotel-location");
const hotelLocationSuggestions = document.getElementById("hotel-location-suggestions");

hotelLocationInput?.addEventListener(
  "input",
  debounce(() =>
    fetchCitySuggestions(hotelLocationInput.value, hotelLocationSuggestions, hotelLocationInput)
  )
);

//edit hotel
const edithotelLocationInput = document.getElementById("hotel-location");
const edithotelLocationSuggestions = document.getElementById("hotel-location-suggestions");

edithotelLocationInput?.addEventListener("input", debounce(() => {
  fetchCitySuggestions(edithotelLocationInput.value, edithotelLocationSuggestions, edithotelLocationInput);
}));

//new bus
const busSourceInput = document.getElementById("bus-source");
const busDestinationInput = document.getElementById("bus-destination");
const busSourceSuggestions = document.getElementById("bus-source-suggestions");
const busDestinationSuggestions = document.getElementById("bus-destination-suggestions");

busSourceInput?.addEventListener("input", debounce(() => {
  fetchCitySuggestions(busSourceInput.value, busSourceSuggestions, busSourceInput);
}));

busDestinationInput?.addEventListener("input", debounce(() => {
  fetchCitySuggestions(busDestinationInput.value, busDestinationSuggestions, busDestinationInput);
}));

//edit bus
const editbusSourceInput = document.getElementById("bus-source");
const editbusDestinationInput = document.getElementById("bus-destination");
const editbusSourceSuggestions = document.getElementById("bus-source-suggestions");
const editbusDestinationSuggestions = document.getElementById("bus-destination-suggestions");

editbusSourceInput?.addEventListener("input", debounce(() => {
  fetchCitySuggestions(editbusSourceInput.value, editbusSourceSuggestions, editbusSourceInput);
}));

editbusDestinationInput?.addEventListener("input", debounce(() => {
  fetchCitySuggestions(editbusDestinationInput.value, editbusDestinationSuggestions, editbusDestinationInput);
}));


// show hotel map

if (typeof hotelData !== "undefined" && hotelData.geometry && hotelData.geometry.coordinates) {
  mapboxgl.accessToken = 'pk.eyJ1IjoibWFuZ2VzaDE2MzUiLCJhIjoiY205MzJ0YThlMDkwajJrc2M4ODNzZ3FwZSJ9.koFFbt4SVnWANUJ3yMPGBw';

  const [lng, lat] = hotelData.geometry.coordinates;

  const map = new mapboxgl.Map({
    container: 'hotel-map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [lng, lat],
    zoom: 12
  });

  new mapboxgl.Marker()
    .setLngLat([lng, lat])
    .setPopup(new mapboxgl.Popup().setHTML(`<h6>${hotelData.name}</h6>`))
    .addTo(map);
}


