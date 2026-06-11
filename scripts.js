const pricingButtons = document.querySelectorAll('.pricing-toggle');
const priceValues = document.querySelectorAll('.price-value');
const countdownElement = document.getElementById('problem-timer');
const problemTag = document.getElementById('problem-tag');
const problemStatus = document.getElementById('problem-status');
const problemText = document.getElementById('problem-text');
const exampleOne = document.getElementById('example-1');
const exampleTwo = document.getElementById('example-2');

const difficultyLevels = ['Easy', 'Medium', 'Hard'];

const problems = [
  {
    tag: 'Two Sum Problem',
    status: 'Easy',
    details: {
      Easy: {
        text: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        examples: [
          'Input: nums = [2,7,11,15], target = 9',
          'Output: [0,1]'
        ],
        examples2: [
          'Input: nums = [3,2,4], target = 6',
          'Output: [1,2]'
        ]
      },
      Medium: {
        text: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Use a hash-map style approach for efficiency.',
        examples: [
          'Input: nums = [2,7,11,15], target = 9',
          'Output: [0,1]'
        ],
        examples2: [
          'Input: nums = [3,2,4], target = 6',
          'Output: [1,2]'
        ]
      },
      Hard: {
        text: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Solve this in a single pass with constant extra space where possible.',
        examples: [
          'Input: nums = [2,7,11,15], target = 9',
          'Output: [0,1]'
        ],
        examples2: [
          'Input: nums = [3,2,4], target = 6',
          'Output: [1,2]'
        ]
      }
    },
    templates: {
      Easy: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
}

console.log(twoSum([2,7,11,15], 9));`,
      Medium: `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i += 1) {
    const complement = target - nums[i];
    if (seen.hasOwnProperty(complement)) {
      return [seen[complement], i];
    }
    seen[nums[i]] = i;
  }
}

console.log(twoSum([2,7,11,15], 9));`,
      Hard: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i += 1) {
    for (let j = i + 1; j < nums.length; j += 1) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}

console.log(twoSum([2,7,11,15], 9));`
    }
  },
  {
    tag: 'Valid Parentheses',
    status: 'Easy',
    details: {
      Easy: {
        text: 'Given a string s containing just the characters (, ), {, }, [ and ], determine if the input string is valid.',
        examples: [
          'Input: s = "()"',
          'Output: true'
        ],
        examples2: [
          'Input: s = "([)]"',
          'Output: false'
        ]
      },
      Medium: {
        text: 'Given a string s containing brackets, determine if it is valid. The solution should handle nested structures and mismatched types.',
        examples: [
          'Input: s = "()"',
          'Output: true'
        ],
        examples2: [
          'Input: s = "([)]"',
          'Output: false'
        ]
      },
      Hard: {
        text: 'Given a string s containing brackets, determine if it is valid. Support nested pairs, mixed bracket types, and ensure the entire string is balanced.',
        examples: [
          'Input: s = "()[]{}"',
          'Output: true'
        ],
        examples2: [
          'Input: s = "([)]"',
          'Output: false'
        ]
      }
    },
    templates: {
      Easy: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const char of s) {
    if (['(', '[', '{'].includes(char)) {
      stack.push(char);
    } else if (pairs[char]) {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}

console.log(isValid('()'));`,
      Medium: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const char of s) {
    if (pairs[char]) {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}

console.log(isValid('([)]'));`,
      Hard: `function isValid(s) {
  const stack = [];
  const pairs = new Map([[')', '('], [']', '['], ['}', '{']]);
  for (const char of s) {
    if (pairs.has(char)) {
      if (stack.pop() !== pairs.get(char)) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}

console.log(isValid('{[]}'));`
    }
  }
];

let currentProblemIndex = 0;

// Update pricing labels when the user switches billing periods.
function updatePricing(period) {
  pricingButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.period === period);
  });

  priceValues.forEach((value) => {
    value.textContent = value.dataset[period];
  });
}

