import React, { forwardRef, useEffect, useRef } from 'react';

const Terminal = forwardRef(({ output, isExecuting }, ref) => {
  const terminalRef = useRef();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="terminal" ref={terminalRef}>
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="terminal-button red"></span>
          <span className="terminal-button yellow"></span>
          <span className="terminal-button green"></span>
        </div>
        <span className="terminal-title">CodePad Terminal</span>
      </div>
      <div className="terminal-body">
        {output ? (
          <pre className="terminal-output">{output}</pre>
        ) : (
          <div className="terminal-placeholder">
            <p>👋 Welcome to CodePad!</p>
            <p>✨ Write your code and click "Run Code" to see the magic happen!</p>
            <p>💡 Pro tip: Use the input section below the editor for programs that need user input.</p>
          </div>
        )}
        {isExecuting && (
          <div className="terminal-loading">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Terminal.displayName = 'Terminal';

export default Terminal;