import { TraceSource } from "./TraceSource";
import { argumentNotNull } from "../safe";
import { IDestroyable } from "../interfaces";

export class Registry {
    static readonly instance = new Registry();

    private _registry: object = new Object();
    private _listeners: object = new Object();
    private _nextCookie: number = 1;

    get(id: any): TraceSource {
        argumentNotNull(id, "id");

        if (this._registry[id])
            return this._registry[id];

        const source = new TraceSource(id);
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
        for (const i in this._listeners)
            this._listeners[i].call(null, source);
    }

    on(handler: (source: TraceSource) => void): IDestroyable {
        argumentNotNull(handler, "handler");
        const me = this;

        const cookie = this._nextCookie++;

        this._listeners[cookie] = handler;

        for (const i in this._registry)
            handler(this._registry[i]);

        return {
            destroy() {
                delete me._listeners[cookie];
            }
        };
    }
}
