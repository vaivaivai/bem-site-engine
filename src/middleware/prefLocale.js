var logger = require('../logger')(module);

module.exports = function(langs, def) {
    return function(req, res, next) {
        logger.debug('middleware execute for url %s', req._parsedUrl.path);

        var headers = req.headers,
            host = headers.host,
            lang = host ? host.split('.')[0] : def;

        req.prefLocale = langs.indexOf(lang) > -1 ? lang : def;

        next();
    };
};