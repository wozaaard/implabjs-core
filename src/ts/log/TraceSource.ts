import * as format from '../text/format'
import { argumentNotNull } from '../safe';
import { Observable } from '../components/Observable'
import { IDestroyable } from '../interfaces';

export const DebugLevel = 400;

export const LogLevel = 300;

export const WarnLevel = 200;

export const ErrorLevel = 100;

export const SilentLevel = 0;

export class TraceEvent {
    readonly source: TraceSource;

    readonly level: Number;

    readonly arg: any;

    constructor(source: TraceSource, level: Number, arg: any) {
        this.source = source;
        this.level = level;
        this.arg = arg;
    }
}

class Registry {
    static readonly instance = new Registry();

    private _registry: object = new Object();
    private _listeners: object = new Object();
    private _nextCookie: number = 1;

    get(id: any): TraceSource {
        argumentNotNull(id, "id");

        if (this._registry[id])
            return this._registry[id];

        var source = new TraceSource(id);
        this._registry[id] = source;
        this._onNewSource(source);

        return source;
    }

    add(id: any, source: TraceSource) {
        argumentNotNull(id, "id");
        argumentNotNull(source, "source");

        this._registry[id] = source;
        this._onNewSource(source);
    }

    _onNewSource(source: TraceSource) {
        for (let i in this._listeners)
            this._listeners[i].call(null, source);
    }

    on(handler: (source: TraceSource) => void): IDestroyable {
        argumentNotNull(handler, "handler");
        var me = this;

        var cookie = this._nextCookie++;

        this._listeners[cookie] = handler;

        for (let i in this._registry)
            handler(this._registry[i]);

        return {
            destroy() {
                delete me._listeners[cookie];
            }
        };
    }
}

export class TraceSource {
    readonly id: any

    level: number

    readonly events: Observable<TraceEvent>

    _notifyNext: (arg: TraceEvent) => void

    constructor(id: any) {

        this.id = id || new Object();
        this.events = new Observable((next) => {
            this._notifyNext = next;
        })
    }

    protected emit(level: number, arg: any) {
        this._notifyNext(new TraceEvent(this, level, arg));
    }

    isDebugEnabled() {
        return this.level >= DebugLevel;
    }

    debug(msg: string, ...args: any[]) {
        if (this.isEnabled(DebugLevel))
            this.emit(DebugLevel, format(msg, args));
    }

    isLogEnabled() {
        return this.level >= LogLevel;
    }

    log(msg: string, ...args: any[]) {
        if (this.isEnabled(LogLevel))
            this.emit(LogLevel, format(msg, args));
    }

    isWarnEnabled() {
        return this.level >= WarnLevel;
    }

    warn(msg: string, ...args: any[]) {
        if (this.isEnabled(WarnLevel))
            this.emit(WarnLevel, format(msg, args));
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
            this.emit(ErrorLevel, format(msg, args));
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

