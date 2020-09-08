import { Observable } from "../Observable";
import { Registry } from "./Registry";
import { TraceEventData } from "./TraceEventData";
import { EventProvider } from "../EventProvider";

export const DebugLevel = 400;

export const LogLevel = 300;

export const WarnLevel = 200;

export const ErrorLevel = 100;

export const SilentLevel = 0;

export interface TraceEvent {
    readonly source: TraceSource;

    readonly level: number;

    readonly message: any;

    readonly args?: any[];
}

export class TraceSource {
    readonly id: any;

    level = 0;

    readonly events: Observable<TraceEvent>;

    private readonly _provider: EventProvider<TraceEvent>;

    constructor(id?: any) {

        this.id = id || new Object();
        this._provider = new EventProvider();
        this.events = this._provider.getObservable();
    }

    protected emit(level: number, message: any, args: any[]) {
        this._provider.post(new TraceEventData(this, level, message, args));
    }

    isDebugEnabled() {
        return this.level >= DebugLevel;
    }

    debug(data: any): void;
    debug(msg: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]) {
        if (this.isEnabled(DebugLevel))
            this.emit(DebugLevel, msg, args);
    }

    isLogEnabled() {
        return this.level >= LogLevel;
    }

    log(data: any): void;
    log(msg: string, ...args: any[]): void;
    log(msg: string, ...args: any[]) {
        if (this.isEnabled(LogLevel))
            this.emit(LogLevel, msg, args);
    }

    isWarnEnabled() {
        return this.level >= WarnLevel;
    }

    warn(data: any): void;
    warn(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]) {
        if (this.isEnabled(WarnLevel))
            this.emit(WarnLevel, msg, args);
    }

    /**
     * returns true if errors will be recorded.
     */
    isErrorEnabled() {
        return this.level >= ErrorLevel;
    }

    /** Traces a error
     * @param data The object which will be passed to the underlying listeners
     */
    error(data: any): void;
    /**
     * Traces a error.
     *
     * @param msg the message.
     * @param args parameters which will be substituted in the message.
     */
    error(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]) {
        if (this.isEnabled(ErrorLevel))
            this.emit(ErrorLevel, msg, args);
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
     * @param msg the data of the event, can be a simple string or any object.
     */
    traceEvent(level: number, msg: any, ...args: any[]) {
        if (this.isEnabled(level))
            this.emit(level, msg, args);
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
