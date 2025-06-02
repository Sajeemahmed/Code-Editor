import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, onChange, language }) => {
  const getMonacoLanguage = (lang) => {
    const languageMap = {
      python: 'python',
      javascript: 'javascript',
      java: 'java',
      cpp: 'cpp',
      c: 'c'
    };
    return languageMap[lang] || 'plaintext';
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Set editor theme and options
    monaco.editor.setTheme('vs-dark');
    
    // Add custom shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Trigger run code (you can implement this)
      console.log('Ctrl+Enter pressed - Run code');
    });
  };

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: 'Fira Code, Consolas, Monaco, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          suggest: {
            enableVoice: false
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;