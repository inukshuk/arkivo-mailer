'use strict';

var chai   = require('chai');
var expect = chai.expect;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

var arkivo  = require('arkivo');
var plugins = arkivo.plugins;
var Plugin  = plugins.Plugin;
var mailer  = require('../lib/plugin');

describe('Mailer Plugin', function () {

  before(function () { plugins.add(mailer); });
  after(function () { plugins.reset(); });

  it('is available', function () {
    expect(plugins.available.mailer).to.be.an('object');
  });

  it('can be used', function () {
    expect(plugins.use('mailer')).to.be.instanceof(Plugin);
  });

  it('is configurable', function () {
    expect(plugins.use('mailer').configurable).to.be.true;
  });

  it('has a summary', function () {
    expect(plugins.use('mailer')).to.have.property('summary');
  });

  describe('configuration', function () {
    var config = {};
    var usage = plugins.use.bind(plugins, 'mailer', config);

    it('must be configured', function () {
      expect(usage).to.throw(Error);
    });

    it('must contain a recipient', function () {
      config.recipient = 'ghost@example.com';
      expect(usage).to.not.throw(Error);
    });

    it('recipient must look somewhat like an address', function () {
      config.recipient = 'abcdefg';
      expect(usage).to.throw(Error);

      config.recipient = 'abc@defg sfs';
      expect(usage).to.throw(Error);

      config.recipient = 'abc@defg';
      expect(usage).to.not.throw(Error);
    });
  });
});
