arkivo-mailer
=============
[![Build Status](https://travis-ci.org/inukshuk/arkivo-mailer.svg?branch=master)](https://travis-ci.org/inukshuk/arkivo-mailer)
[![Coverage Status](https://coveralls.io/repos/inukshuk/arkivo-mailer/badge.svg)](https://coveralls.io/r/inukshuk/arkivo-mailer)

An [Arkivo](https://github.com/inukshuk/arkivo) plugin to send
Zotero attachments by e-mail.

Quickstart
----------
Install `arkivo` and `arkivo-mailer` with NPM:

    $ npm install arkivo arkivo-mailer

Needless to say, you can also install both modules globally.

Add a minimal configuration file, e.g., `config/default.json`:

    {
      "arkivo": {
        "plugins": [ "arkivo-mailer" ]
      }
    }

You can also configure the plugin's default settings in your
config file:

    {
      "arkivo": {
        "plugins": [ "arkivo-mailer" ],

        "mailer": {
          "mimetypes" [
            "application/pdf"
          ]
        }
      }
    }

For more configuration options, please consult Arkivo's
[documentation](https://github.com/inukshuk/arkivo#configuration).

Now you start your Arkivo service:

    $ $(npm bin)/arkivo up

To ensure that the mailer plugin has been loaded, you can
check the output of:

    $ $(npm bin)/arkivo-plugins list