// Convert seconds to HH:MM:SS format.
function formatCountdown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function getHomepageTemplate(lang, problemIndex, difficulty) {
  const problem = problems[problemIndex];
  if (!problem) return '';

  const tag = problem.tag;

  if (lang === 'javascript') {
    return problem.templates[problem.status] || '';
  }

  if (tag === 'Two Sum Problem') {
    if (lang === 'python') {
      return `def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n\n# Example usage\nprint(twoSum([2,7,11,15], 9))`;
    }
    if (lang === 'cpp') {
      return `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < nums.size(); ++i) {\n        int complement = target - nums[i];\n        if (seen.count(complement)) {\n            return {seen[complement], i};\n        }\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    vector<int> result = twoSum(nums, 9);\n    cout << "[" << result[0] << ", " << result[1] << "]" << endl;\n    return 0;\n}`;
    }
    if (lang === 'c') {
      return `#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            if (nums[i] + nums[j] == target) {\n                result[0] = i;\n                result[1] = j;\n                return result;\n            }\n        }\n    }\n    return NULL;\n}\n\nint main() {\n    int nums[] = {2, 7, 11, 15};\n    int returnSize;\n    int* result = twoSum(nums, 4, 9, &returnSize);\n    if (result) {\n        printf("[%d, %d]\\n", result[0], result[1]);\n        free(result);\n    }\n    return 0;\n}`;
    }
    if (lang === 'java') {
      return `import java.util.HashMap;\nimport java.util.Arrays;\n\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (seen.containsKey(complement)) {\n                return new int[] { seen.get(complement), i };\n            }\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n\n    public static void main(String[] args) {\n        int[] nums = {2, 7, 11, 15};\n        int[] result = twoSum(nums, 9);\n        System.out.println(Arrays.toString(result));\n    }\n}`;
    }
    if (lang === 'csharp') {
      return `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n    public static int[] TwoSum(int[] nums, int target) {\n        var seen = new Dictionary<int, int>();\n        for (int i = 0; i < nums.Length; i++) {\n            int complement = target - nums[i];\n            if (seen.ContainsKey(complement)) {\n                return new int[] { seen[complement], i };\n            }\n            seen[nums[i]] = i;\n        }\n        return new int[0];\n    }\n\n    public static void Main() {\n        int[] nums = {2, 7, 11, 15};\n        int[] result = TwoSum(nums, 9);\n        Console.WriteLine("[" + string.Join(", ", result) + "]");\n    }\n}`;
    }
  } else if (tag === 'Valid Parentheses') {
    if (lang === 'python') {
      return `def isValid(s):\n    stack = []\n    pairs = {')': '(', ']': '[', '}': '{'}\n    for char in s:\n        if char in ['(', '[', '{']:\n            stack.append(char)\n        elif char in pairs:\n            if not stack or stack.pop() != pairs[char]:\n                return False\n    return len(stack) == 0\n\n# Example usage\nprint(isValid("()[]{}"))`;
    }
    if (lang === 'cpp') {
      return `#include <iostream>\n#include <string>\n#include <stack>\n#include <unordered_map>\nusing namespace std;\n\nbool isValid(string s) {\n    stack<char> st;\n    unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};\n    for (char c : s) {\n        if (c == '(' || c == '[' || c == '{') {\n            st.push(c);\n        } else {\n            if (st.empty() || st.top() != pairs[c]) return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}\n\nint main() {\n    cout << boolalpha << isValid("()[]{}") << endl;\n    return 0;\n}`;
    }
    if (lang === 'c') {
      return `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool isValid(char* s) {\n    int len = strlen(s);\n    char stack[len];\n    int top = -1;\n    for (int i = 0; i < len; i++) {\n        char c = s[i];\n        if (c == '(' || c == '[' || c == '{') {\n            stack[++top] = c;\n        } else {\n            if (top == -1) return false;\n            if (c == ')' && stack[top] != '(') return false;\n            if (c == ']' && stack[top] != '[') return false;\n            if (c == '}' && stack[top] != '{') return false;\n            top--;\n        }\n    }\n    return top == -1;\n}\n\nint main() {\n    printf("%s\\n", isValid("()[]{}") ? "true" : "false");\n    return 0;\n}`;
    }
    if (lang === 'java') {
      return `import java.util.Stack;\nimport java.util.HashMap;\n\npublic class Main {\n    public static boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        HashMap<Character, Character> pairs = new HashMap<>();\n        pairs.put(')', '(');\n        pairs.put(']', '[');\n        pairs.put('}', '{');\n        for (char c : s.toCharArray()) {\n            if (c == '(' || c == '[' || c == '{') {\n                stack.push(c);\n            } else {\n                if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;\n            }\n        }\n        return stack.isEmpty();\n    }\n\n    public static void main(String[] args) {\n        System.out.println(isValid("()[]{}"));\n    }\n}`;
    }
    if (lang === 'csharp') {
      return `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n    public static bool IsValid(string s) {\n        var stack = new Stack<char>();\n        var pairs = new Dictionary<char, char> { {')', '('}, {']', '['}, {'}', '{'} };\n        foreach (char c in s) {\n            if (c == '(' || c == '[' || c == '{') {\n                stack.Push(c);\n            } else {\n                if (stack.Count == 0 || stack.Pop() != pairs[c]) return false;\n            }\n        }\n        return stack.Count == 0;\n    }\n\n    public static void Main() {\n        Console.WriteLine(IsValid("()[]{}"));\n    }\n}`;
    }
  }

  // Fallback generic template
  return `// Code execution in ${lang}\n\n// Write your solution here`;
}

