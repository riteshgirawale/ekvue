/**
 * EKVUE CHATBOT KNOWLEDGE DATABASE
 * This file contains all the categorized support topics, keywords, and answers
 * for the EkVue Global System Assistant.
 * 
 * To add a new question/answer, simply append a new object to the SUPPORT_DATABASE array:
 * {
 *   keywords: ['keyword1', 'keyword2', ...],
 *   answer: `HTML formatted response...`
 * }
 */

export const SUPPORT_DATABASE = [
  {
    keywords: ['create student', 'create candidate', 'add student', 'add candidate', 'register student', 'register candidate', 'signup student', 'signup candidate', 'how to create student', 'new student'],
    answer: `<strong>👨‍🎓 How to Create a Student / Candidate:</strong><br><br>
    To register a new Student (Candidate) account, follow these simple steps:<br><br>
    1. Navigate to the <strong>Get Started</strong> page or go directly to the signup screen: <code>/login/signup.html</code>.<br>
    2. At the top of the registration panel, click the <strong>Candidate</strong> tab (under the role selector).<br>
    3. Enter your full name, email address, password, and click the <strong>Create Account</strong> button.<br>
    4. Upon successful registration, you will be automatically logged in and redirected directly to your **Candidate Dashboard** (<code>/dashboards/candidate/candidate.html</code>) where you can solve problems, flip flashcards, and join live interviews.`
  },
  {
    keywords: ['create company', 'create recruiter', 'add company', 'add recruiter', 'register company', 'register recruiter', 'signup company', 'signup recruiter', 'how to create company', 'new company'],
    answer: `<strong>🏢 How to Create a Company / Recruiter:</strong><br><br>
    To register a new Recruiter or Company Workspace, follow these steps:<br><br>
    1. Navigate to the signup screen: <code>/login/signup.html</code>.<br>
    2. Click the <strong>Company</strong> tab in the role selector.<br>
    3. Fill in your name, work email address, secure password, company name, company website (e.g. <code>https://mycompany.com</code>), and select your team size (e.g. 11-50).<br>
    4. Click the <strong>Create Account</strong> button to activate your workspace. You will land on the **Company Recruiter Dashboard** (<code>/dashboards/company/company.html</code>) to start managing pipelines and booking candidate assessments.`
  },
  {
    keywords: ['create interviewer', 'add interviewer', 'register interviewer', 'signup interviewer', 'how to create interviewer', 'new interviewer'],
    answer: `<strong>🎙️ How to Create & Register an Interviewer:</strong><br><br>
    Interviewers are not registered through the public signup screen. Instead, they are created by recruiters:<br><br>
    1. Log in to a <strong>Company Recruiter</strong> account.<br>
    2. Navigate to the <strong>Team Registry</strong> tab in the sidebar.<br>
    3. Under the <em>"Register New Interviewer"</em> form, enter the interviewer's full name, corporate email address, password, role title (e.g. <em>Lead Engineer</em>), and department (e.g. <em>Frontend</em>).<br>
    4. Click the <strong>Add Team Member</strong> button. This writes their credentials to the shared database so they can log in as an Interviewer at <code>/login/index.html</code> and conduct live code sessions!`
  },
  {
    keywords: ['sync', 'laptop', 'online', 'connect', 'relayer', 'network', 'separate', 'wifi', 'ip', 'piesocket', 'itty'],
    answer: `<strong>🌐 How Multi-Laptop Real-Time Sync Works:</strong><br><br>
    EkVue features a built-in global **PieSocket WebSocket relay bridge** that keeps databases in sync across separate laptops over the internet with zero setup!<br><br>
    <strong>How to connect 2 laptops over Wi-Fi (LAN):</strong><br>
    1. Connect both laptops to the **same Wi-Fi router**.<br>
    2. On **Laptop 1** (Interviewer), run VS Code Live Server and find your local IP address in Command Prompt using <code>ipconfig</code> (e.g., <code>192.168.1.15</code>).<br>
    3. On **Laptop 1**, open your browser to <code>http://localhost:5500/index.html</code>. Start live room.<br>
    4. On **Laptop 2** (Candidate), navigate to Laptop 1's IP: <code>http://192.168.1.15:5500/index.html</code>.<br>
    5. Log in as a Candidate on Laptop 2, and the Join invitation banner will pop up instantly over the socket relayer!<br><br>
    <em>Alternatively, deploy the folder for free on Vercel or Netlify in 10s by drag-dropping for instant global HTTPS testing!</em>`
  },
  {
    keywords: ['camera', 'webcam', 'cam', 'video', 'permit', 'block', 'allow', 'permissions', 'not turning on', 'turning on', 'camera issues'],
    answer: `<strong>📷 Troubleshooting Camera & Webcam Issues:</strong><br><br>
    If your webcam is not turning on or permissions are denied, follow these quick diagnostic steps:<br><br>
    1. <strong>Verify Secure Context (HTTPS):</strong> Modern browsers strictly block camera access on insecure HTTP environments. Make sure you access the site via <code>http://localhost</code>, <code>http://127.0.0.1</code>, or a secure <code>https://</code> address. Accessing via raw network IPs (like <code>http://192.168.x.x</code>) without SSL will fail!<br>
    2. <strong>Browser Permissions Panel:</strong> Click the 🔒 lock icon (or settings slider) on the left side of your browser's address bar. Make sure **Camera** and **Microphone** permissions are set to **Allow**.<br>
    3. <strong>App / Tab conflicts:</strong> Ensure no other active apps (Zoom, MS Teams, Skype) or browser tabs are currently capturing your camera stream.<br>
    4. <strong>Reset Site Settings:</strong> If issues persist, reset permissions in browser preferences, reload, and click **Allow** when the dialog pops up.`
  },
  {
    keywords: ['hide', 'show', 'editor', 'code editor', 'expanded', 'fullscreen', 'minimize', 'collapse', 'hide space', 'big screen'],
    answer: `<strong>🖥️ Hiding the Code Editor & Expanding the Layout:</strong><br><br>
    You can easily collapse the code editor to maximize webcam video space or full screen view!<br><br>
    - <strong>Candidate workspace:</strong> Click the 💻 <strong>Hide Code Editor</strong> button in the bottom utility action bar (next to mic/camera controls). This collapses the editor and expands the webcam video layout to a spacious full screen. Click it again to restore!<br>
    - <strong>Interviewer Dashboard:</strong> Click the 🎛️ <strong>Toggle Layout / Focus View</strong> button in the top session controls. It collapses the left session stats details panel and splits the grid to give maximum workspace to the candidate's live webcam and real-time code editor.`
  },
  {
    keywords: ['proctor', 'face', 'gaze', 'looking', 'move', 'mediapipe', 'blazeface', 'alert', 'camera', 'webcam', 'coordinates'],
    answer: `<strong>⚠️ WASM AI Proctoring & Bounding Boxes:</strong><br><br>
    The Candidate Room integrates client-side WebAssembly **MediaPipe Tasks Vision** loaded via CDN. It tracks coordinates in real time inside <code>requestAnimationFrame</code>.<br><br>
    <strong>Security triggers:</strong><br>
    - 🔴 <strong>Face Loss Alert:</strong> If no face is scanned (covered lens or looking away) for 2.5s, flashes: <em>"⚠️ NO FACE DETECTED!"</em> and increments telemetry alert metrics.<br>
    - 🟡 <strong>Posture Stability Lock:</strong> Measures Head-Center delta drift between frames. If movement exceeds thresholds, logs rapid shifting alerts.<br>
    - 🔵 <strong>Gaze Margin Tracker:</strong> Warns candidate if they drift too close to the video borders.<br><br>
    All telemetry metrics stream instantly as a live HUD dashboard on the Interviewer's participant video tile!`
  },
  {
    keywords: ['compiler', 'ide', 'run', 'code', 'javascript', 'python', 'cpp', 'testcases', 'tab', 'keystroke', 'editor', 'type'],
    answer: `<strong>💻 Interactive Sandboxed IDE Compiler:</strong><br><br>
    Both panels share an advanced multi-language compiler simulator supporting **JavaScript (Node.js), Python 3, and C++ 17**.<br><br>
    <strong>IDE Monitor Mechanics:</strong><br>
    - ▷ <strong>Run Code:</strong> Runs code against validation test cases (✓ Ticks / ✗ Crosses).<br>
    - 📑 <strong>Prompt tab:</strong> Housed next to compiler Console/Testcases tabs inside the integrated panel for real-time prompt reading.<br>
    - ⌨️ <strong>Keystroke sync:</strong> Real-time editor code sync broadcasts candidate inputs. The interviewer watches their typing character-by-character.<br>
    - 🔓 <strong>No Startup Lock:</strong> The editor is fully open and interactive instantly when the call starts, no need to wait for pushed challenges.`
  },
  {
    keywords: ['candidate', 'student', 'scorecard', 'history', 'solved', 'lobby', 'timer', 'notes', 'mic', 'mute', 'raise'],
    answer: `<strong>👨‍🎓 Candidate Assessment Dashboard:</strong><br><br>
    The Student portal houses everything for complete live preparation:<br><br>
    - 📑 <strong>Problems list:</strong> Filter challenges by category (Arrays, Trees, DP) and solve.<br>
    - 🎮 <strong>3D Flashcards:</strong> Flip and rate assessed cards.<br>
    - 🎥 <strong>Immersive meet room:</strong> Webcam audio/video toggles, active clocks, stacked notes and chats, and Raise Hand indicators.<br>
    - 📊 <strong>Scorecard summaries:</strong> Renders hiring grades and proctor focus stats, writing persistently to lobby dashboards.`
  },
  {
    keywords: ['job postings', 'jobs tab', 'post job', 'vacancy', 'vacancies', 'draft post', 'description editor', 'applicant metrics', 'publishing toggler', 'active jobs', 'manage jobs', 'job search', 'job draft'],
    answer: `<strong>💼 Recruiter Jobs Manager:</strong><br><br>
    The <strong>Job Postings</strong> workspace is a high-fidelity splitscreen jobs workspace:<br><br>
    - <strong>Left Panel:</strong> Lists active and draft positions with live applicant counts. You can search jobs or filter by location.<br>
    - <strong>Right Panel:</strong> Displays full job description drafts. Here, you can review draft details and application stage tallies.<br>
    - <strong>Edit & Publish Toggler:</strong> Type custom job titles, modify specifications, set active draft statuses, and click the publishing toggle to instantly sync job vacancies so they are available dynamically in interview scheduling forms!`
  },
  {
    keywords: ['pipeline configurator', 'hiring chevrons', 'chevron pipeline', 'stage builder', 'pipeline stages', 'resume screen', 'coding assessment', 'technical call', 'benchmark pass', 'hiring funnel stages'],
    answer: `<strong>🔰 Custom Hiring Pipeline & Chevron Builder:</strong><br><br>
    The <strong>Pipelines</strong> manager allows recruiters to design customized candidate evaluation stages:<br><br>
    - <strong>Hiring Chevron Sequence:</strong> Instantly displays the progress chain in horizontal high-fidelity chevrons mapping candidate evaluation steps.<br>
    - <strong>Custom Stage Configurator:</strong> Add custom stages like *Resume Screen*, *WASM Code Test*, *Technical Call*, *Behavioral Culture Round*, or *Executive Review*.<br>
    - <strong>Benchmark Percentages:</strong> Set targeted passing scores for each stage (e.g. 70%, 85%).<br>
    - <strong>Deletions & Re-draws:</strong> Delete unwanted stages on-the-fly to automatically re-render the chevron layout and recalculate pipelines!`
  },
  {
    keywords: ['scheduler form', 'book interview', 'schedule meeting', 'interview date', 'candidate name', 'assigned interviewer', 'timeline logs', 'book session', 'upcoming assessments'],
    answer: `<strong>📅 Smart Interview Scheduler & Meeting Timeline:</strong><br><br>
    The <strong>Interviews</strong> scheduler connects company vacancies, candidates, and interviewer calendars persistently:<br><br>
    - <strong>Booking Console:</strong> Fill in Candidate Name, select target job openings (loaded dynamically from active published posts!), specify appointment date, select target time, and assign an engineer (loaded dynamically from your active Interviewer Team Registry!).<br>
    - <strong>Persistent Meeting Timelines:</strong> Renders active schedule logs detailing candidates, target positions, schedules, and interviewer profiles.<br>
    - <strong>Cancel Controls:</strong> Recruiters can cancel scheduled bookings on-the-fly, instantly removing invitations and freeing calendar availability.`
  },
  {
    keywords: ['analytics funnel', 'conversion chart', 'days-to-hire', 'talent metrics', 'conversion funnel', 'applied offered conversion', 'conversion rate', 'funnel charts'],
    answer: `<strong>📊 Recruiting Analytics Funnel & Talent Metrics:</strong><br><br>
    The <strong>Analytics</strong> tab renders high-fidelity horizontal charts mapping candidate pass-through ratios:<br><br>
    - <strong>Funnel Conversion Chart:</strong> Visualizes conversion rate drops across five progressive stages: *New Applied (100%)* -> *Screened (65%)* -> *Code Tested (30%)* -> *Live Interviewed (12%)* -> *Offers Extended (4%)*.<br>
    - <strong>Talent Conversion Indicators:</strong> Instantly calculates critical metrics like **Average Days-to-Hire** (e.g. 24 Days), **Global Pass Rate** (e.g. 41%), and referral conversion indicators to audit recruiter hiring speed.`
  },
  {
    keywords: ['team registry', 'active interviewers', 'register interviewer', 'department', 'lead engineer', 'add team member', 'interviewer title', 'interviewer registry'],
    answer: `<strong>👥 Interviewer Team Registry:</strong><br><br>
    The <strong>Team</strong> tab lists company-assigned engineering evaluators and manages interviewer access:<br><br>
    - <strong>Access Directory:</strong> Lists active interviewer profiles complete with title tags (e.g. *Lead Architect*), assigned departments (e.g. *Infrastructure*), total conducted sessions, and global average candidate grading ratings.<br>
    - <strong>Interviewer Registration:</strong> Enter the engineer's name, email, titles, department, and secure password. Click <strong>Add Team Member</strong> to persistently save their login credentials so they can access their Interviewer Dashboard!`
  },
  {
    keywords: ['live simulation', 'live room', 'monitor candidate', 'push questions', 'keystrokes stream', 'notes editor', 'live proctor HUD', 'interviewer live', 'start live room', 'sarah johnson call'],
    answer: `<strong>🎙️ Interviewer Live Simulation Proctor Room:</strong><br><br>
    Engineers evaluate candidates in real time inside a full-viewport workspace:<br><br>
    - <strong>E2E Dual Webcam Stream:</strong> Shows the candidate's MediaPipe tracking feed alongside the interviewer's picture-in-picture stream with audio voice waveforms and digital clocks.<br>
    - <strong>Live Proctoring HUD:</strong> Streams candidate WASM MediaPipe face-bounding box coordinates, head-movement stability percent, and gaze alerts as a floating overlay.<br>
    - <strong>Keystrokes Typist Feed:</strong> Displays the candidate's code editor, updating character-by-character as they type.<br>
    - <strong>Autosave Comments:</strong> Rich text editor commits interviewer feedback persistently to local database.`
  },
  {
    keywords: ['interviewer compile', 'run candidate code', 'console terminal drawer', 'compiler monitor', 'logic stdout', 'test suites verification', 'interviewer run code', 'run candidate code console'],
    answer: `<strong>💻 Interviewer Sandboxed Compiler Monitor:</strong><br><br>
    Assess candidate algorithmic submissions on-the-fly:<br><br>
    - <strong>◁ Run Candidate Code:</strong> Clicking the compiler action bar retrieves the candidate's active template and executes a dry-run compile.<br>
    - <strong>Slide-Up Fira-Code Terminal Console:</strong> Opens a collapsible console drawer displaying compiling indicators, expected vs actual logic stdout results, and validation test suites verification ticks (✓ / ✗).`
  },
  {
    keywords: ['challenge bank', 'assign challenge', 'custom questions', 'question templates', 'algorithmic repository', 'question statement', 'question bank', 'challenge templates'],
    answer: `<strong>📑 Curated Coding Challenges Repository:</strong><br><br>
    The <strong>Question Bank</strong> manages assessment problems inside a persistent repository:<br><br>
    - <strong>Challenge Browser:</strong> Browse coding questions complete with category filters, difficulty tags (Easy, Medium, Hard), targeted time limits, and extensive descriptions.<br>
    - <strong>Linked Agendas:</strong> Assign questions to scheduled candidate sessions, which populates the initial challenge inside their lobby and meet room automatically!<br>
    - <strong>Challenge Builder Form:</strong> Compose and save custom technical statements, starter code templates, and validation test cases.`
  },
  {
    keywords: ['scorecard evaluator', 'star ratings', 'code quality score', 'problem solving score', 'system architecture score', 'strengths growth', 'evaluation form', 'grade candidate'],
    answer: `<strong>⭐ Candidate Star-Rating Scorecard Evaluator:</strong><br><br>
    Upon completing the live simulation, the interviewer grades candidate criteria inside the <strong>Scorecards</strong> workspace:<br><br>
    - <strong>Five Assessment Dimensions:</strong> Award 1-5 star ratings across five core indicators: *Code Quality*, *Problem Solving*, *Technical Knowledge*, *Communication Skills*, and *System Architecture*.<br>
    - <strong>Percentage Conversion:</strong> Automatically computes aggregate rating scores (e.g. 84% passing).<br>
    - <strong>Textual Logs:</strong> Collects detailed feedback on candidate strengths, areas of growth, and final hiring summary logs before permanently locking scorecard statuses on save.`
  },
  {
    keywords: ['ats print report', 'a4 report', 'print pdf', 'save report', 'progress meters', 'star ratings report', 'window print', 'print scorecard', 'applicant tracking report'],
    answer: `<strong>📄 Margin-Isolated A4 ATS Feedback Reports:</strong><br><br>
    The <strong>Reports</strong> tab compiles graded scorecards into a highly elegant evaluation sheet:<br><br>
    - <strong>A4 Report Previewer:</strong> Compiles locked scorecard metadata, star grades, strength logs, and proctor infraction histories into a professional ATS page.<br>
    - <strong>Progress Bar Indicators:</strong> Renders horizontal grading bars mapping absolute dimensions scores.<br>
    - <strong>Marginal Print Isolation:</strong> Clicking **Print / Save PDF** fires native system print dialogs, cleanly stripping dashboard sidebars, side tabs, headers, and footer wrappers to output isolated, high-fidelity A4 PDF sheets!`
  },
  {
    keywords: ['theme', ' indigo', 'space', 'emerald', 'glow', 'skin', 'color', 'background', 'settings'],
    answer: `<strong>🎨 Harmonious Dashboard Skins:</strong><br><br>
    Both Recruiter and Interviewer dashboards feature premium global skin config selectors inside Settings:<br>
    - 🔵 <strong>Indigo Glow:</strong> Elegant corporate neon lines.<br>
    - 🌌 <strong>Deep Space:</strong> Immersive slate-dark themes.<br>
    - 🟢 <strong>Emerald Glow:</strong>Harmonious green matrix vibes.<br><br>
    Changing a theme updates panels, borders, sidebars, and grid glows globally!`
  },
  {
    keywords: ['resume analyzer', 'ats score', 'ats checker', 'scan resume', 'upload resume', 'recommended company', 'companies of softer', 'recomnded comapny', 'same resume', 'consistent score'],
    answer: `<strong>🤖 100% Real Client-Side AI Resume Analyzer & OCR:</strong><br><br>
    EkVue features an advanced browser-side **AI Resume Analyzer & ATS Benchmarking Engine** inside the Student portal (sidebar: <em>"AI Resume Analyzer"</em>) and the main Landing Page.<br><br>
    <strong>Advanced Tech Capabilities:</strong><br>
    - 📁 <strong>Multi-Format parsing:</strong> Drag or click to upload **PDF, Word (.docx), plain TXT**, or even **screenshots/scans of resumes (JPG, JPEG, PNG)**!<br>
    - 👁️ <strong>Browser-Side OCR:</strong> If you upload an image (JPG/PNG), the system dynamically loads **Tesseract.js** to run active Optical Character Recognition, scanning and compiling text blocks 100% locally in your browser to maintain strict privacy.<br>
    - 📄 <strong>Doc-Stream Parsers:</strong> PDF and Word documents are compiled directly via in-browser **PDF.js** and **Mammoth.js** loaders to retrieve precise characters rather than raw compressed compiled bytes.<br>
    - 🛡️ <strong>Rigorous Validation Check:</strong> Filters invalid files (e.g. scenic photographs, blank pages, or simple text files) by validating word counts, email/phone contact signatures, and standard professional headers (*Experience, Education, Skills*). Displays an interactive **Validation Failure Card** detailing failed metrics.<br>
    - 📈 <strong>Detailed ATS Scorecard & Checklist:</strong> Renders your aggregate ATS score based on keyword densities, contact completeness, format layout, and word count. Generates an **Actionable Checklist** showing you precisely what's missing (e.g. GitHub URL, LinkedIn, specific skill tags).<br>
    - 🏢 <strong>Target Company Alignment:</strong> Recommends top matching tech firms (Google, Stripe, Airbnb, etc.) based on frontend, backend, or AI skill vectors. Anchored by a DJB2 checksum hash, re-uploading the identical file will always yield the exact same score and picks!`
  },
  {
    keywords: ['recommended', 'recommend', 'picks', 'personalized', 'subarray', 'substring', 'traversal', 'solve', 'quick', 'p_two_sum', 'maximum subarray', 'longest substring', 'binary tree traversal'],
    answer: `<strong>🎯 How Recommended Problems Work:</strong><br><br>
    Under the Candidate Dashboard, you will find a curated list of **Recommended problems** (Personalized Picks) based on high-frequency algorithmic assessments. These include:<br><br>
    - 📈 <strong>Maximum Subarray:</strong> A Medium-difficulty challenge testing dynamic programming and Kadane's Algorithm.<br>
    - 🔤 <strong>Longest Substring Without Repeating:</strong> A Medium-difficulty sliding window challenge.<br>
    - 🌳 <strong>Binary Tree Inorder Traversal:</strong> A Tree DFS recursion traversal.<br><br>
    <strong>How to solve them:</strong><br>
    1. Click the <strong>Solve</strong> button next to any recommended problem row.<br>
    2. This instantly slides open your <strong>IDE workspace</strong> and pre-loads that specific challenge's description, template code, and validation test cases.<br>
    3. Press **Run Code** to compile and verify your solution against target cases. Once submitted, it saves persistently to your solved history!`
  },
  {
    keywords: ['dashboard', 'dashboards', 'navigate', 'navigation', 'menus', 'sections', 'sidebar', 'portal', 'view', 'lobby', 'view-dashboard', 'portal overview', 'student portal', 'recruiter portal', 'interviewer portal'],
    answer: `<strong>🖥️ EkVue Dashboard & Portal Navigation:</strong><br><br>
    EkVue features three specialized dashboard portals tailored for each hiring role:<br><br>
    - 👨‍🎓 <strong>Candidate Dashboard:</strong> Allows candidates to view recommended challenges, access conceptual study flashcards, build printable A4 resumes, and join real-time proctor video interview calls.<br>
    - 🏢 <strong>Recruiter (Company) Dashboard:</strong> Lets recruiters manage job posts, customize pipeline chevrons, schedule interviews, track converting pipelines, and manage the team registry.<br>
    - 📅 <strong>Interviewer Dashboard:</strong> Designed for engineers to conduct live video calls, review priority lists, run candidate sandbox compiles, grade scorecards, and print A4 ATS reports.<br><br>
    <em>Switch between views instantly using the left sidebars or log out to sign in under a different profile!</em>`
  }
];

