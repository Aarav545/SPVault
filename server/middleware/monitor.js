// Request logging middleware: logs all requests/responses to file with automatic PPI censoring
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'requests.log');

// Patterns to censor sensitive data (passwords, PINs, tokens, emails)
const censorPatterns = [
  { pattern: /"password"\s*:\s*"[^"]*"/gi, replacement: '"password": "[CENSORED]"' },
  { pattern: /"pin"\s*:\s*"[^"]*"/gi, replacement: '"pin": "[CENSORED]"' },
  { pattern: /"token"\s*:\s*"[^"]*"/gi, replacement: '"token": "[CENSORED]"' },
  { pattern: /"email"\s*:\s*"([^"]*)"/gi, replacement: (match, email) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `"email": "[CENSORED]@${domain}"`;
    }
    return `"email": "${localPart.substring(0, 2)}***@${domain}"`;
  }},
];

// Function to censor sensitive data in request/response bodies
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

// Logging middleware: intercepts requests and responses, logs them to file
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;

  // Capture and censor request body
  const requestBody = req.body ? { ...req.body } : {};
  const censoredRequestBody = censorSensitiveData(requestBody);

  // Log request entry
  const logEntry = {
    timestamp,
    type: 'REQUEST',
    method,
    url,
    ip,
    body: JSON.parse(censoredRequestBody)
  };

  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

  // Override res.send to capture and log responses
  const originalSend = res.send;
  res.send = function(data) {
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
    originalSend.call(this, data);
  };

  next();
};

module.exports = { logRequest };