function renderProblem(index) {
  const problem = problems[index];
  if (!problem) return;

  const detail = problem.details?.[problem.status] || {};

  if (problemTag) problemTag.textContent = problem.tag;
  if (problemStatus) problemStatus.textContent = problem.status;
  if (problemText) problemText.textContent = detail.text || '';
  if (exampleOne) {
    exampleOne.innerHTML = `<strong>Example 1:</strong>\n<p>${detail.examples?.[0] || ''}</p>\n<p>${detail.examples?.[1] || ''}</p>`;
  }
  if (exampleTwo) {
    exampleTwo.innerHTML = `<strong>Example 2:</strong>\n<p>${detail.examples2?.[0] || ''}</p>\n<p>${detail.examples2?.[1] || ''}</p>`;
  }

  const langSelect = document.getElementById('lang-select');
  const activeLang = langSelect ? langSelect.value : 'javascript';

  if (codeEditor) {
    codeEditor.value = getHomepageTemplate(activeLang, index, problem.status);
  }
}

function nextProblem() {
  currentProblemIndex = (currentProblemIndex + 1) % problems.length;
  renderProblem(currentProblemIndex);
}

function toggleDifficulty() {
  const problem = problems[currentProblemIndex];
  if (!problem) return;

  const currentIndex = difficultyLevels.indexOf(problem.status);
  const nextIndex = (currentIndex + 1) % difficultyLevels.length;
  problem.status = difficultyLevels[nextIndex];
  renderProblem(currentProblemIndex);
}

// Start the countdown timer from the given number of seconds.
function startCountdown(startSeconds) {
  let remaining = startSeconds;

  if (countdownElement) {
    countdownElement.textContent = formatCountdown(remaining);
  }

  const intervalId = setInterval(() => {
    remaining -= 1;

    if (remaining < 0) {
      nextProblem();
      remaining = startSeconds;
    }

    if (countdownElement) {
      countdownElement.textContent = formatCountdown(Math.max(remaining, 0));
    }
  }, 1000);
}

const codeEditor = document.getElementById('code-editor');
const runButton = document.getElementById('run-code');
const fullScreenButton = document.getElementById('toggle-fullscreen');
const codePanel = document.getElementById('code-panel');
const outputPanel = document.getElementById('output-panel');
const loginLink = document.getElementById('login-link');
const loginModal = document.getElementById('login-modal');
const modalClose = document.getElementById('modal-close');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('email');
const loginPassword = document.getElementById('password');
const loginError = document.getElementById('login-error');
const loginSuccess = document.getElementById('login-success');

const ACCOUNTS_KEY = 'ekvueAccounts';
// Canonical session used across the whole app.
// Shape: { email, role, name }
const SESSION_KEY = 'ekvueSession';
// Legacy key (older builds).
const LEGACY_USER_KEY = 'ekvueUser';

