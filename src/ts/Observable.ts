import { IObservable, IDestroyable, ICancellation } from './interfaces';
import { Cancellation } from './Cancellation'
import { argumentNotNull } from './safe';


interface Handler<T> {
    (x: T): void
}

interface Initializer<T> {
    (notify: Handler<T>, error?: (e: any) => void, complete?: () => void): void;
}

// TODO: think about to move this interfaces.ts and make it public
interface IObserver<T> {
    next(event: T): void

    error(e: any): void

    complete(): void
}

const noop = () => {};

export class Observable<T> implements IObservable<T> {
    private _once = new Array<IObserver<T>>();

    private _observers = new Array<IObserver<T>>();


    private _complete: boolean

    private _error: any

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

        let me = this;

        let observer: IObserver<T> & IDestroyable = {
            next: next,
            error: error ? error.bind(null) : noop,
            complete: complete ? complete.bind(null) : noop,

            destroy() {
                me._removeObserver(this);
            }
        }

        this._addObserver(observer);


        return observer;
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
    next(ct: ICancellation = Cancellation.none): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let observer: IObserver<T> = {
                next: resolve,
                error: reject,
                complete: () => reject("No more events are available")
            };

            if (this._addOnce(observer) && ct.isSupported()) {
                ct.register((e) => {
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
        let i = this._once.indexOf(d);
        if (i >= 0)
            this._once.splice(i, 1);
    }

    private _removeObserver(d: IObserver<T>) {
        let i = this._observers.indexOf(d);
        if (i >= 0)
            this._observers.splice(i, 1);
    }

    private _notify(guard: (observer: IObserver<T>) => void) {
        if (this._once.length) {
            for (let i = 0; i < this._once.length; i++)
                guard(this._once[i]);
            this._once = [];
        }

        for (let i = 0; i < this._observers.length; i++)
            guard(this._observers[i]);
    }

    protected _notifyNext(evt: T) {
        let guard = (observer: IObserver<T>) => {
            try {
                observer.next(evt);
            } catch (e) {
                this.onObserverException(e);
            }
        }

        this._notify(guard);
    }

    protected _notifyError(e: any) {
        let guard = (observer: IObserver<T>) => {
            try {
                observer.error(e);
            } catch (e) {
                this.onObserverException(e);
            }
        }

        this._notify(guard);
        this._observers = [];
    }

    protected _notifyCompleted() {
        let guard = (observer: IObserver<T>) => {
            try {
                observer.complete();
            } catch (e) {
                this.onObserverException(e);
            }
        }

        this._notify(guard);
        this._observers = [];
    }
}