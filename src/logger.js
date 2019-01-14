const Log = require('log');

// Set the log instance
const Logger = new Log(process.env.NODE_MESSENGER_PDF_LOG_LEVEL || process.env.HUBOT_LOG_LEVEL || 'info');

module.exports = Logger;