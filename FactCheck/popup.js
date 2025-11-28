document.addEventListener('DOMContentLoaded', initializePopup);

// Function to handle the initial setup and state checking
function initializePopup() {
    // Get references to all dynamic elements
    const statusMessage = document.getElementById('statusMessage');
    const loadingState = document.getElementById('loadingState');
    const resultsContainer = document.getElementById('resultsContainer');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const scoreText = document.getElementById('scoreText');
    const claimSummary = document.getElementById('claimSummary');
    const selectedTextDisplay = document.getElementById('selectedTextDisplay');
    const sourcesList = document.getElementById('sourcesList');
    const recheckButton = document.getElementById('recheckButton');

    // Add recheck button functionality (closes the popup and prompts user to select new text)
    recheckButton.addEventListener('click', () => {
        window.close();
        // Optionally, could send a message to the background script to clear state,
        // but simply closing and relying on the context menu trigger is sufficient for now.
    });

    // 1. Retrieve the latest analysis state from the background script
    chrome.storage.local.get(['lastSelectedText', 'analysisResult', 'isAnalyzing'], (data) => {
        const { lastSelectedText, analysisResult, isAnalyzing } = data;
        
        // Hide all major sections first
        statusMessage.classList.add('hidden');
        loadingState.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        recheckButton.classList.add('hidden');

        if (isAnalyzing) {
            // State 1: Analysis is running
            loadingState.classList.remove('hidden');
            recheckButton.classList.remove('hidden');
        } else if (analysisResult) {
            // State 2: Analysis is complete and results are available
            displayResults(lastSelectedText, analysisResult);
            resultsContainer.classList.remove('hidden');
            recheckButton.classList.remove('hidden');
        } else {
            // State 3: No action taken yet
            statusMessage.classList.remove('hidden');
        }
    });

    // Function to handle the visual display of the results
    function displayResults(text, result) {
        selectedTextDisplay.textContent = text;
        
        // If the result contains an error or is unverified
        if (!result.reliability_score || result.reliability_score === 0) {
            // Display unverified/error state
            scoreDisplay.textContent = '❓';
            scoreDisplay.style.background = `conic-gradient(#FFC107 0%, #ddd 0%)`;
            claimSummary.textContent = result.summary || "The service could not verify this claim based on immediate search results.";
            scoreText.textContent = '--';
            scoreDisplay.classList.remove('score-ring'); // Remove score-specific styling if we use a character icon
            scoreDisplay.classList.add('bg-yellow-100', 'text-4xl', 'p-4', 'rounded-full');
        } else {
            // Display verified score
            const score = result.reliability_score;
            scoreText.textContent = `${score}%`;
            
            // Set ring color based on score (Green > 70, Yellow > 40, Red < 40)
            let color;
            if (score > 70) color = '#4CAF50'; // Green
            else if (score > 40) color = '#FFC107'; // Yellow
            else color = '#F44336'; // Red

            // Update the CSS conic-gradient for the radial progress effect
            scoreDisplay.style.background = `conic-gradient(${color} ${score}%, #ddd ${score}%)`;
            
            // Ensure score text is inside the ring div
            scoreDisplay.appendChild(scoreText); 
            
            claimSummary.textContent = result.summary;
        }

        // Clear and populate sources list
        sourcesList.innerHTML = '';
        if (result.sources && result.sources.length > 0) {
            result.sources.forEach(source => {
                const li = document.createElement('li');
                li.className = 'flex items-start text-sm';
                li.innerHTML = `
                    <span class="text-blue-500 mr-2">🔗</span>
                    <a href="${source.url}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors leading-tight">
                        ${source.title} 
                        <span class="text-gray-400 text-xs block truncate" style="max-width: 200px;">(${source.url})</span>
                    </a>
                `;
                sourcesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'text-sm text-gray-500 italic';
            li.textContent = 'No specific sources were cited for this summary.';
            sourcesList.appendChild(li);
        }
    }
}