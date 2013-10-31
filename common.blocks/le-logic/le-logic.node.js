/*global modules:false */

modules.define(
    'le-logic', ['inherit', 'objects', 'yana-logger', 'le-jspath'],
    function(provide, inherit, objects, logger, leJspath) {

    provide({

        _logicCache: {},

        generateKey: function(data) {
            return data.lang + ':' + data.req.path;
        },

        getLogicCache: function(data) {
            return this._logicCache[this.generateKey(data)];
        },

        setLogicCache: function(data, value) {
            this._logicCache[this.generateKey(data)] = value;
        },

        resolveMethodology: function(data) {
            var result = this.getLogicCache(data);

            if(result) return result;

            var type = data.page,
                res = leJspath.findCategoryAndIdByUrl(data.req.path, type, data.lang),
                rootId = leJspath.findRootPostId(type, data.lang);

            result = {
                type: type,
                id: (res && res.id) || rootId,
                category: res && res.category,
                query: {
                    predicate: '.' + data.lang + '{.type === $type}{.id !== $rootId}',
                    substitution: { type: type, rootId: rootId }
                }
            };

            this.setLogicCache(data, result);

            return result;
        },

        resolveArticles: function(data) {
            var result = this.getLogicCache(data);

            if(result) return result;

            var type = data.page,
                res = leJspath.findCategoryAndIdByUrl(data.req.path, type, data.lang);

            result = {
                type: type,
                id: res && res.id,
                category: res && res.category,
                query: {
                    predicate: '.' + data.lang + '{.type === $type}',
                    substitution: { type: type }
                }
            };

            this.setLogicCache(data, result);

            return result;
        },

        resolveNews: function(data) {
            var result = this.getLogicCache(data);

            if(result) return result;

            var type = data.page,
                res = leJspath.findCategoryAndIdByUrl(data.req.path, type, data.lang);

            result = {
                type: type,
                id: res && res.id,
                category: res && res.category,
                query: {
                    predicate: '.' + data.lang + '{.type === $type}',
                    substitution: { type: type }
                }
            };

            this.setLogicCache(data, result);

            return result;
        },

        resolveTools: function(data) {
            var result = this.getLogicCache(data);

            if(result) return result;

            var type = data.page,
                res = leJspath.findCategoryAndIdByUrl(data.req.path, type, data.lang),

                id = res && res.id,
                category = res && res.category,
                query = null,
                isOnlyOnePost = false;

            if(category) {
                var predicate = '.' + data.lang + '{.type === $type}' +
                    '{.categories === $category || .categories.url === $category}';

                var rootId = leJspath.findRootPostIdByCategory(type, category, data.lang);
                if(rootId) {
                    predicate +=  '{.id !== "' + rootId + '"}';
                }

                if(!id && rootId){
                    id = rootId;
                }

                query = {
                    predicate: predicate,
                    substitution: { type: type, category: category }
                };

                //проверка на то, что для данного инструмента есть только один пост
                //если это так, то показываем его в развернутом виде а меню постов прячем
                var source = leJspath.find(query.predicate, query.substitution);
                if(source.length == 1) {
                    isOnlyOnePost = true;
                    id = source[0].id;
                }

            }else {
                id = leJspath.findRootPostId(type, data.lang);
                if(!id) {
                    query = {
                        predicate: '.' + data.lang + '{.type === $type}',
                        substitution: { type: type }
                    }
                }
            }

            result = {
                type: type,
                id: id,
                category: category,
                query: query,

                isOnlyOnePost: isOnlyOnePost
            };

            this.setLogicCache(data, result);

            return result;
        },

        resolveLibraries: function(data) {
            var result = this.getLogicCache(data);

            if(result) return result;

            var type = data.page,
                lib = data.params['lib'] || null,
                version = data.params['version'] || null,
                category = data.params['category'] || null,
                id = data.params['id'],

                predicate = '.' + data.lang + '{ .type == $type }',
                substitution = { type: type },
                query = null;

            id = leJspath.findByTypeAndUrl(type, id || category, data.lang);

            id = id && id.id;

            if(lib){
                predicate += '{.categories ^== $category || .categories.url ^== $category }';
                substitution['category'] = lib;


                if(version){
                    substitution['category'] = lib + '/' + version ;
                }

                //поиск корневой статьи для библиотеки и показ ее если не указан id другого поста для библиотеки явно
                var rootId = leJspath.find(predicate + '{.root == "true"}.id', substitution);
                rootId = rootId.length > 0 ? rootId[0] : null;

                if(rootId) {
                    predicate += '{.id !== $rootId}';
                    substitution['rootId'] = rootId;
                    id = id || rootId;
                }
            }

            query = { predicate: predicate, substitution: substitution };

            result = {
                type: type,
                id: id,
                category: category,
                query: query,

                lib: lib,
                version: version
            };

            this.setLogicCache(data, result);

            return result;
        },

        resolveCustomPage: function(data) {
            var result = this.getLogicCache(data);

            if(result) return result;

            var type = 'page',
                res = leJspath.findCategoryAndIdByUrl('/' + type + data.req.path, type, data.lang);

            result = {
                type: type,
                id: res && res.id,
                category: res && res.category,
                query: {
                    predicate: '.' + data.lang + '{.type === $type}',
                    substitution: { type: type }
                }
            };

            this.setLogicCache(data, result);

            return result;
        }
    });
});