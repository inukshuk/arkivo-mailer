'use strict';

// --- Dependencies ---
var debug      = require('debug')('arkivo:mailer');
var assert     = require('assert');

var slice      = Array.prototype.slice;
var properties = Object.defineProperties;

var arkivo = require('arkivo');
var common = arkivo.common;
var config = arkivo.config;
var extend = common.extend;

var B      = require('bluebird');
var co     = B.coroutine;


/**
 * Arkivo Mailer.
 *
 * @class Mailer
 * @constructor
 */
function Mailer(options, sync) {
  assert(sync);
  assert(sync.subscription);

  var defaults = config.has('mailer')
    ? extend({}, Mailer.defaults, config.get('mailer'))
    : Mailer.defaults;

  this.options = options || {};
  this.options.mimetypes = defaults.mimetypes.slice();

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
  }
});


/**
 * Send the given item.
 *
 * @method send
 * @return {Promise}
 */
Mailer.prototype.create = function (item) {
  this.debug('sending item %s...', item.key);
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
    .get('data');
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
  var i, ii, item, child, data, collection = {};

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

      collection.push({ item: item, child: child, data: data });

    } catch (error) {
      this.debug('failed to collect item: %s', error.message);
      debug(error.stack);

      continue;
    }
  }

  return collection;
});


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