// Helper to find answer based on keywords
export function findAnswer(query) {
  const normalized = query.toLowerCase();
  
  // 1. Direct Phrase Search
  for (const item of SUPPORT_DATABASE) {
    if (item.keywords.some(kw => normalized.includes(kw))) {
      return item.answer;
    }
  }
  
  // 2. Smart Fuzzy Word Matching (Splits query into words and scores each article)
  // List of standard words to skip (stop words) so they don't generate false positives
  const stopWords = new Set([
    'how', 'to', 'do', 'does', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 
    'if', 'then', 'else', 'for', 'about', 'in', 'on', 'at', 'with', 'from', 'by', 
    'about', 'like', 'this', 'that', 'these', 'those', 'what', 'where', 'when', 
    'why', 'who', 'how', 'which', 'questions', 'question', 'site', 'website', 
    'page', 'section', 'problem', 'problems', 'word'
  ]);
  
  // Split query into unique words, stripping non-alphanumeric chars
  const queryWords = normalized
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  if (queryWords.length > 0) {
    let bestMatch = null;
    let highestScore = 0;
    
    for (const item of SUPPORT_DATABASE) {
      let score = 0;
      // Count how many query words match any of the item's keywords or are contained in the answer
      for (const word of queryWords) {
        // If a word matches a keyword exactly, high weight
        if (item.keywords.some(kw => kw.includes(word) || word.includes(kw))) {
          score += 3;
        }
        // If a word is in the answer text, minor weight
        if (item.answer.toLowerCase().includes(word)) {
          score += 1;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }
    
    // If we have a relatively decent match score, return that matching answer!
    if (bestMatch && highestScore >= 3) {
      return `<em>💡 Search Match (for key terms: <strong>"${queryWords.join(', ')}"</strong>):</em><br><br>` + bestMatch.answer;
    }
  }
  
  // Default response
  return `I understand you have a question about our platform. I can help you debug any section of the website!
  <br><br>
  Try asking about:<br>
  - 🎯 <strong>Recommended problems & Personalized picks</strong><br>
  - 🌐 <strong>Syncing two separate laptops</strong><br>
  - ⚠️ <strong>MediaPipe AI Proctoring alerts</strong><br>
  - 📷 <strong>Webcam and camera permissions</strong><br>
  - 🖥️ <strong>Hiding / showing the code editor</strong><br>
  - 👨‍🎓 <strong>How to create a Student / Recruiter</strong><br>
  - 💻 <strong>IDE multi-language compiler</strong><br>
  - 🏢 <strong>Recruitment Pipeline & Chevrons</strong><br>
  - 🎙️ <strong>Interviewer Scorecards & ATS PDF printing</strong><br>
  - 🎨 <strong>Indigo/Space/Emerald theme skins</strong>`;
}
