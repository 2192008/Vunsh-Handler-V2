// Ancient logger; Must use chalk@4.1.2 as later versions use ESM only.
const chalk = require('chalk');
const moment = require('moment');

const logger = (type, ...input) => {
  if (!input || !input.length) return
  const text = input.map(a => typeof a === 'object' ? JSON.stringify(a) : a).reduce((a, b) => a + ' ' + b)
  const colorMatch = { info: 'blue', warn: 'yellow', err: 'red', good: 'green', gray: 'gray' }
  console.log(moment(Date.now()).format("llll"), "::", type ? chalk[colorMatch[type]](text) : text)
}

const log = (...text) => { logger(null, ...text) }
const logInfo = (...text) => { logger('info', ...text) }
const logWarn = (...text) => { logger('warn', ...text) }
const logUrgent = (...text) => { logger('err', ...text) }
const logGood = (...text) => { logger('good', ...text) }
const logGray = (...text) => { logger('gray', ...text) }

module.exports = { logger, log, logInfo, logWarn, logUrgent, logGood, logGray }