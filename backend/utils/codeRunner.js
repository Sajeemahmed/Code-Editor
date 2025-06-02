const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TIMEOUT = 15000; // 15 seconds timeout for cloud execution

// Cloud platform detection
const isVercel = process.env.VERCEL || process.env.NOW_REGION;
const isRender = process.env.RENDER;
const isNetlify = process.env.NETLIFY;
const isCloudPlatform = isVercel || isRender || isNetlify || process.env.NODE_ENV === 'production';

// Language configurations optimized for cloud platforms
const languageConfigs = {
  javascript: {
    extension: '.js',
    command: 'node',
    available: true,
    description: 'JavaScript (Node.js)'
  },
  python: {
    extension: '.py',
    command: 'python3',
    fallbackCommand: 'python',
    available: true,
    description: 'Python 3'
  },
  java: {
    extension: '.java',
    command: 'javac',
    runCommand: 'java',
    available: false, // Will be checked dynamically
    description: 'Java'
  },
  cpp: {
    extension: '.cpp',
    command: 'g++',
    available: false, // Will be checked dynamically
    description: 'C++'
  },
  c: {
    extension: '.c',
    command: 'gcc',
    available: false, // Will be checked dynamically
    description: 'C'
  }
};

// Get temp directory appropriate for the platform
function getTempDir() {
  if (isVercel || isRender || isNetlify) {
    return '/tmp';
  } else {
    // Local development
    const tempDir = path.join(__dirname, '..', 'temp');
    fs.ensureDirSync(tempDir);
    return tempDir;
  }
}

