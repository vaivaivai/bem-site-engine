var path = require('path'),
    vow = require('vow'),
    fs = require('fs'),
    express = require('express'),
    config = require('./config'),
    logger = require('./logger')(module),
    router = require('./router'),
    middleware = require('./middleware'),
    app = express(),
    socket = config.get('app:socket'),
    port = config.get('app:port') || process.env.port || 8080;

function run() {
    var leApp = require('./le-modules').leApp,
        deferred = vow.defer();

    return leApp.run()
        .then(function() {
            router.init();

            if (process.env.NODE_ENV !== 'production') {
                var enbServer = require('enb/lib/server/server-middleware'),
                    rootPath = path.resolve(__dirname, '..');

                app.use(enbServer.createMiddleware({ cdir: rootPath }));
                app.use(express.static(rootPath));
                app.use(express.favicon(path.resolve(rootPath, 'www/favicon.ico')));
            }

            app.use(express.query())
                .use(middleware.prefLocale(config.get('app:languages'), config.get('app:defaultLanguage')))
                .use(middleware.logger())
                .use(middleware.router(router.router))
                .use(middleware.reloadCache())
                .use(middleware.page());

            if (config.get('forum')) {
                var forum = require('bem-forum/src/middleware/forum'),
                    forumConfig = {
                        github: {
                            api: config.get('github:common'),
                            auth: config.get('github:auth')
                        },
                        repo: config.get('forum:repo'),
                        route: config.get('forum:route')
                    },
                    BEMHTML = require('./bundles/desktop.bundles/common/_common.bemhtml').BEMHTML;

                app.use(forum(forumConfig, BEMHTML));
            }

            app.use(middleware.error());

            app.listen(port || socket, function(err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                if (socket) {
                    try {
                        fs.chmod(socket, '0777');
                    } catch(e) {}
                }

                deferred.resolve();
            });

            return deferred.promise();
        });
}

exports.run = run;

if (!module.parent) {
    run()
        .then(function() {
            logger.info('start application on %s %s', socket && 'socket' || port && 'port', socket || port);
        })
        .fail(function(err) {
            logger.error(err);
        });
}
