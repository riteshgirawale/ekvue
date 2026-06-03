/* ==========================================
   JUDGE0 CODE EXECUTION API — SHARED MODULE
   Uses RapidAPI Judge0 CE for real multi-language
   code compilation and execution.
   ========================================== */

const JUDGE0_CONFIG = {
  host: 'judge0-ce.p.rapidapi.com',
  apiKey: 'e7c9e71becmsh92bd963544f8dc3p18a277jsn25cf2ce19a5b',
  baseUrl: 'https://judge0-ce.p.rapidapi.com'
};

// Language ID mapping for Judge0 CE
const JUDGE0_LANGUAGES = {
  'javascript': 63,   // JavaScript (Node.js 12.14.0)
  'python': 71,        // Python 3 (3.8.1)
  'python3': 71,
  'cpp': 54,           // C++ (GCC 9.2.0)
  'c++': 54,
  'c': 50,             // C (GCC 9.2.0)
  'java': 62,          // Java (OpenJDK 13.0.1)
  'typescript': 74,    // TypeScript (3.7.4)
  'ruby': 72,          // Ruby (2.7.0)
  'go': 60,            // Go (1.13.5)
  'rust': 73,          // Rust (1.40.0)
  'php': 68,           // PHP (7.4.1)
  'swift': 83,         // Swift (5.2.3)
  'kotlin': 78,        // Kotlin (1.3.70)
  'csharp': 51,        // C# (Mono 6.6.0.161)
  'c#': 51
};

/**
 * Submit code to Judge0 and get the execution result.
 * @param {string} sourceCode - The code to execute
 * @param {string} language - Language name (e.g., 'javascript', 'python', 'cpp')
 * @param {string} [stdin=''] - Standard input for the program
 * @param {number} [timeLimit=5] - Time limit in seconds
 * @param {number} [memoryLimit=128000] - Memory limit in KB
 * @returns {Promise<{stdout: string, stderr: string, compile_output: string, status: object, time: string, memory: number, success: boolean, error: string|null}>}
 */
export async function executeWithJudge0(sourceCode, language, stdin = '', timeLimit = 5, memoryLimit = 128000) {
  const langKey = language.toLowerCase().trim();
  
  const ONLINE_COMPILER_LANGS = {
    'javascript': 'typescript-deno',
    'js': 'typescript-deno',
    'python': 'python-3.14',
    'python3': 'python-3.14',
    'py': 'python-3.14',
    'cpp': 'g++-15',
    'c++': 'g++-15',
    'c': 'gcc-15',
    'java': 'openjdk-25',
    'typescript': 'typescript-deno',
    'ts': 'typescript-deno',
    'ruby': 'ruby-4.0',
    'go': 'go-1.26',
    'rust': 'rust-1.93',
    'php': 'php-8.5',
    'swift': 'typescript-deno',
    'kotlin': 'openjdk-25',
    'csharp': 'dotnet-csharp-9',
    'c#': 'dotnet-csharp-9'
  };

  const compilerId = ONLINE_COMPILER_LANGS[langKey] || 'typescript-deno';
  const customApiKey = localStorage.getItem('ekvueOnlineCompilerApiKey') || localStorage.getItem('onlineCompilerApiKey');

  try {
    const response = await fetch('http://localhost:3000/run-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compiler: compilerId,
        code: sourceCode,
        input: stdin,
        apiKey: customApiKey || undefined
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OnlineCompiler API error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    if (!result) {
      throw new Error('No execution result returned from OnlineCompiler API.');
    }

    const stdout = result.output || '';
    const stderr = (result.exit_code !== 0 && result.status === 'error') ? (result.error || '') : '';
    const compile_output = (result.exit_code !== 0 && !result.output) ? (result.error || '') : '';
    const success = (result.exit_code === 0) && (result.status === 'success');
    const statusId = success ? 3 : 4;
    const statusDesc = success ? 'Accepted' : 'Runtime Error';

    const timeUsed = result.time || "0.08";
    const memUsed = result.memory ? Math.round(parseInt(result.memory) / 1024) : 2048;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      compile_output: compile_output.trim(),
      status: { id: statusId, description: statusDesc },
      time: timeUsed,
      memory: memUsed,
      success,
      error: null
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: '',
      compile_output: '',
      status: { id: 0, description: 'API Error' },
      time: '0',
      memory: 0,
      success: false,
      error: err.message
    };
  }
}

/**
 * Get the Judge0 language ID for a given language name.
 * @param {string} language 
 * @returns {number|null}
 */
export function getLanguageId(language) {
  return JUDGE0_LANGUAGES[language.toLowerCase().trim()] || null;
}

/**
 * Check if a language is supported by Judge0.
 * @param {string} language
 * @returns {boolean} 
 */
export function isLanguageSupported(language) {
  return !!JUDGE0_LANGUAGES[language.toLowerCase().trim()];
}

/**
 * Get a display-friendly list of supported languages.
 * @returns {string[]}
 */
export function getSupportedLanguages() {
  return ['JavaScript', 'Python', 'C++', 'C', 'Java', 'TypeScript', 'Ruby', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin', 'C#'];
}

/**
 * Wrap code for execution with stdin-based test cases.
 * This helper wraps a function definition so it reads args from stdin and prints the result.
 * @param {string} code - The function code
 * @param {string} language - Language name
 * @param {string} funcName - The function name to call
 * @param {Array} args - Arguments to pass
 * @returns {{wrappedCode: string, stdin: string}}
 */
export function wrapCodeForExecution(code, language, funcName, args) {
  const lang = language.toLowerCase().trim();
  const argsJson = JSON.stringify(args);

  if (lang === 'javascript') {
    const wrappedCode = `${code}\n\nconst __args = ${argsJson};\nconst __result = ${funcName}(...__args);\nconsole.log(JSON.stringify(__result));`;
    return { wrappedCode, stdin: '' };
  }

  if (lang === 'python' || lang === 'python3') {
    const wrappedCode = `import json\n${code}\n\n__args = ${argsJson}\n__result = ${funcName}(*__args)\nprint(json.dumps(__result))`;
    return { wrappedCode, stdin: '' };
  }

  if (lang === 'cpp' || lang === 'c++') {
    // For C++ we pass arguments via stdin
    const wrappedCode = `#include <iostream>\n#include <string>\n#include <vector>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\n${code}\n\nint main() {\n    // Basic execution - output will be captured\n    return 0;\n}`;
    return { wrappedCode, stdin: argsJson };
  }

  // Default: just return the code as-is
  return { wrappedCode: code, stdin: '' };
}
