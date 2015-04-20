'use strict';

// --- Dependencies ---
var debug      = require('debug')('arkivo:mailer');
var assert     = require('assert');

var slice      = Array.prototype.slice;
var properties = Object.defineProperties;

var config = require('arkivo/lib/config');
var common = require('arkivo/lib/common');
var extend = common.extend;
var md5    = common.md5;
var base64 = common.base64;

var B  = require('bluebird');
var co = B.coroutine;

var nm = require('nodemailer');

var version = require('../package.json').version;

/**
 * Arkivo Mailer.
 *
 * @class Mailer
 * @constructor
 */
function Mailer(options, sync) {
  assert(sync);
  assert(sync.subscription);

  this.options = extend({}, Mailer.defaults);

  if (config.has('mailer'))
    extend(this.options, config.get('mailer'));

  extend(this.options, options);

  this.sync  = sync;
}

/**
 * Mailer default configuration.
 *
 * @property defaults
 * @type Object
 * @static
 */
Mailer.defaults = {

  from: 'arkivo@zotero.org',
  subject: 'Zotero Update',

  mimetypes: [
    'application/pdf'
  ]
};


properties(Mailer.prototype, {
  /**
   * @property created
   * @type Array
   */
  created: {
    get: function get$created() {
      return this.collect(this.sync.created);
    }
  },

  /**
   * @property updated
   * @type Array
   */
  updated: {
    get: function get$updated() {
      return this.collect(this.sync.updated);
    }
  },

  transport: {
    get: function () {
      return nm.createTransport(this.options.transport);
    }
  },

  name: {
    get: function () { return 'Arkivo-Mailer ' + version; }
  }
});


/**
 * Send the given item.
 *
 * @method send
 * @return {Promise}
 */
Mailer.prototype.send = function (item) {
  this.debug('sending item %s...', item.key);

  return new B(function (resolve, reject) {
    this.transport.sendMail({
      xMailer: false,
      headers: {
        'X-Mailer': this.name
      },

      to:      this.options.recipient,
      from:    this.options.from,
      subject: this.options.subject,

      text: this.options.text,
      html: this.options.html,

      attachments: item.attachments

    }, function (error, info) {
      if (error) return reject(error);

      // Todo: check mail was delivered to recipient

      resolve(info);
    });

  }.bind(this));
};


/**
 * Downloads the item's attachment.
 * @method download
 * @return {Promise}
 */
Mailer.prototype.download = function (item) {
  this.debug('downloading attachment %s...', item.key);

  return this
    .sync
    .attachment(item)
    .then(function (message) {

      if (!message.data)
        throw Error('attachment is blank');
      if (md5(message.data) !== item.data.md5)
        throw Error('attachment checksum mismatch');

      return message.data;
    });
};


/**
 * Collect Zotero items with attachments that can
 * be sent by mail.
 *
 * @method collect
 * @param {Array} keys The list of Zotero keys to look at.
 *
 * @return {Promise<Array>} The collected items.
 */
Mailer.prototype.collect = co(function* (keys) {
  var i, ii, item, child, data, collection = [];

  for (i = 0, ii = keys.length; i < ii; ++i) {
    try {
      item = this.expand(keys[i]);

      if (!item) {
        this.debug('cannot expand "%s": item missing', keys[i]);
        continue;
      }

      // Duplicate items are possible, because child items are
      // expanded to their parents; therefore, if a sync session
      // includes an item and one or more of its children, we
      // might process the item multiple times!
      if (collection[item.key]) continue;

      // Skip items without attachments!
      if (!item.children) continue;

      child = this.select(item.children);

      if (!child) {
        this.debug('skipping "%s": no suitable attachments found', item.key);
        continue;
      }

      data = yield this.download(child);

      collection.push(this.convert(item, child, data));

    } catch (error) {
      this.debug('failed to collect item: %s', error.message);
      debug(error.stack);

      continue;
    }
  }

  return collection;
});

/**
 * Converts items to syntax used by the mailer.
 *
 * @method convert
 * @return Object The converted item.
 */
Mailer.prototype.convert = function (item, child, data) {
  return {
    attachments: [
      {
        filename: child.data.filename,
        contentType: child.data.contentType,
        content: base64(data),
        encoding: 'base64'
      }
    ]
  };
};

/**
 * Selects the first suitable attachment item.
 *
 * @method select
 * @param {Array} items
 * @return {Object}
 */
Mailer.prototype.select = function (items) {
  if (!items) return undefined;
  if (!items.length) return undefined;

  var i, ii, item, next;

  for (i = 0, ii = items.length; i < ii; ++i) {
    next = items[i];

    if (next.data.itemType !== 'attachment')
      continue;

    if (next.data.linkMode !== 'imported_file')
      continue;

    if (this.options.mimetypes.indexOf(next.data.contentType) < 0)
      continue;

    if (item) {

      if (item.dateAdded < next.dateAdded) continue;

    }

    item = next;
  }

  return item;
};


/**
 * Returns the Zotero item for key; if the item has
 * a parent, returns parent item instead.
 *
 * @method expand
 * @private
 */
Mailer.prototype.expand = function (key) {
  var item = this.sync.items[key];

  if (item && item.data.parentItem)
    return this.expand(item.data.parentItem);

  return item;
};

Mailer.prototype.debug = function (message) {
  debug.apply(null, [
    '[%s] ' + message, this.sync.id
  ].concat(slice.call(arguments, 1)));

  return this;
};

// --- Exports ---
module.exports = Mailer;