function getAccounts() {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    const defaults = [
      {
        role: 'Candidate',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'password',
        school: 'Stanford University',
        studyField: 'Software Engineering',
        level: 'Student',
        createdAt: new Date().toISOString()
      },
      {
        role: 'Interviewer',
        name: 'EkVue AI',
        email: 'interviewer@example.com',
        password: 'password',
        createdAt: new Date().toISOString()
      },
      {
        role: 'Company',
        name: 'Google Recruiter',
        email: 'recruiter@example.com',
        password: 'password',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function findAccountByEmail(email) {
  return getAccounts().find(
    (account) => account.email.toLowerCase() === email.toLowerCase()
  );
}

function findAccount(email, password) {
  const account = findAccountByEmail(email);
  return account && account.password === password ? account : null;
}

function getLoggedInUser() {
  // Canonical
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && parsed.email ? parsed : null;
    } catch {
      return null;
    }
  }

  // Legacy migration: ekvueUser -> ekvueSession
  const legacy = localStorage.getItem(LEGACY_USER_KEY);
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy);
    if (parsed && parsed.email) {
      const migrated = { email: parsed.email ?? '', role: parsed.role ?? '', name: parsed.name ?? '' };
      localStorage.setItem(SESSION_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // ignore
  }
  return null;
}

function setLoggedInUser(user) {
  if (!user || !user.email) return;

  const role = user.role || '';
  const name = user.name || user.fullName || '';
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, role, name }));
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, role, name }));

  if (loginLink) {
    loginLink.textContent = 'Dashboard';
    loginLink.dataset.loggedIn = 'true';
    // Redirect to role-appropriate dashboard
    const dashboardPaths = {
      'Candidate': 'dashboards/candidate/candidate.html',
      'Interviewer': 'dashboards/interviewer/interviewer.html',
      'Company': 'dashboards/company/company.html'
    };
    loginLink.href = dashboardPaths[role] || 'get-started.html';
  }
}

function clearLoggedInUser() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_KEY); // legacy
  localStorage.removeItem('ekvueCurrentUser'); // legacy
  if (loginLink) {
    loginLink.textContent = 'Log in';
    loginLink.dataset.loggedIn = 'false';
    loginLink.href = '#login';
  }
}

function openLoginModal() {
  if (!loginModal) return;
  loginModal.classList.add('active');
  if (loginError) loginError.textContent = '';
  if (loginSuccess) loginSuccess.textContent = '';
  if (loginEmail) loginEmail.focus();
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove('active');
  if (loginForm) loginForm.reset();
  if (loginError) loginError.textContent = '';
  if (loginSuccess) loginSuccess.textContent = '';
}

function showLoginError(message) {
  if (loginError) loginError.textContent = message;
  if (loginSuccess) loginSuccess.textContent = '';
}

// Fixed function declaration syntax
function showLoginSuccess(message) {
  if (loginSuccess) loginSuccess.textContent = message;
  if (loginError) loginError.textContent = '';
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = loginEmail?.value.trim() || '';
  const password = loginPassword?.value || '';

  if (!email || !password) {
    showLoginError('Please enter both email and password.');
    return;
  }

  if (!email.includes('@') || password.length < 6) {
    showLoginError('Enter a valid email and password at least 6 characters long.');
    return;
  }

  if (email.toLowerCase() === 'admin@gmail.com' && password === '123456') {
    setLoggedInUser({ email, role: 'Admin', name: 'Site Administrator' });
    showLoginSuccess('Logged in successfully as Site Administrator.');
    setTimeout(() => {
      closeLoginModal();
      window.location.href = 'dashboards/admin/admin.html';
    }, 800);
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.success) {
      showLoginError(data.error || 'Login failed. Please check your credentials.');
      return;
    }

    const account = data.user;
    setLoggedInUser(account);
    showLoginSuccess('Login successful! Redirecting to your dashboard...');

    const dashboardPaths = {
      'Candidate': 'dashboards/candidate/candidate.html',
      'Interviewer': 'dashboards/interviewer/interviewer.html',
      'Company': 'dashboards/company/company.html'
    };

    setTimeout(() => {
      closeLoginModal();
      const redirectPath = dashboardPaths[account.role] || 'get-started.html';
      window.location.href = redirectPath;
    }, 1000);
  } catch (err) {
    console.error('Login error:', err);
    showLoginError('Unable to connect to server.');
  }
}

function logOutput(message) {
  if (outputPanel) {
    outputPanel.textContent = message;
  }
}

