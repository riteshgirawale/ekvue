# 🤖 AI Resume Analyzer Modular Component Folder

Welcome to the isolated folder for the **AI Resume Analyzer & Deterministic ATS Scoring** component! 

We created this folder to move all relevant layouts, styles, drag-and-drop file readers, hashing algorithms, and dynamic DOM injection code into one single, clean place for your complete understanding.

---

## 📂 Folder Contents
This folder contains the following isolated resources:
```
resume-analyzer/
├── readme.md               <-- [THIS FILE] Explaining the structure & concepts
├── resume-analyzer.css     <-- CSS file for dropzones, spinners, and badges
└── resume-analyzer.js      <-- JavaScript module with dynamic DOM builders & listeners
```

---

## ⚙️ How the Module Works

### 1. Dynamic CSS Style Injection
To keep pages completely clean, the Javascript module `resume-analyzer.js` automatically self-injects its own stylesheet (`resume-analyzer.css`) relative to its file path using standard Web URLs:
```javascript
const cssUrl = new URL('./resume-analyzer.css', import.meta.url).href;
if (!document.querySelector(`link[href="${cssUrl}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
}
```
This guarantees that whenever you import `resume-analyzer.js`, the styles are loaded automatically without cluttering the page’s `<head>`.

### 2. Universal Setup Interface
To load the analyzer widget in any section of your website, simply load the script as an ES Module and call:
```javascript
import { setupResumeAnalyzer } from './resume-analyzer/resume-analyzer.js';
setupResumeAnalyzer('target-container-id');
```
This dynamically injects the HTML layout (the upload drag-drop zone on the left, and the AI results timeline card on the right) and attaches all necessary events to the container elements!

### 3. Deterministic Checklist Scoring (DJB2 Checksum Hashing)
To satisfy the requirement—**"make sure same resume gives same recommended company and ats score"**—we use a standard **DJB2 checksum hash algorithm** to map file contents persistently:
```javascript
export function computeChecksum(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}
```
*   When a `.txt` file is uploaded, the script parses the text content.
*   When binary files like `.pdf` or `.docx` are uploaded, the script uses the file's metadata string (`name_size_type`).
*   This yields a unique hash value.
*   Using this hash value, the ATS score and selected recommended companies are **strictly consistent**. **Re-uploading the exact same file will ALWAYS yield the exact same score and matches!**

---

## 🚀 Shared Integrations Across the Website

### A. Landing Page Integration (`/index.html`)
The landing page includes the workspace target and instantiates the analyzer:
```html
<!-- HTML Container -->
<div id="landing-analyzer-workspace"></div>

<!-- Module Script -->
<script type="module">
  import { setupResumeAnalyzer } from './resume-analyzer/resume-analyzer.js';
  setupResumeAnalyzer('landing-analyzer-workspace');
</script>
```

### B. Student Dashboard Integration (`/dashboards/candidate/`)
*   **HTML View Container**: Housed inside `#view-resume-analyzer` in `candidate.html`.
*   **JS Router Binder**: Inside `candidate.js`, the module is imported and initialized:
    ```javascript
    import { setupResumeAnalyzer } from '../../resume-analyzer/resume-analyzer.js';
    
    function initResumeAnalyzer() {
      setupResumeAnalyzer('dashboard-analyzer-workspace');
    }
    ```
