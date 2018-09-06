import { IObservable, IDestroyable, ICancellation } from '../interfaces';
import { Cancellation } from '../Cancellation'
import { argumentNotNull } from '../safe';


interface Handler<T> {
    (x:T) : void
}

interface Initializer<T> {
    (notify: Handler<T>) : (() => void) | void;
}


class Observable<T> implements IObservable<T>, IDestroyable {
    private _once = new Array<Handler<T>>();

    private readonly _observers = new Array<Handler<T>>();

    private readonly _cleanup : (() => void) | void;

    constructor(func?: Initializer<T>) {
        this._cleanup = func && func(this._notify.bind(this));
    }

    on(observer: Handler<T>, error?: Handler<any>, complete?: () => void): IDestroyable {
        argumentNotNull(observer, "observer");

        this._observers.push(observer);

        let me = this;
        return {
            destroy() {
                me._removeObserver(observer);
            }
        }
    }

    next(ct: ICancellation = Cancellation.none): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this._once.push(resolve);
            if (ct.isSupported()) {
                ct.register((e) => {
                    this._removeOnce(resolve);
                    reject(e);
                });
            }
        });
    }

    destroy() {
        if(this._cleanup)
            this._cleanup.call(null);
    }

    protected onObserverException(e: any) {
    }

    private _removeOnce(d: Handler<T>) {
        let i = this._once.indexOf(d);
        if (i >= 0)
            this._once.splice(i);
    }

    private _removeObserver(d: Handler<T>) {
        let i = this._observers.indexOf(d);
        if (i >= 0)
            this._observers.splice(i);
    }

    protected _notify(evt: T) {
        let guard = (observer: Handler<T>) => {
            try {
                observer(evt);
            } catch (e) {
                this.onObserverException(e);
            }
        }

        if (this._once.length) {
            for (let i = 0; i < this._once.length; i++)
                guard(this._once[i]);
            this._once = [];
        }

        for (let i = 0; i < this._observers.length; i++)
            guard(this._observers[i]);
    }
}

namespace Observable {
}

export = Observable;