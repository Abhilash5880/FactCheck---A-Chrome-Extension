# 🔍 AI Fact-Checker Chrome Extension

A browser extension designed to instantly analyze selected text on any webpage for factual reliability, categorize claims (True, Opinion, False/Unverified), and provide verification sources using a custom proxy powered by large language models (LLMs).

## ✨ Features

* **Contextual Analysis:** Right-click any selected text on a webpage to initiate the fact-check.
* **Reliability Score:** Provides a numerical score (0-100%) indicating the verification status of the claim.
* **Detailed Review:** Displays a structured, bulleted summary categorizing the claim into **True**, **Opinion**, or **False/Unverified** with explanations.
* **Source Citation:** Lists the sources used by the AI model to ground its analysis.
* **Proxy Backend:** Uses a secure Node.js proxy to communicate with powerful LLM APIs (e.g., Hugging Face or Gemini), keeping API keys secure on the server.

## 🛠️ Project Structure

This project is split into three main components:

1.  **Extension (`/` directory):** Contains the frontend logic (`popup.js`, `background.js`, `popup.html`, `manifest.json`).
2.  **Proxy Server (`/` directory):** Contains the Node.js server (`server.js`) that handles API calls to the LLM.
3.  **Environment (`.env`):** Used to securely store your API key.

### Key Files

| File | Component | Description |
| :--- | :--- | :--- |
| `background.js` | Extension Logic | Manages the context menu creation and sends the selected text to the `server.js` proxy. |
| `popup.js` | Extension Frontend | Handles the display of the **reliability score**, **formatted summary**, and **sources** within the popup window. |
| `server.js` | Proxy Server | **CRITICAL:** The Node.js server that receives the claim and calls the Hugging Face Inference API. |
| `.env` | Configuration | Stores the secret `GEMINI_API_KEY`. |

## 🚀 Installation & Setup

### Prerequisites

1.  **Node.js:** Must be installed to run the proxy server (`server.js`).
2.  **Gemini API Key:** A valid key is required for the LLM inference endpoint.

### Step 1: Clone the Repository

```bash
git clone <YOUR_REPO_URL>
cd ai-fact-checker
