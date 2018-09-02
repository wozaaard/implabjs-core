import * as format from '../text/format'
import { argumentNotNull } from '../safe';

interface TraceEventHandler {
    (sender: TraceSource, level: number, arg: any): void;
}

interface TraceSourceHandler {
    (source: TraceSource): void;
}

interface Destroyable {
    destroy();
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

    on(handler: TraceSourceHandler): Destroyable {
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

class TraceSource {

    readonly id: any

    // using array will provide faster iteration the with object
    private _handlers: Array<TraceEventHandler> = new Array<TraceEventHandler>();

    level: number

    constructor(id: any) {
        this.id = id || new Object();
    }

    on(handler: TraceEventHandler): Destroyable {
        argumentNotNull(handler, "handler");
        var me = this;
        me._handlers.push(handler);

        return {
            destroy() {
                me.remove(handler);
            }
        }
    }

    remove(handler: TraceEventHandler): void {
        let i = this._handlers.indexOf(handler);
        if (i >= 0)
            this._handlers.splice(i, 1);
    }

    protected emit(level: number, arg: any) {
        this._handlers.forEach(h => {
            try {
                h(this, level, arg);
            } catch (e) {
                // suppress error in log handlers
            }
        });
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

    isErrorEnabled() {
        return this.level >= TraceSource.ErrorLevel;
    }

    error(msg: string, ...args: any[]) {
        if (this.isEnabled(TraceSource.ErrorLevel))
            this.emit(TraceSource.ErrorLevel, format(msg, args));
    }

    isEnabled(level: number) {
        return (this.level >= level);
    }

    traceEvent(level: number, arg: any) {
        if (this.isEnabled(level))
            this.emit(level, arg);
    }

    static on(handler: TraceSourceHandler) {
        Registry.instance.on(handler);
    }

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