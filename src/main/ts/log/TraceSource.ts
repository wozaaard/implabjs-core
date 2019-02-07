import { Observable } from "../Observable";
import { Registry } from "./Registry";
import { format as _format } from "../text/StringFormat";

export const DebugLevel = 400;

export const LogLevel = 300;

export const WarnLevel = 200;

export const ErrorLevel = 100;

export const SilentLevel = 0;

export interface TraceEvent {
    readonly source: TraceSource;

    readonly level: number;

    readonly arg: any;
}

function format(msg) {
    if (typeof(msg) !== "string" || arguments.length === 1)
        return msg;
    return _format.apply(null, arguments);
}

export class TraceSource {
    readonly id: any;

    level: number;

    readonly events: Observable<TraceEvent>;

    _notifyNext: (arg: TraceEvent) => void;

    constructor(id: any) {

        this.id = id || new Object();
        this.events = new Observable(next => {
            this._notifyNext = next;
        });
    }

    protected emit(level: number, arg: any) {
        this._notifyNext({ source: this, level, arg });
    }

    isDebugEnabled() {
        return this.level >= DebugLevel;
    }

    debug(msg: string, ...args: any[]) {
        if (this.isEnabled(DebugLevel))
            this.emit(DebugLevel, format.apply(null, arguments));
    }

    isLogEnabled() {
        return this.level >= LogLevel;
    }

    log(msg: string, ...args: any[]) {
        if (this.isEnabled(LogLevel))
            this.emit(LogLevel, format.apply(null, arguments));
    }

    isWarnEnabled() {
        return this.level >= WarnLevel;
    }

    warn(msg: string, ...args: any[]) {
        if (this.isEnabled(WarnLevel))
            this.emit(WarnLevel, format.apply(null, arguments));
    }

    /**
     * returns true if errors will be recorded.
     */
    isErrorEnabled() {
        return this.level >= ErrorLevel;
    }

    /**
     * Traces a error.
     *
     * @param msg the message.
     * @param args parameters which will be substituted in the message.
     */
    error(msg: string, ...args: any[]) {
        if (this.isEnabled(ErrorLevel))
            this.emit(ErrorLevel, format.apply(null, arguments));
    }

    /**
     * Checks whether the specified level is enabled for this
     * trace source.
     *
     * @param level the trace level which should be checked.
     */
    isEnabled(level: number) {
        return (this.level >= level);
    }

    /**
     * Traces a raw event, passing data as it is to the underlying listeners
     *
     * @param level the level of the event
     * @param arg the data of the event, can be a simple string or any object.
     */
    traceEvent(level: number, arg: any) {
        if (this.isEnabled(level))
            this.emit(level, arg);
    }

    /**
     * Register the specified handler to be called for every new and already
     * created trace source.
     *
     * @param handler the handler which will be called for each trace source
     */
    static on(handler: (source: TraceSource) => void) {
        return Registry.instance.on(handler);
    }

    /**
     * Creates or returns already created trace source for the specified id.
     *
     * @param id the id for the trace source
     */
    static get(id: any) {
        return Registry.instance.get(id);
    }
}
