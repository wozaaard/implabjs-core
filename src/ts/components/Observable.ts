import { IObservable, IObserver, IDestroyable, ICancellation } from '../interfaces';
import { Cancellation } from '../Cancellation'
import * as TraceSource from '../log/TraceSource'
import { argumentNotNull } from '../safe';

const trace = TraceSource.get('@implab/core/components/Observable');


class Observable<T> implements IObservable<T> {
    private _once = new Array<IObserver<T>>();

    private readonly _observers = new Array<IObserver<T>>();

    constructor(func: (notify: IObserver<T>) => void) {
        argumentNotNull(func, "func");

        func(this._notify.bind(this));
    }

    on(observer: IObserver<T>): IDestroyable {
        argumentNotNull(observer, "observer");

        this._observers.push(observer);

        let me = this;
        return {
            destroy() {
                me._removeObserver(observer);
            }
        }
    }

    wait(ct: ICancellation = Cancellation.none): Promise<T> {
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

    onObserverException(e: any) {
        trace.error("Unhandled exception in the observer: {0}", e);
    }

    private _removeOnce(d: IObserver<T>) {
        let i = this._once.indexOf(d);
        if (i >= 0)
            this._once.splice(i);
    }

    private _removeObserver(d: IObserver<T>) {
        let i = this._observers.indexOf(d);
        if (i >= 0)
            this._observers.splice(i);
    }

    private _notify(evt: T) {
        let guard = (observer: IObserver<T>) => {
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
    export const traceSource = trace;
}

export = Observable;