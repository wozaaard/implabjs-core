import { IDestroyable } from "./interfaces";
import { Observable } from "./Observable";

/**
 * Event proviers are used to produce events, throug this object you can feed
 * the Observable with input events. Once the EventProvider is destroyed the
 * bound obsevable is disconnected and marked as 'done'.
 */
export class EventProvider<T> implements IDestroyable {

    _observable: Observable<T> | undefined;

    _next: ((evt: T) => void) | undefined;
    _done: (() => void) | undefined;

    constructor() {
        this._observable = new Observable<T>((next, _error, done) => {
            this._next = next;
            this._done = done;
        });
    }

    destroy(): void {
        if (this._observable) {
            // break all references
            this._observable = undefined;
            this._next = undefined;
            this._done = undefined;
        }
    }
    post(event: T) {
        return this._next && this._next(event);
    }

    getObservable() {
        if (!this._observable)
            throw new Error("The object is destroyed");

        return this._observable;
    }
}
