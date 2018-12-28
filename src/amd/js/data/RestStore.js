define([ "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array",
    "../safe", "dojo/when", "dojo/Deferred", "dojo/store/util/QueryResults" ], function(declare,
    lang, array, safe, when, Deferred, QueryResults) {
    /**
     * @module implab/data/RestStore
     * 
     * Реализует шаблон репозитария dojo/store над уже имеющимся хранилищем. При получении и
     * отправке данных в нижележащие хранилище используется implab/data/MapSchema для преобразования
     * данных.
     */
    return declare(null, {

        itemsType : null,

        _dataContext : null,
        
        _store : null, // backing store
        _cache : null,

        constructor : function(options) {
            options = options || {};

            this._cache = {};
            if (options.store)
                this._store = options.store;
            if (options.dataContext)
                this._dataContext = options.dataContext;
        },
        
        setDataContext : function(v) {
          this._dataContext = v;
        },
        
        getDataContext : function() {
            return this._dataContext;
        },
        
        // READ
        get : function(id) {
            var me = this;
            var cache = me.getCacheEntry(id);
            if (cache)
                return cache;
            else
                return when(me._store.get(id), function(data) {
                    return me._mapToObject(id, data);
                });
        },

        query : function(query, options) {
            var me = this;
            var d = me._store.query(query, options);
            var result = QueryResults(when(d, function(data) {
                return array.map(data, function(item) {
                    return me._mapToObject(me._store.getIdentity(item), item);
                });
            }));
            result.total = d.total;
            return result;
        },

        getIdentity : function(object) {
            return object.getId();
        },

        // UPDATE
        put : function(object, directives) {
            return this._store.put(this._mapFromObject(object), directives);
        },

        // INSERT
        add : function(object, directives) {
            var me = this;
            // добавляем в хранилище данные, сохраняем в кеше объект с
            // полученным идентификатором
            return when(
                me._store.add(this._mapFromObject(object), directives),
                function(id) {
                    object.attach(id, me);
                    me.storeCacheEntry(id, object);
                    return id;
                });
        },

        // DELETE
        remove : function(id) {
            var me = this;
            return when(me._store.remove(id), function() {
                me.removeCacheEntry(id);
            });
        },

        _mapToObject : function(id, data) {
            var instance = this.createInstance(id);
            this.populateInstance(instance, data);
            return instance;
        },

        _mapFromObject : function(object) {
            return this.serializeInstance(object);
        },

        getCacheEntry : function(id) {
            safe.argumentNotNull(id, "id");
            id = id.toString();

            return this._cache[id];
        },

        storeCacheEntry : function(id, object) {
            safe.argumentNotNull(id, "id");
            id = id.toString();
            
            this._cache[id] = object;
        },

        removeCacheEntry : function(id) {
            safe.argumentNotNull(id, "id");
            id = id.toString();
            delete this._cache[id];
        },

        /** Создает экземпляр сущности с указанным идентификатором, либо извлекает из кеша, если таковая уже имеется.
         * @remarks
         * Технически сюда можно было бы дополнительно передать данные для ининциализации объекта,
         * но концептуально это не верно, поскольку процесс чтения объекта состоит из двух этапов:
         *  1. Создание пустого объекта (createInstance)
         *  2. Заполнение объекта при помощи схемы отображения (populateInstance)
         * при этом первый этап может быть выполнен за долго до второго, например,
         * при создании заглушек в процессе установления ссылок между объектами.
         */
        createInstance : function(id) {
            var instance = this.getCacheEntry(id);
            if (!instance) {
                instance = this.createInstanceImpl(id);
                this.storeCacheEntry(id, instance);
            }
            return instance;
        },

        /** Непосредственно создает экземпляр сущнсти, т.е. является фабричным методом.
         * @param {String} id идентификатор создаваемого экземпляра.
         */
        createInstanceImpl : function(id) {
            var opts = {
                dataContext : this.getDataContext(),
                id : id
            };

            return new this.itemsType(opts);
        },

        populateInstance : function(instance, data) {
            this.itemsType.readData(instance, data,this.getDataContext());
            if (instance.onPopulate)
                instance.onPopulate();
        },

        serializeInstance : function(instance) {
            var data = {};
            this.itemsType.writeData(instance, data, this.getDataContext());
            return data;
        }

    });
});