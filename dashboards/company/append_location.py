
// ----------------------------------------------------
// SMART LOCATION AUTOCOMPLETE LOGIC
// ----------------------------------------------------

const locationDatabase = {
  "India": {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Navi Mumbai"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "Dwarka"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida", "Ghaziabad"]
  },
  "United States": {
    "California": ["San Francisco", "Los Angeles", "San Diego", "San Jose"],
    "New York": ["New York City", "Buffalo", "Rochester"],
    "Texas": ["Austin", "Houston", "Dallas", "San Antonio"],
    "Washington": ["Seattle", "Bellevue", "Redmond"]
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham", "Bristol"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"]
  },
  "Canada": {
    "Ontario": ["Toronto", "Ottawa", "Waterloo", "Mississauga"],
    "British Columbia": ["Vancouver", "Victoria", "Surrey"],
    "Quebec": ["Montreal", "Quebec City"]
  }
};

function initLocationAutocomplete() {
  const countrySelect = document.getElementById('pj-country');
  const stateInput = document.getElementById('pj-state');
  const cityInput = document.getElementById('pj-city');
  const stateDatalist = document.getElementById('state-datalist');
  const cityDatalist = document.getElementById('city-datalist');

  if (!countrySelect || !stateInput || !cityInput || !stateDatalist || !cityDatalist) return;

  function populateStates() {
    const country = countrySelect.value;
    stateDatalist.innerHTML = '';
    cityDatalist.innerHTML = '';
    if (locationDatabase[country]) {
      Object.keys(locationDatabase[country]).forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        stateDatalist.appendChild(option);
      });
    }
  }

  function populateCities() {
    const country = countrySelect.value;
    const state = stateInput.value;
    cityDatalist.innerHTML = '';
    if (locationDatabase[country] && locationDatabase[country][state]) {
      locationDatabase[country][state].forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        cityDatalist.appendChild(option);
      });
    }
  }

  // Event Listeners
  countrySelect.addEventListener('change', () => {
    stateInput.value = '';
    cityInput.value = '';
    populateStates();
  });

  stateInput.addEventListener('input', () => {
    cityInput.value = '';
    populateCities();
  });

  // Initial population
  populateStates();
}

// Attach listener
document.addEventListener('DOMContentLoaded', () => {
  // Give a small delay to ensure DOM is fully ready
  setTimeout(initLocationAutocomplete, 200);
});
