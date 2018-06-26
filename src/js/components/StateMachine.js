define([ "dojo/_base/declare", "../safe", "../text/format" ], function(declare, safe, format) {
    return declare(null, {
        states : null,
        
        current : null,

        constructor : function(opts) {
            safe.argumentNotNull(opts, "opts");
            safe.argumentNotNull(opts.states, "opts.states");
            safe.argumentNotNull(opts.initial, "opts.initial");
            
            this.states = opts.states;
            this.current =  opts.initial;
            
            if (safe.isNull(this.states[this.current]))
                throw new Error("Invalid initial state " + this.current);
        },
        
        move : function(input, noThrow) {
            safe.argumentNotNull(input, "input");
            
            var next = this.states[this.current][input];
            if(safe.isNull(next)) {
                if (noThrow)
                    return false;
                else
                    throw new Error(format("Invalid transition {0}-{1}->?", this.current, input));
            } else {
                this.current = next;
                return true;
            }
        }
    });
});