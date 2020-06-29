import { Observable } from "./Observable";
import { IDestroyable } from "./interfaces";
import { argumentNotNull } from "./safe";

type Handler<T> = (x: T) => void;

export class ObservableValue<T> extends Observable<T> {
    private _value: T;

    constructor(initial: T) {
        super();
        this._value = initial;
    }

    getValue() {
        return this._value;
    }

    setValue(value: T) {
        if (this._value !== value) {
            this._value = value;
            this._notifyNext(value);
        }
    }

    on(next: Handler<T>, error?: Handler<any>, complete?: () => void): IDestroyable {
        argumentNotNull(next, "next");
        try {
            next(this._value);
        } catch {
            // suppress error
        }
        return super.on(next, error, complete);
    }
}
