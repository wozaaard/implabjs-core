import * as TraceSource from './TraceSource'

class TraceEvent {
    readonly source: TraceSource;

    readonly level: Number;

    readonly arg: any;

    constructor(source: TraceSource, level: Number, arg: any) {
        this.source = source;
        this.level = level;
        this.arg = arg;
    }
}

namespace TraceEvent {
    
}

export = TraceEvent