'use strict';

// --- Dependencies ---
var debug = require('debug')('arkivo:mailer');

var B  = require('bluebird');
var co = B.coroutine.bind(B);


module.exports = {
  name: 'mailer',

  description:
    'Sends Zotero attachments by mail.',

  parameters: {
    recipient: {
      mandatory: true,
      description: 'The recipient address.',
      validate: /^\w[\w\.+-]+@\w[\w\.-]+$/i
    }
  },

  process: co(function* (sync) {
    debug('[%s] processing subscription...', sync.id);
  })
};
