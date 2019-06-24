import { TraceEvent, TraceSource } from "./TraceSource";
import { format } from "../text/StringBuilder";

export class TraceEventData implements TraceEvent {
    source: TraceSource;
    level: number;
    message: any;
    args?: any[];

    constructor(source: TraceSource, level: number, message: any, args: any[]) {
        this.source = source;
        this.level = level;
        this.message = message;
        this.args = args;
    }

    toString() {
        return format(this.message, ...this.args);
    }
}
