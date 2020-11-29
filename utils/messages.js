const moment = require('moment');

function formatMessage(username, text) {
  return {
    // object in es6
    username,
    text,
    // hours , minutes , am or pm 
    time: moment().format('h:mm a')
  };
}

module.exports = formatMessage;
