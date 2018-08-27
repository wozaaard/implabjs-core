import * as TraceEventArgs from './TraceEventArgs'
import * as format from '../text/format'

interface Handler {
    (arg: TraceEventArgs): void;
}

interface Destroyable {
    destroy();
}

class HandlerDescriptor implements Destroyable {
    private _target: TraceSource

    readonly handler: Handler;

    constructor(target: TraceSource, handler: Handler) {
        this._target = target;
        this.handler = handler;
    }

    destroy() {
        this._target.remove(this);
    }
}


class TraceSource {
    readonly id: any

    private _handlers: Array<HandlerDescriptor>

    level: number

    constructor(id: any) {
        this.id = id || new Object();
        this._handlers = new Array<HandlerDescriptor>();
    }

    on(handler: Handler): Destroyable {
        if (!handler)
            throw new Error("A handler must be specified");

        let d = new HandlerDescriptor(this, handler)

        this._handlers.push(d);

        return d;
    }

    remove(cookie: any): void {
        let i = this._handlers.indexOf(cookie);
        if (i >= 0)
            this._handlers.splice(i, 1);
    }

    protected emit(level: number, msg: string, ...args: any[]) {
        if (level <= this.level) {
            let event = new TraceEventArgs(this, format(msg, args));

            this._handlers.forEach(d => {
                try {
                    d.handler.call(null, event);
                } catch {
                    // suppress error in log handlers
                }
            });
        }
    }

    isDebugEnabled() {
        return this.level >= TraceSource.DebugLevel;
    }

    debug(msg: string, ...args: any[]): void {
        this.emit(TraceSource.DebugLevel, msg, args);
    }

    isLogEnabled() {
        return this.level >= TraceSource.LogLevel;
    }

    log(msg: string, ...args: any[]): void {
        this.emit(TraceSource.LogLevel, msg, args);
    }

    isWarnEnabled() {
        return this.level >= TraceSource.WarnLevel;
    }

    warn(msg: string, ...args: any[]): void {
        this.emit(TraceSource.WarnLevel, msg, args);
    }

    isErrorEnabled() {
        return this.level >= TraceSource.ErrorLevel;
    }

    error(msg: string, ...args: any[]): void {
        this.emit(TraceSource.ErrorLevel, msg, args);
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