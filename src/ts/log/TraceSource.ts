import * as format from '../text/format'
import { argumentNotNull } from '../safe';
import * as Observable from '../components/Observable'
import { IDestroyable } from '../interfaces';
import * as TraceEvent from './TraceEvent'

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

class TraceSource extends Observable<TraceEvent> {
    readonly id: any

    level: number

    constructor(id: any) {
        super();
        this.id = id || new Object();
    }

    protected emit(level: number, arg: any) {
        this._notifyNext(new TraceEvent(this, level, arg));
    }

    isDebugEnabled() {
        return this.level >= TraceSource.DebugLevel;
    }

    debug(msg: string, ...args: any[]) {
        if (this.isEnabled(TraceSource.DebugLevel))
            this.emit(TraceSource.DebugLevel, format(msg, args));
    }

    isLogEnabled() {
        return this.level >= TraceSource.LogLevel;
    }

    log(msg: string, ...args: any[]) {
        if (this.isEnabled(TraceSource.LogLevel))
            this.emit(TraceSource.LogLevel, format(msg, args));
    }

    isWarnEnabled() {
        return this.level >= TraceSource.WarnLevel;
    }

    warn(msg: string, ...args: any[]) {
        if (this.isEnabled(TraceSource.WarnLevel))
            this.emit(TraceSource.WarnLevel, format(msg, args));
    }

    /**
     * returns true if errors will be recorded.
     */
    isErrorEnabled() {
        return this.level >= TraceSource.ErrorLevel;
    }

    /**
     * Traces a error.
     * 
     * @param msg the message.
     * @param args parameters which will be substituted in the message.
     */
    error(msg: string, ...args: any[]) {
        if (this.isEnabled(TraceSource.ErrorLevel))
            this.emit(TraceSource.ErrorLevel, format(msg, args));
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

namespace TraceSource {
    export const DebugLevel = 400;

    export const LogLevel = 300;

    export const WarnLevel = 200;

    export const ErrorLevel = 100;

    export const SilentLevel = 0;
}

export = TraceSource;