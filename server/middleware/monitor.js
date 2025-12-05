const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'requests.log');

// Patterns to censor (PPI - Personally Identifiable Information)
const censorPatterns = [
  { pattern: /"password"\s*:\s*"[^"]*"/gi, replacement: '"password": "[CENSORED]"' },
  { pattern: /"pin"\s*:\s*"[^"]*"/gi, replacement: '"pin": "[CENSORED]"' },
  { pattern: /"token"\s*:\s*"[^"]*"/gi, replacement: '"token": "[CENSORED]"' },
  { pattern: /"email"\s*:\s*"([^"]*)"/gi, replacement: (match, email) => {
    // Partially censor email (show first 2 chars and domain)
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `"email": "[CENSORED]@${domain}"`;
    }
    return `"email": "${localPart.substring(0, 2)}***@${domain}"`;
  }},
];

// Function to censor sensitive data
function censorSensitiveData(data) {
  let censored = JSON.stringify(data);
  
  censorPatterns.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'function') {
      censored = censored.replace(pattern, replacement);
    } else {
      censored = censored.replace(pattern, replacement);
    }
  });
  
  return censored;
}

// Logging middleware
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;

  // Capture request body (will be censored)
  const requestBody = req.body ? { ...req.body } : {};
  const censoredRequestBody = censorSensitiveData(requestBody);

  // Log request
  const logEntry = {
    timestamp,
    type: 'REQUEST',
    method,
    url,
    ip,
    body: JSON.parse(censoredRequestBody)
  };

  // Write to log file
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    // Log response
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch (e) {
      responseData = { raw: data.toString().substring(0, 100) };
    }

    const censoredResponse = censorSensitiveData(responseData);
    const responseLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'RESPONSE',
      method,
      url,
      statusCode: res.statusCode,
      body: JSON.parse(censoredResponse)
    };

    fs.appendFileSync(logFile, JSON.stringify(responseLogEntry) + '\n');

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

module.exports = { logRequest };

