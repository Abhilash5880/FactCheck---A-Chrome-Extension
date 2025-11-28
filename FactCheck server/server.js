// FactCheck server/server.js

// 1. Setup Environment and Dependencies
require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');

const app = express();
const router = express.Router();
const port = 3000;

// --- API Key Initialization ---
if (!process.env.GEMINI_API_KEY) {
    // This will stop the server if the key is missing from .env
    throw new Error("GEMINI_API_KEY not found. Please set it in your .env file.");
}

// Initialize the Gemini AI client using the API Key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// 2. Middleware
// Allow JSON body parsing for incoming requests
app.use(express.json());

// Enable CORS for all origins, which is necessary for the Chrome extension to talk to localhost
app.use(cors());

// --- /fact-check Route Implementation ---
router.post('/fact-check', async (req, res) => {
    // The selected text is expected to be in the request body
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided for fact-checking." });
    }

    // This is the prompt that instructs the AI on its task
    // Note: The prompt also asks the model to "Search for reliable sources," 
    // but without an explicit Search Tool enabled, the model will simulate this
    // using its internal knowledge and training data.
    const prompt = `Analyze the following user-selected text for factual accuracy, bias, and context. Search for reliable sources to verify the core claim. Your output MUST be in a valid JSON format following the provided schema. The text to analyze is: "${text}"`;

    try {
        // --- Corrected Gemini API Call (Fixes the Tool Use Error) ---
        const response = await ai.models.generateContent({
            // 1. Use the model that supports JSON schema (gemini-2.5-flash is preferred)
            model: "gemini-2.5-flash", 
            
            // 2. Pass the prompt as contents
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            
            // 3. Define the configuration for JSON output
            config: {
                // Set the MIME type for structured JSON output
                responseMimeType: "application/json",
                
                // Define the required JSON structure (schema)
                responseSchema: {
                    type: "object",
                    properties: {
                        score: { 
                            type: "number", 
                            description: "The confidence score from 0 to 100, where 100 is fully verifiable/true and 0 is false/unsupported." 
                        },
                        summary: { 
                            type: "string", 
                            description: "A one-sentence, unbiased summary of the fact-check result." 
                        },
                        sources: { 
                            type: "array", 
                            items: { 
                                type: "string", 
                                description: "A highly trusted URL found via a search tool that verifies or contradicts the claim." 
                            },
                            description: "A list of at least two URLs from trusted sources."
                        },
                    },
                    required: ["score", "summary", "sources"],
                },
            },
        });
        // --- End of Corrected Gemini API Call ---
        
        // Extract the raw text response (which should be a JSON string)
        const rawResponseText = response.text.trim();
        
        // Attempt to parse the JSON string
        let factCheckResult;
        try {
            // Note: The model sometimes includes markdown fences (```json...```)
            // We strip them for clean parsing if they are present.
            const jsonString = rawResponseText
                .replace(/^```json\s*/, '')
                .replace(/\s*```$/, '');
                
            factCheckResult = JSON.parse(jsonString);
            
            // Send the parsed JSON back to the extension
            return res.json(factCheckResult);

        } catch (parseError) {
            console.error("Failed to parse JSON response from Gemini:", rawResponseText);
            // If parsing fails, return a 500 error with the raw text for debugging
            return res.status(500).json({ 
                error: "Internal server error during AI analysis.", 
                details: "AI returned malformed JSON.",
                raw_ai_response: rawResponseText
            });
        }

    } catch (error) {
        console.error("Gemini API or Proxy error:", error.message);
        // Send a 500 error back to the extension with the underlying API error details
        return res.status(500).json({ 
            error: "Internal server error during AI analysis.", 
            details: error.message 
        });
    }
});

// 4. Start the Server
app.use('/', router); // Use the router for all routes

app.listen(port, () => {
    console.log(`Fact-Checker Proxy running on http://localhost:${port}`);
});