'use strict';

// --- Dependencies ---
var B  = require('bluebird');
var co = B.coroutine.bind(B);

var Mailer = require('./mailer');

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
    var mailer = new Mailer(this.options, sync);

    mailer.debug('start processing subscription...');

    var created = yield mailer.created;
    var updated = yield mailer.updated;

    yield B

      .map(created.concat(updated), function (item) {
        return mailer.send(item);
      }, { concurrency: 1 })

      .tap(function (items) {
        if (items.length)
          mailer.debug('sent %d item(s)', items.length);
        else
          mailer.debug('no items were sent');
      });
  })
};
