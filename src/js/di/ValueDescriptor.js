define([ "../declare", "./Descriptor", "../safe" ],

function(declare, Descriptor, safe) {
    return declare(Descriptor, {
        _value : undefined,
        _raw : false,
        constructor : function(value, raw) {
            this._value = value;
            this._raw = Boolean(raw);
        },

        activate : function(context, name) {
            context.enter(name, this);
            var v = this._raw ? this._value : context.parse(
                this._value,
                ".params");
            context.leave(this);
            return v;
        },

        isInstanceCreated : function() {
            return this._raw;
        },

        getInstance : function() {
            if (!this._raw)
                throw new Error("The instance isn't constructed");
            return this._value;
        },

        toString : function() {
            if (this._raw)
                return "@value {raw}";
            else
                return safe.isNull(this._value) ? "@value <null>" : "@value";
        }
    });
});