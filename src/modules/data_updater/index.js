var u = require('util'),
    path = require('path'),

    cronJob = require('cron').CronJob,
    vow = require('vow'),
    _ = require('lodash'),
    sha = require('sha1'),

    logger = require('../../logger')(module),
    config = require('../../config'),
    data = require('../data');

var job,
    marker;

module.exports = {

    init: function(master) {
        logger.debug('Init data updater for master process');

        job = new cronJob({
            cronTime: '*/30 * * * * *',
            onTick: function() {
                checkForUpdate(master);
            },
            start: false
        });

        return this;
    },

    start: function(worker) {
        logger.info('Start data updater for master process');
        job.start();

        return this;
    }
};

var checkForUpdate = function(master) {
    logger.debug('Check for update for master process start');

    var promise;

    if('production' === process.env.NODE_ENV) {
        promise = data.common.loadData(data.common.PROVIDER_YANDEX_DISK, {
            path: config.get('data:marker:disk')
        }).then(function(content) {
                return JSON.parse(content);
            });
    }else {
        promise = data.common.loadData(data.common.PROVIDER_FILE, {
            path: config.get('data:marker:file')
        });
    }

    return promise.then(function(content) {
        if(!content) {
            return;
        }

        if(!marker) {
            marker = content;
            return;
        }

        if(marker.sitemap !== content.sitemap ||
            marker.docs !== content.docs ||
            marker.libraries !== content.libraries) {

            master.softRestart();
        }

        marker = content;
    });
};