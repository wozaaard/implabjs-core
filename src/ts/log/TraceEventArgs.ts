import * as TraceSource from './TraceSource'

class TraceEventArgs {
    source : TraceSource

    message : string

    level : number

    constructor(source: TraceSource, message: string) {
        this.source = source;
        this.message = message;
    }
}

namespace TraceEventArgs {

}

export = TraceEventArgs