let funFacts = [];
let currentFactIndex = 0;
let factInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('itinerary-form');
    const resultsSection = document.getElementById('results-section');
    const itineraryResult = document.getElementById('itinerary-result');
    const errorMessage = document.getElementById('error-message');
    const loadingIndicator = document.getElementById('loading');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate the city name
        const cityInput = document.getElementById('city').value.trim();
        if (!cityInput) {
            errorMessage.textContent = "Please enter a city name";
            errorMessage.style.display = 'block';
            resultsSection.style.display = 'block';
            itineraryResult.style.display = 'none';
            loadingIndicator.style.display = 'none';
            return;
        }
        
        // Format the city name properly - capitalize first letter of each word
        const formattedCity = cityInput.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Show loading state
        resultsSection.style.display = 'block';
        itineraryResult.style.display = 'none';
        errorMessage.style.display = 'none';
        loadingIndicator.style.display = 'block';
        
        // Reset fun facts
        clearInterval(factInterval);
        funFacts = [];
        currentFactIndex = 0;
        document.getElementById('fun-fact').textContent = "Loading interesting facts about " + formattedCity + "...";
        
        // STEP 1: First fetch fun facts
        try {
            await fetchFunFacts(formattedCity);
            
            // STEP 2: Then plan the itinerary
            planItinerary(formattedCity);
        } catch (error) {
            handleError("Error loading fun facts: " + error.message);
        }
    });
    
    function planItinerary(city) {
        // Get form data
        const formData = {
            city: city,
            start_time: document.getElementById('start-time').value,
            end_time: document.getElementById('end-time').value,
            max_pois: document.getElementById('max-pois').value,
            restaurant_count: document.getElementById('restaurant-count').value
        };
        
        // Send API request
        fetch('/api/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Clear fun facts interval
            clearInterval(factInterval);
            
            if (data.success) {
                // Show results
                itineraryResult.textContent = data.itinerary;
                itineraryResult.style.display = 'block';
            } else {
                // Show error
                handleError(data.error);
            }
        })
        .catch(error => {
            handleError("Network error: " + error.message);
        });
    }
    
    function handleError(message) {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Clear fun facts interval
        clearInterval(factInterval);
        
        // Show error
        errorMessage.textContent = `Error: ${message}`;
        errorMessage.style.display = 'block';
    }
});

// Fetch fun facts and return a promise
function fetchFunFacts(city) {
    return new Promise((resolve, reject) => {
        fetch('/api/fun-facts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ city: city }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.fun_facts && data.fun_facts.length > 0) {
                funFacts = data.fun_facts;
                
                // Display the first fact immediately
                displayNextFact();
                
                // Set up interval to change facts every 20 seconds
                clearInterval(factInterval);
                factInterval = setInterval(displayNextFact, 20000);
                
                resolve();
            } else {
                // If no fun facts were returned, still proceed but with a default message
                funFacts = ["Did you know? Facts about this city are being generated just for you!"];
                displayNextFact();
                resolve();
            }
        })
        .catch(error => {
            console.error('Error fetching fun facts:', error);
            // Don't reject, just proceed with planning
            resolve();
        });
    });
}

function displayNextFact() {
    if (funFacts.length > 0) {
        const funFactElement = document.getElementById('fun-fact');
        
        // Add fade-out effect
        funFactElement.classList.remove('fade-in');
        funFactElement.classList.add('fade-out');
        
        // Wait for fade-out to complete
        setTimeout(() => {
            // Update text
            funFactElement.textContent = funFacts[currentFactIndex];
            
            // Switch to fade-in
            funFactElement.classList.remove('fade-out');
            funFactElement.classList.add('fade-in');
            
            // Update index for next time
            currentFactIndex = (currentFactIndex + 1) % funFacts.length;
        }, 500);
    }
}