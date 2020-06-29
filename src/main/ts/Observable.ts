import { IObservable, IDestroyable, ICancellation, IObserver } from "./interfaces";
import { Cancellation } from "./Cancellation";
import { argumentNotNull, destroyed } from "./safe";

type Handler<T> = (x: T) => void;

type Initializer<T> = (notify: Handler<T>, error: (e: any) => void, complete: () => void) => void;

const noop = () => { };

const nulObserver: IObserver<any> = Object.freeze({
    next: noop,
    error: noop,
    complete: noop
});

function isObserver(val: any): val is IObserver<any> {
    return val && (typeof val.next === "function");
}

export class Observable<T> implements IObservable<T> {
    private _once = new Array<IObserver<T>>();

    private _observers = new Array<IObserver<T>>();

    private _complete = false;

    private _error: any;

    constructor(func?: Initializer<T>) {
        if (func)
            func(
                this._notifyNext.bind(this),
                this._notifyError.bind(this),
                this._notifyCompleted.bind(this)
            );
    }

    /**
     * Registers handlers for the current observable object.
     *
     * @param next the handler for events
     * @param error the handler for a error
     * @param complete the handler for a completion
     * @returns {IDestroyable} the handler for the current subscription, this
     *  handler can be used to unsubscribe from events.
     *
     */
    on(next: Handler<T>, error?: Handler<any>, complete?: () => void): IDestroyable {
        argumentNotNull(next, "next");

        const me = this;

        const observer: IObserver<T> & IDestroyable = {
            next: next.bind(null),
            error: error ? error.bind(null) : noop,
            complete: complete ? complete.bind(null) : noop,

            destroy() {
                me._removeObserver(this);
            }
        };

        this._addObserver(observer);

        return observer;
    }

    subscribe(next: IObserver<T> | Handler<T>, error?: Handler<any>, complete?: () => void): IDestroyable {
        if (isObserver(next)) {
            this._addObserver(next);
            return {
                destroy: () => this._removeObserver(next)
            };
        } else {
            const observer = {
                next: next.bind(null),
                error: error ? error.bind(null) : noop,
                complete: complete ? complete.bind(null) : noop
            };

            this._addObserver(observer);
            return {
                destroy: () => this._removeObserver(observer)
            };
        }
    }

    private _addObserver(observer: IObserver<T>) {
        if (this._complete) {
            try {
                if (this._error)
                    observer.error(this._error);
                else
                    observer.complete();
            } catch (e) {
                this.onObserverException(e);
            }
        } else {
            this._observers.push(observer);
        }
    }

    /**
     * Waits for the next event. This method can't be used to read messages
     * as a sequence since it can skip some messages between calls.
     *
     * @param ct a cancellation token
     */
    next(ct: ICancellation = Cancellation.none) {
        return new Promise<T>((resolve, reject) => {
            const observer: IObserver<T> = {
                next: resolve,
                error: reject,
                complete: () => reject("No more events are available")
            };

            if (this._addOnce(observer) && ct.isSupported()) {
                ct.register(e => {
                    this._removeOnce(observer);
                    reject(e);
                });
            }
        });
    }

    private _addOnce(observer: IObserver<T>) {
        if (this._complete) {
            try {
                if (this._error)
                    observer.error(this._error);
                else
                    observer.complete();
            } catch (e) {
                this.onObserverException(e);
            }
            return false;
        }

        this._once.push(observer);
        return true;
    }

    protected onObserverException(e: any) {
    }

    private _removeOnce(d: IObserver<T>) {
        const i = this._once.indexOf(d);
        if (i >= 0)
            this._once.splice(i, 1);
    }

    private _removeObserver(d: IObserver<T>) {
        const i = this._observers.indexOf(d);
        if (i >= 0)
            this._observers.splice(i, 1);
    }

    private _notify(guard: (observer: IObserver<T>) => void) {
        this._once.forEach(guard);
        this._once = [];

        this._observers.forEach(guard);
    }

    protected _notifyNext(evt: T) {
        const guard = (observer: IObserver<T>) => {
            try {
                observer.next(evt);
            } catch (e) {
                this.onObserverException(e);
            }
        };

        this._notify(guard);
    }

    protected _notifyError(e: any) {
        const guard = (observer: IObserver<T>) => {
            try {
                observer.error(e);
            } catch (e) {
                this.onObserverException(e);
            }
        };

        this._notify(guard);
        this._observers = [];
        this._complete = true;
    }

    protected _notifyCompleted() {
        const guard = (observer: IObserver<T>) => {
            try {
                observer.complete();
            } catch (e) {
                this.onObserverException(e);
            }
        };

        this._notify(guard);
        this._observers = [];
        this._complete = true;
    }
}
