import React, { useState } from 'react';

const LANGUAGE_INFO = {
  python: {
    icon: '🐍',
    description: 'Great for beginners! Easy to read and write.',
    tips: [
      'Use input() to get user input',
      'print() to show output',
      'Indentation matters in Python!',
      'Use # for comments'
    ],
    example: 'name = input("Your name: ")\nprint(f"Hello {name}!")'
  },
  javascript: {
    icon: '🟨',
    description: 'The language of the web! Powers websites and apps.',
    tips: [
      'Use console.log() to print output',
      'Variables: let, const, var',
      'Use readline for input in Node.js',
      'Use // for single-line comments'
    ],
    example: 'console.log("Hello World!");'
  },
  java: {
    icon: '☕',
    description: 'Popular enterprise language. "Write once, run anywhere!"',
    tips: [
      'Everything is inside a class',
      'Use Scanner for input',
      'System.out.println() for output',
      'Compile then run'
    ],
    example: 'System.out.println("Hello World!");'
  },
  cpp: {
    icon: '⚡',
    description: 'Fast and powerful! Great for games and system programming.',
    tips: [
      'Include headers with #include',
      'Use cin for input, cout for output',
      'End statements with semicolon ;',
      'Use // for comments'
    ],
    example: 'cout << "Hello World!" << endl;'
  },
  c: {
    icon: '🔧',
    description: 'The foundation of modern programming. Fast and efficient.',
    tips: [
      'Include stdio.h for input/output',
      'Use scanf() for input',
      'printf() for output',
      'Every program needs main() function'
    ],
    example: 'printf("Hello World!\\n");'
  }
};

const Sidebar = ({ language }) => {
  const [activeTab, setActiveTab] = useState('info');
  const info = LANGUAGE_INFO[language];

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📚 Info
        </button>
        <button 
          className={`tab ${activeTab === 'help' ? 'active' : ''}`}
          onClick={() => setActiveTab('help')}
        >
          💡 Help
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="language-header">
              <span className="language-icon">{info.icon}</span>
              <h3>{language.charAt(0).toUpperCase() + language.slice(1)}</h3>
            </div>
            <p className="language-description">{info.description}</p>
            
            <h4>💡 Quick Tips:</h4>
            <ul className="tips-list">
              {info.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>

            <h4>📝 Example:</h4>
            <pre className="example-code">{info.example}</pre>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="help-tab">
            <h4>🚀 How to Use CodePad:</h4>
            <ol className="help-list">
              <li>Choose your programming language from the dropdown</li>
              <li>Write your code in the editor</li>
              <li>If your program needs input, add it in the input section</li>
              <li>Click "Run Code" to execute</li>
              <li>See the results in the terminal below!</li>
            </ol>

            <h4>⌨️ Keyboard Shortcuts:</h4>
            <ul className="shortcuts-list">
              <li><code>Ctrl + Enter</code> - Run code</li>
              <li><code>Ctrl + /</code> - Comment/uncomment</li>
              <li><code>Ctrl + Z</code> - Undo</li>
              <li><code>Ctrl + Y</code> - Redo</li>
            </ul>

            <h4>🎯 Learning Features:</h4>
            <ul className="features-list">
              <li>🎨 Syntax highlighting</li>
              <li>⚡ Real-time execution</li>
              <li>📥 Input/Output support</li>
              <li>🕒 Execution time tracking</li>
              <li>🐛 Error messages and debugging help</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;