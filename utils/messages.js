var moment = require('moment-timezone');

function formatMessage(username, text) {
  return {
    // object in es6
    username,
    text,
    // hours , minutes , am or pm 
    time: moment().tz('Asia/Riyadh').format('h:mm a')
  };
}

module.exports = formatMessage;
