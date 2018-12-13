define([ "dojo/_base/declare", "../safe" ], function(declare, safe) {
    return declare(null, {
        /**
         * Отображение одного типа объектов в другой.
         * 
         * @remarks Отображения являются односторонними, т.е. позволяют
         *          перенести часть содержимого одного объекта в другой. Каждая
         *          схема отображения строится из набора примитивных
         *          отображений, которые будут применены в произвольном порядке.
         */
        _schema : null,

        constructor : function(schema) {
            this._schema = schema;
        },

        /**
         * Осуществляет отображение одного объекта в другой
         * 
         * @src{Object} Исходный объект из которого будут взяты данные
         * @dst{Object}
         */
        map : function(src, dst, ctx) {
            safe.argumentNotNull(src, "src");
            safe.argumentNotNull(dst, "dst");

            for ( var p in this._schema) {
                var mapper = this._schema[p];
                if (mapper instanceof Function) {
                    dst[p] = mapper(src[p]);
                } else if (mapper && mapper.map) {
                    mapper.map(src, dst, p, ctx);
                } else {
                    this._defaultMapper(src, dst, p, mapper, ctx);
                }
            }
        },

        _defaultMapper : function(src, dst, prop, opts) {
            if (typeof (opts) == "string") {
                if (opts in src)
                    dst[prop] = src[opts];
            } else if (opts && opts.type instanceof Function) {
                if (src[prop] instanceof opts.type)
                    dst[prop] = src[prop];
                else
                    dst[prop] = this._isPrimitiveType(opts.type) ? opts.type
                        .call(null, src[prop]) : new opts.type(src[prop]);

            } else {
                if (!(prop in src))
                    if (opts && opts.required)
                        throw new Error("The " + prop + "is missing");
                    else
                        return;
                dst[prop] = src[prop];
            }
        },

        _isPrimitiveType : function(type) {
            return (type === String || type === Number || type === Boolean
                || type === Number || type === Date);
        }

    });

});