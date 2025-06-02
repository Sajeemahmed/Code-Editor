import React, { useState, useRef } from 'react';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import Sidebar from './components/Sidebar';
import './styles/App.css';

const SAMPLE_CODES = {
  python: `# Welcome to CodePad! 🎉
# This is a beginner-friendly Python example

name = input("What's your name? ")
age = int(input("How old are you? "))

print(f"Hello {name}! You are {age} years old.")

if age >= 18:
    print("You are an adult! 🎓")
else:
    print("You are still young! Keep learning! 📚")

# Try running this code and see what happens!`,

  javascript: `// Welcome to CodePad! 🎉
// This is a beginner-friendly JavaScript example

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What is your name? ', (name) => {
  rl.question('How old are you? ', (age) => {
    console.log(\`Hello \${name}! You are \${age} years old.\`);
    
    if (parseInt(age) >= 18) {
      console.log("You are an adult! 🎓");
    } else {
      console.log("You are still young! Keep learning! 📚");
    }
    
    rl.close();
  });
});`,

  java: `// Welcome to CodePad! 🎉
// This is a beginner-friendly Java example

import java.util.Scanner;

public class code_placeholder {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("What's your name? ");
        String name = scanner.nextLine();
        
        System.out.print("How old are you? ");
        int age = scanner.nextInt();
        
        System.out.println("Hello " + name + "! You are " + age + " years old.");
        
        if (age >= 18) {
            System.out.println("You are an adult! 🎓");
        } else {
            System.out.println("You are still young! Keep learning! 📚");
        }
        
        scanner.close();
    }
}`,

  cpp: `// Welcome to CodePad! 🎉
// This is a beginner-friendly C++ example

#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;
    
    cout << "What's your name? ";
    getline(cin, name);
    
    cout << "How old are you? ";
    cin >> age;
    
    cout << "Hello " << name << "! You are " << age << " years old." << endl;
    
    if (age >= 18) {
        cout << "You are an adult! 🎓" << endl;
    } else {
        cout << "You are still young! Keep learning! 📚" << endl;
    }
    
    return 0;
}`,

  c: `// Welcome to CodePad! 🎉
// This is a beginner-friendly C example

#include <stdio.h>
#include <string.h>

int main() {
    char name[100];
    int age;
    
    printf("What's your name? ");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\\n")] = 0; // Remove newline
    
    printf("How old are you? ");
    scanf("%d", &age);
    
    printf("Hello %s! You are %d years old.\\n", name, age);
    
    if (age >= 18) {
        printf("You are an adult! 🎓\\n");
    } else {
        printf("You are still young! Keep learning! 📚\\n");
    }
    
    return 0;
}`
};

function App() {
  const [code, setCode] = useState(SAMPLE_CODES.python);
  const [language, setLanguage] = useState('python');
  const [input, setInput] = useState('John Doe\n20');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const terminalRef = useRef();

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(SAMPLE_CODES[newLanguage] || '');
    setOutput('');
    setExecutionTime(null);
  };

  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('❌ Please write some code first!');
      return;
    }

    setIsExecuting(true);
    setOutput('🚀 Executing your code...\n');
    
    try {
      // Get API URL from environment variable or fallback to localhost
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const startTime = Date.now();
      
      console.log('Making request to:', `${API_URL}/api/execute`);
      
      const response = await fetch(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          input
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const totalTime = Date.now() - startTime;
      setExecutionTime(totalTime);

      if (result.success) {
        setOutput(`✅ Code executed successfully!\n📊 Execution time: ${result.executionTime || 'N/A'}ms\n📡 Total time: ${totalTime}ms\n\n📤 Output:\n${result.output || 'No output'}\n${result.error ? `\n⚠️ Warnings/Errors:\n${result.error}` : ''}`);
      } else {
        setOutput(`❌ Execution failed!\n\n🐛 Error:\n${result.error}\n${result.output ? `\n📤 Partial Output:\n${result.output}` : ''}`);
      }
    } catch (error) {
      console.error('Execution error:', error);
      setOutput(`❌ Connection error!\n\n🔌 Unable to connect to server. Please try again.\n\nError details: ${error.message}\n\nAPI URL: ${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearTerminal = () => {
    setOutput('');
    setExecutionTime(null);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>🚀 CodePad - Learn to Code!</h1>
        <div className="header-controls">
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-selector"
          >
            <option value="python">🐍 Python</option>
            <option value="javascript">🟨 JavaScript</option>
            <option value="java">☕ Java</option>
            <option value="cpp">⚡ C++</option>
            <option value="c">🔧 C</option>
          </select>
          <button 
            onClick={executeCode} 
            disabled={isExecuting}
            className="run-button"
          >
            {isExecuting ? '⏳ Running...' : '▶️ Run Code'}
          </button>
          <button onClick={clearTerminal} className="clear-button">
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="app-body">
        <Sidebar language={language} />
        
        <div className="main-content">
          <div className="editor-section">
            <div className="section-header">
              <h3>📝 Code Editor</h3>
              <span className="language-badge">{language.toUpperCase()}</span>
            </div>
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
            />
          </div>

          <div className="input-section">
            <div className="section-header">
              <h3>📥 Input (one per line)</h3>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program (if needed)..."
              className="input-textarea"
            />
          </div>

          <div className="terminal-section">
            <div className="section-header">
              <h3>💻 Output Terminal</h3>
              {executionTime && (
                <span className="execution-time">⚡ {executionTime}ms</span>
              )}
            </div>
            <Terminal
              ref={terminalRef}
              output={output}
              isExecuting={isExecuting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;