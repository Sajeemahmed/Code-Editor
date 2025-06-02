const express = require('express');
const router = express.Router();
const { executeCode, getAvailableLanguages, isCloudPlatform, platform } = require('../utils/codeRunner');

// GET endpoint to check platform capabilities
router.get('/status', async (req, res) => {
  try {
    const availableLanguages = await getAvailableLanguages();
    
    res.json({
      success: true,
      platform: platform,
      isCloud: isCloudPlatform,
      serverTime: new Date().toISOString(),
      capabilities: availableLanguages,
      limits: {
        timeout: '15 seconds',
        memoryLimit: isCloudPlatform ? 'Platform dependent' : 'System dependent',
        supportedLanguages: Object.keys(availableLanguages.languages).filter(
          lang => availableLanguages.languages[lang].available
        )
      }
    });
  } catch (error) {
    console.error('Error checking platform status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check platform status', 
      details: error.message 
    });
  }
});

// GET endpoint to check available languages
router.get('/languages', async (req, res) => {
  try {
    const availableLanguages = await getAvailableLanguages();
    res.json({
      success: true,
      ...availableLanguages
    });
  } catch (error) {
    console.error('Error checking available languages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check available languages', 
      details: error.message 
    });
  }
});

// POST endpoint to execute code
router.post('/', async (req, res) => {
  try {
    const { code, language, input } = req.body;
    
    // Validation
    if (!code || !language) {
      return res.status(400).json({ 
        success: false,
        error: 'Code and language are required',
        details: 'Both code and language parameters must be provided'
      });
    }

    // Validate language
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'c'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}`,
        details: `Supported languages are: ${supportedLanguages.join(', ')}`
      });
    }

    // Check code length (prevent abuse)
    if (code.length > 50000) { // 50KB limit
      return res.status(400).json({
        success: false,
        error: 'Code too long',
        details: 'Code must be less than 50KB'
      });
    }

    // Log execution attempt
    console.log(`[${new Date().toISOString()}] Executing ${language} code on ${platform}`);
    
    const startTime = Date.now();
    const result = await executeCode(code, language, input || '');
    
    // Add metadata to response
    const response = {
      ...result,
      language: language,
      platform: platform,
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime
    };

    // Log result
    console.log(`[${new Date().toISOString()}] Execution completed - Success: ${result.success}, Time: ${result.executionTime}ms`);
    
    res.json(response);
  } catch (error) {
    console.error('Execution error:', error);
    
    // Handle specific error types
    let errorMessage = 'Code execution failed';
    let statusCode = 500;
    
    if (error.message.includes('not supported') || error.message.includes('not available')) {
      statusCode = 503; // Service Unavailable
      errorMessage = 'Language not supported on this platform';
    } else if (error.message.includes('Unsupported language')) {
      statusCode = 400; // Bad Request
      errorMessage = error.message;
    } else if (error.message.includes('timeout')) {
      statusCode = 408; // Request Timeout
      errorMessage = 'Code execution timeout';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage, 
      details: error.message,
      platform: platform,
      timestamp: new Date().toISOString()
    });
  }
});

// POST endpoint for batch execution (useful for testing)
router.post('/batch', async (req, res) => {
  try {
    const { executions } = req.body;
    
    if (!Array.isArray(executions) || executions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Executions array is required'
      });
    }

    if (executions.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 executions per batch'
      });
    }

    const results = [];
    
    for (const execution of executions) {
      const { code, language, input, name } = execution;
      
      try {
        const result = await executeCode(code, language, input || '');
        results.push({
          name: name || `Execution ${results.length + 1}`,
          ...result,
          language,
          platform
        });
      } catch (error) {
        results.push({
          name: name || `Execution ${results.length + 1}`,
          success: false,
          error: error.message,
          language,
          platform
        });
      }
    }

    res.json({
      success: true,
      results,
      platform,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch execution failed',
      details: error.message
    });
  }
});

module.exports = router;