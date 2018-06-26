define(["dojo/_base/declare", "dojo/_base/array", "../safe", "./StoreAdapter"], function(declare, array, safe ,AdapterStore){
    return declare([AdapterStore], {
        _attrs : null,
        
        constructor : function(opts) {
            safe.argumentNotEmptyArray(opts.attrs, "opts.attrs");
            this._attrs = opts.attrs;
        },
        
        mapItem : function(item) {
            var result = {};
            array.forEach(this._attrs, function(p) {
                result[p] = item.get(p);
            });
            return result;
        }
    });
    
});