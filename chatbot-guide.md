# 🤖 EkVue Help Assistant Chatbot System Guide

Welcome to the **EkVue Global Help Assistant Chatbot** documentation! To help you understand and manage the chatbot easily, we have modularized the system into two clean, separate files:

1. **`chatbot-database.js`**: Contains the knowledge database, intent keywords, and support answer texts.
2. **`help-chatbot.js`**: Contains the user interface (styles, floating buttons, chat widget, message timeline, typing animations, and scroll behaviors).

---

## 📂 Chatbot File Structure

The chatbot resides in the root directory:
```
ekvue/
├── chatbot-database.js  <-- [NEW] Holds all Q&A support contents
├── help-chatbot.js      <-- [UPDATED] Holds UI layout, HTML injection, and animations
```

---

## 📑 1. `chatbot-database.js` (The Knowledge Database)
This file is the "brain" of the chatbot. It holds the `SUPPORT_DATABASE` array of Q&A topics and exports the matching logic.

### 🌟 How to Add a New Question & Answer
To support a new question (e.g. *"how do I reset my password"*), simply open `chatbot-database.js` and add a new block at the bottom of the `SUPPORT_DATABASE` array:

```javascript
{
  keywords: ['reset password', 'change password', 'forgot password', 'password help'],
  answer: `<strong>🔑 How to Reset Your Password:</strong><br><br>
  If you have forgotten your password or want to change it, follow these steps:<br>
  1. Click <strong>Log out</strong> in your current dashboard.<br>
  2. Go to the login panel at <code>/login/index.html</code>.<br>
  3. Enter your email and click the <em>"Forgot Password"</em> link to reset it.`
}
```

### 🔍 How Keyword Matching Works
The matching logic inside `chatbot-database.js` runs an advanced two-tier search routing engine:

1. **Direct Phrase Search**: It first scans all topics to see if the user's typed phrase contains any pre-defined keyword string (e.g. `"recommended problems"` matches `"recommended"`). If yes, it instantly returns the answer.
2. **Smart Fuzzy Word Matching (Multi-Keyword Scoring)**: If no direct match is found, it splits the query into individual words, filters out standard stop words (like *"how"*, *"to"*, *"does"*, *"the"*, *"about"*, *"site"*), and scores each database entry:
   - **+3 Points**: For each query word that matches or is close to a pre-defined topic keyword.
   - **+1 Point**: For each query word that exists inside the actual body text of the answer.
   
It then dynamically returns the highest-scoring topic. This guarantees that if a user types **any** word related to any feature on your site (even complex ones like *"Kadane"*, *"ticks"*, *"chevrons"*, *"pdf"*, or *"recommended"*), the bot will understand the context and return the exact matching answer!

Here is how the algorithm is structured:
```javascript
export function findAnswer(query) {
  const normalized = query.toLowerCase();
  
  // 1. Direct Phrase Search
  for (const item of SUPPORT_DATABASE) {
    if (item.keywords.some(kw => normalized.includes(kw))) {
      return item.answer;
    }
  }
  
  // 2. Smart Fuzzy Word Matching (Stop Words + Scoring)
  const stopWords = new Set(['how', 'to', 'do', 'does', 'is', 'are', 'the', 'a', ...]);
  const queryWords = normalized
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
    
  // Scores entries based on keyword matches (+3) and answer occurrences (+1)
  // and dynamically redirects to the highest scoring topic!
  ...
}
```

---

## 🎨 2. `help-chatbot.js` (The Visual User Interface)
This file is responsible for drawing the chatbot on the page. It imports the database logic using ES Modules:

```javascript
import { findAnswer } from './chatbot-database.js';
```

### 💫 Glowing Gradient Design
The UI uses glassmorphism and modern gradient shadows:
*   **Floating Button (`#ekvue-help-bot-trigger`)**: A perfect round circle with a linear-gradient background from `#6366f1` (indigo) to `#4f46e5`. Hovering zooms and rotates the button slightly to feel responsive and alive.
*   **Chat Window (`#ekvue-help-bot-window`)**: Uses a dark theme (`rgba(10, 15, 30, 0.95)`) with a `backdrop-filter: blur(20px)` glass effect and glowing borders.
*   **Typing Indicator (`.typing-indicator`)**: Standard 3-dot animation simulating writing activity when messages are sent.

### 🏷️ Modifying Suggested Quick Chips
To update the clickable shortcut chips displayed at the top of the chat window, open `help-chatbot.js` and edit the HTML template in the `.help-bot-chips-wrapper` section:

```html
<div class="help-bot-chips-wrapper">
  <!-- The data-q attribute is what is searched in the database when clicked -->
  <div class="help-bot-chip" data-q="AI Resume Analyzer">🤖 AI Resume Check</div>
  <div class="help-bot-chip" data-q="Recommended problems">🎯 Recommended Problems</div>
  <div class="help-bot-chip" data-q="Dashboard navigation">🖥️ Dashboard Nav</div>
  ...
</div>
```

---

## 🚀 How the Chatbot Auto-Loads Everywhere
We use standard **ES Module relative path resolution** to load the chatbot automatically across all subdirectories with zero manual HTML setup!

1.  **Global Import**: In [dashboards/utils.js](file:///c:/Users/DELL/Downloads/Create_a_Website/ekvue/dashboards/utils.js), we import the chatbot at the very top:
    ```javascript
    import '../help-chatbot.js';
    ```
2.  **Dashboard Inheritance**: Since the Candidate, Recruiter, and Interviewer dashboards import `utils.js` for their data operations, the chatbot is automatically injected on all dashboard pages!
3.  **Static Pages**: Standard HTML files load the script at the bottom of their body:
    ```html
    <script src="help-chatbot.js?v=1.0.4" type="module"></script>
    ```

Because of relative path resolution, when `/dashboards/candidate/candidate.html` loads `help-chatbot.js`, the browser resolves the module relative to `help-chatbot.js` itself. This means `./chatbot-database.js` resolves to `/chatbot-database.js` in the root folder, keeping all database records synchronized globally across all dashboards!
