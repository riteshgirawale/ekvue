const { useState, useEffect } = React;

function OnlineCompiler() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('console.log("Hello, EkVue!");');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Default snippets for quick testing
  const snippets = {
    javascript: 'console.log("Hello, EkVue!");',
    python: 'print("Hello, EkVue!")',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, EkVue!" << endl;\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, EkVue!");\n    }\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, EkVue!\\n");\n    return 0;\n}',
    typescript: 'const message: string = "Hello, EkVue!";\nconsole.log(message);',
    ruby: 'puts "Hello, EkVue!"',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, EkVue!")\n}',
    rust: 'fn main() {\n    println!("Hello, EkVue!");\n}',
    php: '<?php\n\necho "Hello, EkVue!\\n";\n',
    swift: 'print("Hello, EkVue!")',
    kotlin: 'fun main() {\n    println("Hello, EkVue!")\n}',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, EkVue!");\n    }\n}'
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (snippets[newLang]) {
      setCode(snippets[newLang]);
    }
  };

  const handleRunCode = async () => {
    if (!window.executeWithJudge0) {
      setOutput("Error: Judge0 execution module not loaded.");
      return;
    }

    setIsRunning(true);
    setOutput("Executing...");

    try {
      // executeWithJudge0(sourceCode, language, stdin, timeLimit, memoryLimit)
      const res = await window.executeWithJudge0(code, language, input);
      
      let finalOutput = '';
      if (res.stdout) finalOutput += res.stdout + '\n';
      if (res.stderr) finalOutput += '\n[STDERR]\n' + res.stderr;
      if (res.compile_output) finalOutput += '\n[COMPILE ERROR]\n' + res.compile_output;
      if (res.message) finalOutput += '\n[MESSAGE]\n' + res.message;
      if (res.error) finalOutput += '\n[ERROR]\n' + res.error;

      if (!finalOutput) {
         finalOutput = "Program executed successfully with no output.";
      }

      setOutput(finalOutput.trim());
    } catch (err) {
      setOutput("Error executing code: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="card section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="header-row" style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
        <div>
          <h2>Online Compiler</h2>
          <div className="muted">Run your code instantly in the browser using Judge0</div>
        </div>
        <div>
          <select 
            className="workspace-select" 
            style={{ padding: '8px 12px', marginRight: '12px' }}
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java (OpenJDK)</option>
            <option value="c">C (GCC)</option>
            <option value="typescript">TypeScript</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="php">PHP</option>
            <option value="swift">Swift</option>
            <option value="kotlin">Kotlin</option>
            <option value="csharp">C# (.NET)</option>
          </select>
          <button 
            className="btn primary" 
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '400px' }}>
        {/* Left side: Editor */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source Code</label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{ 
              flex: 1, 
              width: '100%', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '16px',
              color: '#e2e8f0',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              outline: 'none'
            }}
            spellCheck="false"
          />
        </div>

        {/* Right side: Input / Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Input (stdin)</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter inputs here..."
              style={{ 
                flex: 1, 
                width: '100%', 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '12px',
                color: '#e2e8f0',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'none',
                outline: 'none'
              }}
              spellCheck="false"
            />
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output / Result</label>
            <pre style={{ 
              flex: 1, 
              width: '100%', 
              background: '#0f172a', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '12px',
              color: '#10b981',
              fontFamily: 'monospace',
              fontSize: '13px',
              margin: 0,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {output || "Output will appear here..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('compiler-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<OnlineCompiler />);
}

