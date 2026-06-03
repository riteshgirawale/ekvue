/**
 * JUDGE0 CODE EXECUTION — Non-module global version
 * Attaches executeWithJudge0 and helpers to window.
 */

(function() {
  'use strict';

  var ONLINE_COMPILER_LANGS = {
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

  async function executeWithJudge0(sourceCode, language, stdin, timeLimit, memoryLimit) {
    stdin = stdin || '';
    timeLimit = timeLimit || 5;
    memoryLimit = memoryLimit || 128000;
    var langKey = language.toLowerCase().trim();
    var compilerId = ONLINE_COMPILER_LANGS[langKey] || 'typescript-deno';
    var customApiKey = localStorage.getItem('ekvueOnlineCompilerApiKey') || localStorage.getItem('onlineCompilerApiKey');

    try {
      var response = await fetch('/run-code', {
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
        var errText = await response.text();
        throw new Error('OnlineCompiler API error (' + response.status + '): ' + errText);
      }

      var result = await response.json();
      if (!result) {
        throw new Error('No execution result returned from OnlineCompiler API.');
      }

      var stdout = result.output || '';
      var stderr = (result.exit_code !== 0 && result.status === 'error') ? (result.error || '') : '';
      var compile_output = (result.exit_code !== 0 && !result.output) ? (result.error || '') : '';
      var success = (result.exit_code === 0) && (result.status === 'success');
      var statusId = success ? 3 : 4;
      var statusDesc = success ? 'Accepted' : 'Runtime Error';
      var timeUsed = result.time || "0.08";
      var memUsed = result.memory ? Math.round(parseInt(result.memory) / 1024) : 2048;

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        compile_output: compile_output.trim(),
        status: { id: statusId, description: statusDesc },
        time: timeUsed,
        memory: memUsed,
        success: success,
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

  function wrapCodeForExecution(code, language, funcName, args) {
    var lang = language.toLowerCase().trim();
    var argsJson = JSON.stringify(args);

    if (lang === 'javascript') {
      var wrappedCode = code + '\n\nconst __args = ' + argsJson + ';\nconst __result = ' + funcName + '(...__args);\nconsole.log(JSON.stringify(__result));';
      return { wrappedCode: wrappedCode, stdin: '' };
    }

    if (lang === 'python' || lang === 'python3') {
      var wrappedCode2 = 'import json\n' + code + '\n\n__args = ' + argsJson + '\n__result = ' + funcName + '(*__args)\nprint(json.dumps(__result))';
      return { wrappedCode: wrappedCode2, stdin: '' };
    }

    if (lang === 'cpp' || lang === 'c++') {
      var wrappedCode3 = '#include <iostream>\n#include <string>\n#include <vector>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\n' + code + '\n\nint main() {\n    return 0;\n}';
      return { wrappedCode: wrappedCode3, stdin: argsJson };
    }

    return { wrappedCode: code, stdin: '' };
  }

  // Attach to window
  window.executeWithJudge0 = executeWithJudge0;
  window.wrapCodeForExecution = wrapCodeForExecution;
})();