async function executeCode() {
  if (!codeEditor) return;

  const code = codeEditor.value;
  if (!code.trim()) {
    logOutput('Error: No code to execute.');
    return;
  }

  const langSelect = document.getElementById('lang-select');
  const activeLang = langSelect ? langSelect.value : 'javascript';

  logOutput(`⏳ Compiling with EKVUE Engine (${activeLang})...`);

  const homepageCompilers = {
    'javascript': 'typescript-deno',
    'python': 'python-3.14',
    'cpp': 'g++-15',
    'c': 'gcc-15',
    'java': 'openjdk-25',
    'csharp': 'dotnet-csharp-9'
  };

  const compilerId = homepageCompilers[activeLang] || 'typescript-deno';

  try {
    const response = await fetch('/run-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compiler: compilerId,
        code: code,
        input: ''
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      logOutput(`API Error (${response.status}): ${errText}`);
      return;
    }

    const result = await response.json();
    if (!result) {
      logOutput('Error: No execution result returned.');
      return;
    }

    const stdout = (result.output || '').trim();
    const stderr = (result.exit_code !== 0 && result.status === 'error') ? (result.error || '').trim() : '';
    const compileErr = (result.exit_code !== 0 && !result.output) ? (result.error || '').trim() : '';

    const timeUsed = result.time || "0.08";
    const memUsed = result.memory ? Math.round(parseInt(result.memory) / 1024) : 2048;

    const langRunners = {
      'javascript': 'node solution.js',
      'python': 'python3 solution.py',
      'cpp': 'g++ solution.cpp && ./a.out',
      'c': 'gcc solution.c && ./a.out',
      'java': 'java Main.java',
      'csharp': 'dotnet run'
    };
    const runnerCmd = langRunners[activeLang] || 'node solution.js';

    if (compileErr) {
      logOutput(`Compilation Error:\n${compileErr}`);
    } else if (stderr && !stdout) {
      logOutput(`Runtime Error:\n${stderr}`);
    } else if (stdout) {
      logOutput(`$ ${runnerCmd}  (${timeUsed}s, ${memUsed}KB)\n\n${stdout}`);
    } else {
      logOutput(`Code executed successfully. (${timeUsed}s, ${memUsed}KB)\nNo console output produced.`);
    }
  } catch (err) {
    logOutput(`Execution Error: ${err.message}`);
  }
}

function toggleFullscreen() {
  if (!codePanel || !fullScreenButton) return;
  const isFull = codePanel.classList.toggle('full-screen');
  fullScreenButton.textContent = isFull ? 'Exit Full Screen' : 'Full Screen';
}

// Add event listeners when the page loads.
document.addEventListener('DOMContentLoaded', () => {
  pricingButtons.forEach((button) => {
    button.addEventListener('click', () => updatePricing(button.dataset.period));
  });

  if (runButton) {
    runButton.addEventListener('click', executeCode);
  }

  if (fullScreenButton) {
    fullScreenButton.addEventListener('click', toggleFullscreen);
  }

  if (loginLink) {
    loginLink.addEventListener('click', (event) => {
      event.preventDefault();
      const savedUser = getLoggedInUser();
      if (savedUser && savedUser.email) {
        const dashboardPaths = {
          'Candidate': 'dashboards/candidate/candidate.html',
          'Interviewer': 'dashboards/interviewer/interviewer.html',
          'Company': 'dashboards/company/company.html'
        };
        const redirectPath = dashboardPaths[savedUser.role] || 'get-started.html';
        window.location.href = redirectPath;
        return;
      }
      openLoginModal();
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeLoginModal);
  }

  if (loginModal) {
    loginModal.addEventListener('click', (event) => {
      if (event.target === loginModal) {
        closeLoginModal();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  const savedUser = getLoggedInUser();
  if (savedUser) {
    setLoggedInUser(savedUser);
  }
  if (problemStatus) {
    problemStatus.addEventListener('click', toggleDifficulty);
  }

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      renderProblem(currentProblemIndex);
    });
  }

  renderProblem(currentProblemIndex);
  startCountdown(5 * 60);
});

// ----------------------------------------------------
// WATCH DEMO VIDEO MODAL LOGIC
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const watchDemoBtn = document.getElementById('watch-demo-btn');
  const videoModal = document.getElementById('video-demo-modal');
  const closeVideoModal = document.getElementById('close-video-modal');
  const demoVideoPlayer = document.getElementById('demo-video-player');

  if (watchDemoBtn && videoModal && closeVideoModal && demoVideoPlayer) {
    const youtubeUrl = "https://www.youtube.com/embed/X1Wyk4QJhyc?autoplay=1&rel=0&modestbranding=1";

    watchDemoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      videoModal.style.display = 'flex';
      // Trigger reflow for smooth animation
      void videoModal.offsetWidth;
      videoModal.style.opacity = '1';
      demoVideoPlayer.src = youtubeUrl;
    });

    closeVideoModal.addEventListener('click', () => {
      videoModal.style.opacity = '0';
      demoVideoPlayer.src = "";
      setTimeout(() => {
        videoModal.style.display = 'none';
      }, 300);
    });
    
    // Close on clicking outside the video player
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoModal.click();
      }
    });
  }
});