// Check if a command exists in the current environment
async function checkCommandExists(command) {
  return new Promise((resolve) => {
    const testProcess = spawn(command, ['--version'], { 
      stdio: 'ignore',
      shell: true,
      timeout: 3000
    });
    
    const timeout = setTimeout(() => {
      testProcess.kill();
      resolve(false);
    }, 3000);
    
    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      resolve(code === 0);
    });
    
    testProcess.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// Extract class name from Java code
function extractJavaClassName(code) {
  // Look for public class declaration
  const publicClassMatch = code.match(/public\s+class\s+(\w+)/);
  if (publicClassMatch) {
    return publicClassMatch[1];
  }
  
  // Look for any class declaration
  const classMatch = code.match(/class\s+(\w+)/);
  if (classMatch) {
    return classMatch[1];
  }
  
  // Default to Main if no class found
  return 'Main';
}

// Get available languages for the current platform
async function getAvailableLanguages() {
  const available = {};
  
  // JavaScript is always available
  available.javascript = {
    available: true,
    platform: 'server',
    description: 'JavaScript (Node.js)',
    note: 'Native server-side execution'
  };

  // Check Python availability
  const pythonExists = await checkCommandExists('python3') || await checkCommandExists('python');
  available.python = {
    available: pythonExists,
    platform: 'server',
    description: 'Python 3',
    note: pythonExists ? 'Native server-side execution' : 'Python not installed on this server'
  };

  // Java - check if available
  const javaExists = await checkCommandExists('javac') && await checkCommandExists('java');
  available.java = {
    available: javaExists,
    platform: javaExists ? 'server' : 'none',
    description: 'Java',
    note: javaExists ? 'Native server-side execution' : 'Java compiler not available on this platform'
  };

  // C++ - check if available
  const cppExists = await checkCommandExists('g++');
  available.cpp = {
    available: cppExists,
    platform: cppExists ? 'server' : 'none',
    description: 'C++',
    note: cppExists ? 'Native server-side execution' : 'C++ compiler not available on this platform'
  };

  // C - check if available
  const cExists = await checkCommandExists('gcc');
  available.c = {
    available: cExists,
    platform: cExists ? 'server' : 'none',
    description: 'C',
    note: cExists ? 'Native server-side execution' : 'C compiler not available on this platform'
  };
  
  const supportedLanguages = Object.keys(available).filter(lang => available[lang].available);
  
  return {
    platform: isVercel ? 'Vercel' : isRender ? 'Render' : isNetlify ? 'Netlify' : 'Local',
    languages: available,
    recommendations: {
      supported: supportedLanguages,
      unsupported: Object.keys(available).filter(lang => !available[lang].available),
      alternatives: supportedLanguages.length < 2 ? 
        'Consider using Replit, CodePen, or other online IDEs for full language support' :
        'Most languages available for execution'
    }
  };
}

// Main code execution function
async function executeCode(code, language, input = '') {
  const lang = language.toLowerCase();
  const config = languageConfigs[lang];
  
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Execute based on language
  switch (lang) {
    case 'javascript':
      return await executeJavaScript(code, input);
    case 'python':
      return await executePython(code, input);
    case 'java':
      return await executeJava(code, input);
    case 'cpp':
      return await executeCpp(code, input);
    case 'c':
      return await executeC(code, input);
    default:
      throw new Error(`Language ${language} execution not implemented`);
  }
}

// JavaScript execution (always available)
async function executeJavaScript(code, input) {
  const startTime = Date.now();
  const tempDir = getTempDir();
  const fileName = `code_${uuidv4()}.js`;
  const filePath = path.join(tempDir, fileName);

  try {
    // Ensure temp directory exists
    await fs.ensureDir(tempDir);
    
    // Wrap code to handle input and capture output
    const wrappedCode = `
const process = require('process');

// Handle input if provided
const input = ${JSON.stringify(input)};
if (input) {
  const lines = input.trim().split('\\n');
  let lineIndex = 0;
  
  // Mock readline for input
  global.prompt = (question) => {
    if (question) console.log(question);
    return lines[lineIndex++] || '';
  };
  
  // Mock require for readline
  const originalRequire = require;
  require = function(module) {
    if (module === 'readline') {
      return {
        createInterface: () => ({
          question: (query, callback) => {
            console.log(query);
            callback(lines[lineIndex++] || '');
          },
          close: () => {}
        })
      };
    }
    return originalRequire(module);
  };
}

try {
  // User code starts here
  ${code}
  // User code ends here
} catch (error) {
  console.error('Runtime Error:', error.message);
  process.exit(1);
}
`;

    await fs.writeFile(filePath, wrappedCode);

    return new Promise((resolve) => {
      const nodeProcess = spawn('node', [filePath], {
        cwd: tempDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      nodeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      nodeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      if (input) {
        nodeProcess.stdin.write(input);
        nodeProcess.stdin.end();
      }

      const timeout = setTimeout(() => {
        nodeProcess.kill();
        resolve({
          success: false,
          output: '',
          error: 'Execution timeout (15 seconds)',
          executionTime: Date.now() - startTime
        });
      }, TIMEOUT);

      nodeProcess.on('close', async (code) => {
        clearTimeout(timeout);
        
        // Cleanup
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: code === 0,
          output: output,
          error: errorOutput,
          executionTime: Date.now() - startTime,
          platform: 'Node.js'
        });
      });

      nodeProcess.on('error', async (err) => {
        clearTimeout(timeout);
        
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: false,
          output: '',
          error: `JavaScript execution error: ${err.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// Python execution with better Unicode handling
async function executePython(code, input) {
  const startTime = Date.now();
  const tempDir = getTempDir();
  const fileName = `code_${uuidv4()}.py`;
  const filePath = path.join(tempDir, fileName);

  try {
    // Check if Python is available
    const pythonCmd = await checkCommandExists('python3') ? 'python3' : 
                     await checkCommandExists('python') ? 'python' : null;
    
    if (!pythonCmd) {
      return {
        success: false,
        output: '',
        error: 'Python is not available on this server',
        suggestions: ['Use JavaScript instead', 'Try an online Python interpreter'],
        executionTime: Date.now() - startTime
      };
    }

    await fs.ensureDir(tempDir);
    
    // Add UTF-8 encoding header and error handling
    const wrappedCode = `# -*- coding: utf-8 -*-
import sys
import os

# Ensure UTF-8 output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Set environment for Unicode support
os.environ['PYTHONIOENCODING'] = 'utf-8'

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"Runtime Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
`;

    await fs.writeFile(filePath, wrappedCode, 'utf8');

    return new Promise((resolve) => {
      const pythonProcess = spawn(pythonCmd, ['-u', filePath], {
        cwd: tempDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1',
          PYTHONPATH: tempDir
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString('utf8');
      });

      if (input) {
        pythonProcess.stdin.write(input);
        pythonProcess.stdin.end();
      }

      const timeout = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          success: false,
          output: '',
          error: 'Execution timeout (15 seconds)',
          executionTime: Date.now() - startTime
        });
      }, TIMEOUT);

      pythonProcess.on('close', async (code) => {
        clearTimeout(timeout);
        
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: code === 0,
          output: output,
          error: errorOutput,
          executionTime: Date.now() - startTime,
          platform: pythonCmd
        });
      });

      pythonProcess.on('error', async (err) => {
        clearTimeout(timeout);
        
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: false,
          output: '',
          error: `Python execution error: ${err.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// Java execution with dynamic class name extraction
async function executeJava(code, input) {
  const startTime = Date.now();
  const tempDir = getTempDir();
  
  try {
    // Check if Java is available
    const javacExists = await checkCommandExists('javac');
    const javaExists = await checkCommandExists('java');
    
    if (!javacExists || !javaExists) {
      return {
        success: false,
        output: '',
        error: 'Java compiler or runtime is not available on this server',
        suggestions: [
          'Use JavaScript or Python instead',
          'Try an online Java compiler like Replit',
          'Deploy on a platform with Java support (like Railway or Google Cloud Run)'
        ],
        executionTime: Date.now() - startTime
      };
    }

    await fs.ensureDir(tempDir);
    
    // Extract class name from code
    const className = extractJavaClassName(code);
    const fileName = `${className}.java`;
    const filePath = path.join(tempDir, fileName);
    
    // Wrap code in a Main class if no class is found
    let wrappedCode = code;
    if (!code.includes('class ') && !code.includes('public class ')) {
      wrappedCode = `
public class ${className} {
    public static void main(String[] args) {
        try {
${code.split('\n').map(line => '            ' + line).join('\n')}
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}`;
    }

    await fs.writeFile(filePath, wrappedCode);

    return new Promise((resolve) => {
      // First compile
      const compileProcess = spawn('javac', [fileName], {
        cwd: tempDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let compileError = '';

      compileProcess.stderr.on('data', (data) => {
        compileError += data.toString();
      });

      compileProcess.on('close', (compileCode) => {
        if (compileCode !== 0) {
          // Compilation failed
          fs.remove(filePath).catch(() => {});
          resolve({
            success: false,
            output: '',
            error: `Compilation Error: ${compileError}`,
            executionTime: Date.now() - startTime
          });
          return;
        }

        // Run the compiled class
        const runProcess = spawn('java', ['-cp', '.', className], {
          cwd: tempDir,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        runProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        runProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        if (input) {
          runProcess.stdin.write(input);
          runProcess.stdin.end();
        }

        const timeout = setTimeout(() => {
          runProcess.kill();
          resolve({
            success: false,
            output: '',
            error: 'Execution timeout (15 seconds)',
            executionTime: Date.now() - startTime
          });
        }, TIMEOUT);

        runProcess.on('close', async (runCode) => {
          clearTimeout(timeout);
          
          // Cleanup
          try {
            await fs.remove(filePath);
            await fs.remove(path.join(tempDir, `${className}.class`));
          } catch (e) {
            // Ignore cleanup errors
          }

          resolve({
            success: runCode === 0,
            output: output,
            error: errorOutput,
            executionTime: Date.now() - startTime,
            platform: 'Java',
            className: className
          });
        });

        runProcess.on('error', async (err) => {
          clearTimeout(timeout);
          
          try {
            await fs.remove(filePath);
            await fs.remove(path.join(tempDir, `${className}.class`));
          } catch (e) {
            // Ignore cleanup errors
          }

          resolve({
            success: false,
            output: '',
            error: `Java execution error: ${err.message}`,
            executionTime: Date.now() - startTime
          });
        });
      });

      compileProcess.on('error', async (err) => {
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: false,
          output: '',
          error: `Java compilation error: ${err.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// C++ execution
async function executeCpp(code, input) {
  const startTime = Date.now();
  const tempDir = getTempDir();
  const fileName = `code_${uuidv4()}.cpp`;
  const filePath = path.join(tempDir, fileName);
  const executableName = process.platform === 'win32' ? 'a.exe' : 'a.out';
  const executablePath = path.join(tempDir, executableName);

  try {
    // Check if g++ is available
    const gppExists = await checkCommandExists('g++');
    
    if (!gppExists) {
      return {
        success: false,
        output: '',
        error: 'C++ compiler (g++) is not available on this server',
        suggestions: [
          'Use JavaScript or Python instead',
          'Try Compiler Explorer (godbolt.org)',
          'Use an online C++ compiler like Replit',
          'Deploy on Railway or Google Cloud Run for C++ support'
        ],
        executionTime: Date.now() - startTime
      };
    }

    await fs.ensureDir(tempDir);
    
    // Add basic includes if not present
    let wrappedCode = code;
    if (!code.includes('#include')) {
      wrappedCode = `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

${code}`;
    }
    
    await fs.writeFile(filePath, wrappedCode);

    return new Promise((resolve) => {
      // Compile with optimizations and standard libraries
      const compileProcess = spawn('g++', ['-std=c++17', '-O2', fileName, '-o', executableName], {
        cwd: tempDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let compileError = '';

      compileProcess.stderr.on('data', (data) => {
        compileError += data.toString();
      });

      compileProcess.on('close', (compileCode) => {
        if (compileCode !== 0) {
          // Compilation failed
          fs.remove(filePath).catch(() => {});
          resolve({
            success: false,
            output: '',
            error: `Compilation Error: ${compileError}`,
            executionTime: Date.now() - startTime
          });
          return;
        }

        // Run the executable
        const runProcess = spawn(executablePath, [], {
          cwd: tempDir,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        runProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        runProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        if (input) {
          runProcess.stdin.write(input);
          runProcess.stdin.end();
        }

        const timeout = setTimeout(() => {
          runProcess.kill();
          resolve({
            success: false,
            output: '',
            error: 'Execution timeout (15 seconds)',
            executionTime: Date.now() - startTime
          });
        }, TIMEOUT);

        runProcess.on('close', async (runCode) => {
          clearTimeout(timeout);
          
          // Cleanup
          try {
            await fs.remove(filePath);
            await fs.remove(executablePath);
          } catch (e) {
            // Ignore cleanup errors
          }

          resolve({
            success: runCode === 0,
            output: output,
            error: errorOutput,
            executionTime: Date.now() - startTime,
            platform: 'g++'
          });
        });

        runProcess.on('error', async (err) => {
          clearTimeout(timeout);
          
          try {
            await fs.remove(filePath);
            await fs.remove(executablePath);
          } catch (e) {
            // Ignore cleanup errors
          }

          resolve({
            success: false,
            output: '',
            error: `C++ execution error: ${err.message}`,
            executionTime: Date.now() - startTime
          });
        });
      });

      compileProcess.on('error', async (err) => {
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: false,
          output: '',
          error: `C++ compilation error: ${err.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// C execution
async function executeC(code, input) {
  const startTime = Date.now();
  const tempDir = getTempDir();
  const fileName = `code_${uuidv4()}.c`;
  const filePath = path.join(tempDir, fileName);
  const executableName = process.platform === 'win32' ? 'a.exe' : 'a.out';
  const executablePath = path.join(tempDir, executableName);

  try {
    // Check if gcc is available
    const gccExists = await checkCommandExists('gcc');
    
    if (!gccExists) {
      return {
        success: false,
        output: '',
        error: 'C compiler (gcc) is not available on this server',
        suggestions: [
          'Use JavaScript or Python instead',
          'Try an online C compiler like OnlineGDB',
          'Use Replit for C programming',
          'Deploy on Railway or Google Cloud Run for C support'
        ],
        executionTime: Date.now() - startTime
      };
    }

    await fs.ensureDir(tempDir);
    
    // Add basic includes if not present
    let wrappedCode = code;
    if (!code.includes('#include')) {
      wrappedCode = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${code}`;
    }
    
    await fs.writeFile(filePath, wrappedCode);

    return new Promise((resolve) => {
      // Compile with standard C99
      const compileProcess = spawn('gcc', ['-std=c99', '-O2', fileName, '-o', executableName], {
        cwd: tempDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let compileError = '';

      compileProcess.stderr.on('data', (data) => {
        compileError += data.toString();
      });

      compileProcess.on('close', (compileCode) => {
        if (compileCode !== 0) {
          // Compilation failed
          fs.remove(filePath).catch(() => {});
          resolve({
            success: false,
            output: '',
            error: `Compilation Error: ${compileError}`,
            executionTime: Date.now() - startTime
          });
          return;
        }

        // Run the executable
        const runProcess = spawn(executablePath, [], {
          cwd: tempDir,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        runProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        runProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        if (input) {
          runProcess.stdin.write(input);
          runProcess.stdin.end();
        }

        const timeout = setTimeout(() => {
          runProcess.kill();
          resolve({
            success: false,
            output: '',
            error: 'Execution timeout (15 seconds)',
            executionTime: Date.now() - startTime
          });
        }, TIMEOUT);

        runProcess.on('close', async (runCode) => {
          clearTimeout(timeout);
          
          // Cleanup
          try {
            await fs.remove(filePath);
            await fs.remove(executablePath);
          } catch (e) {
            // Ignore cleanup errors
          }

          resolve({
            success: runCode === 0,
            output: output,
            error: errorOutput,
            executionTime: Date.now() - startTime,
            platform: 'gcc'
          });
        });

        runProcess.on('error', async (err) => {
          clearTimeout(timeout);
          
          try {
            await fs.remove(filePath);
            await fs.remove(executablePath);
          } catch (e) {
            // Ignore cleanup errors
          }

          resolve({
            success: false,
            output: '',
            error: `C execution error: ${err.message}`,
            executionTime: Date.now() - startTime
          });
        });
      });

      compileProcess.on('error', async (err) => {
        try {
          await fs.remove(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }

        resolve({
          success: false,
          output: '',
          error: `C compilation error: ${err.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

module.exports = { 
  executeCode, 
  getAvailableLanguages,
  isCloudPlatform,
  platform: isVercel ? 'Vercel' : isRender ? 'Render' : isNetlify ? 'Netlify' : 'Local'
};