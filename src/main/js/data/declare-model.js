define([ "dojo/_base/declare", "./_ModelBase", "./MapSchema" ], function(
    declare, _ModelBase, MapSchema) {
    /**
     * Создает новый класс, унаследованный от ./ModelBase, с указанной схемой
     * отображения данных.
     * 
     * @details Модель представляет собой объект, живущий в рамках контекста
     *          данных, также имеющий две схемы отображения: из модели хранения
     *          в источнике данных (toObjectMap) и наооборот в модель хранения в
     *          источнике данных (fromObjectMap).
     * 
     * Описание схемы выглядит следующим образом
     * <pre>
     * {
     *      name : null, // отображение в обе стороны без преобразования
     *      
     *      age : Number,   // при преобразоваении к объекту поле будет преобразовано dst.age = Number(src.age)
     *                      // обратное преобразование отсутстсвует
     *      
     *      age : [Number, null] // тоже самое что и age : Number
     *      
     *      date : [Date, function(v) { return v.toString() }] // указывается преобразование в одну и в другую сторону
     * }
     * <pre>
     */
    return function(schema, mixins, opts) {
        var fromObjectSchema = {}, toObjectSchema = {};
        if (schema !== null && schema !== undefined) {
            for ( var p in schema) {
                var mapper = schema[p];

                if (mapper instanceof Array) {
                    toObjectSchema[p] = mapper[0];
                    fromObjectSchema[p] = mapper[1];
                } else {
                    toObjectSchema[p] = mapper;
                    fromObjectSchema[p] = null;
                }
            }
        }

        if (arguments.length < 3) {
            opts = mixins;
            mixins = undefined;
        }

        var base = [ _ModelBase ];
        if (mixins) {
            if (mixins instanceof Array)
                base = base.concat(mixins);
            else
                base.push(mixins);
        }

        var model = declare(base, opts);

        model.toObjectMap = new MapSchema(toObjectSchema);

        model.fromObjectMap = new MapSchema(fromObjectSchema);

        model.readData = function(that, data, context) {
            model.toObjectMap.map(data, that, context);
        };

        model.writeData = function(that, data, context) {
            data = data || {};
            model.fromObjectMap.map(that, data, context);
        };

        return model;
    };
});