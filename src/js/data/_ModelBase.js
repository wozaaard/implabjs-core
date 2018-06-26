define(["dojo/_base/declare"], function(declare) {
    
    return declare(null, {
        dataContext : null,
        idField : "id",
        loaded : false,
        
        constructor : function(opts){
            if (opts) {
                if(opts.dataContext)
                    this.dataContext = opts.dataContext;
                if(opts.id)
                    this[this.idField] = opts.id;
            }
        },
        
        getId : function() {
            return this[this.idField];
        },
        
        attach : function(id, dc) {
            if (this.dataContext)
                throw new Error("The object is already attached");
            this[this.idField] = id;
            this.dataContext = dc;
        },
        
        isAttached : function() {
            return this.dataContext ? true : false; 
        },
        
        onPopulate : function() {
            this.loaded = true;
        }
        
    });
});