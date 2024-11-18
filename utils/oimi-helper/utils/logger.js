const log = require('npmlog')
log.prefixStyle = { prefix: 'oimi' }
log.level = process.env.LOG_LEVEL || 'silent'
module.exports = log
