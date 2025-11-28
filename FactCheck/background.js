// --- IMPORTANT: DEFINE YOUR PROXY ENDPOINT HERE ---
const PROXY_ENDPOINT = "https://[YOUR_PROXY_ENDPOINT]/fact-check"; 
const FACT_CHECK_MENU_ID = "aiFactCheck";

// 1. Create the context menu item when the extension is installed/updated.
chrome.runtime.onInstalled.addListener(() => {
    // Ensure cleanup of any old item before creation
    chrome.contextMenus.remove(FACT_CHECK_MENU_ID, () => {
        chrome.contextMenus.create({
            id: FACT_CHECK_MENU_ID,
            title: "Fact-Check Selected Text",
            contexts: ["selection"]
        });
    });
});

// 2. Listen for a click on our fact-check menu item.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === FACT_CHECK_MENU_ID && info.selectionText) {
        const selectedText = info.selectionText.trim();
        const tabId = tab.id;

        // CRITICAL: Set initial state in storage for the popup to show "Analyzing..."
        await chrome.storage.local.set({ 
            lastSelectedText: selectedText,
            analysisResult: null, 
            isAnalyzing: true     
        });

        // Set the badge icon to indicate analysis is in progress
        chrome.action.setBadgeText({ text: "...", tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: "#FF9800", tabId: tabId }); // Amber/Orange

        // Start the AI analysis via the proxy
        try {
            await runAIAnalysis(selectedText, tabId);
        } catch (error) {
            console.error("AI Analysis failed (Proxy/Network Error):", error);
            
            const errorResult = { 
                reliability_score: 0,
                summary: "Could not connect to the fact-checking service. Please check your internet connection or try again later.",
                sources: [] 
            };
            
            // Update error state
            await chrome.storage.local.set({ 
                analysisResult: errorResult,
                isAnalyzing: false 
            });
            chrome.action.setBadgeText({ text: "ERR", tabId: tabId });
            chrome.action.setBadgeBackgroundColor({ color: "#F44336", tabId: tabId }); // Red
        }
    }
});

// 3. Core function to call the dedicated Proxy Backend
async function runAIAnalysis(text, tabId) {
    console.log(`Sending text to proxy for analysis: "${text.substring(0, 50)}..."`);
    
    const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            // Send the key information the server needs
            text: text 
        })
    });

    if (!response.ok) {
        // If the server returns a 4xx or 5xx error
        const errorBody = await response.text();
        throw new Error(`Proxy service failed: ${response.status} ${response.statusText}. Details: ${errorBody.substring(0, 100)}`);
    }

    // Expect the server to return the standardized JSON payload
    const result = await response.json();

    // CRITICAL: Save the final result and update the state for the popup
    await chrome.storage.local.set({ 
        analysisResult: result,
        isAnalyzing: false 
    });

    // Update the badge to indicate success 
    // (We can use the score to determine the color if desired, but for now, simple green)
    chrome.action.setBadgeText({ text: "✓", tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId: tabId }); // Green
    
    // Optional: Programmatically open the popup after successful analysis
    // This provides immediate feedback to the user.
    chrome.action.openPopup(); 
}