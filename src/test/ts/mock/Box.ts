import { inject } from "../di/Annotations";

export interface Injector<T> {
    setValue(value: T);
}

export class Box<T> implements Injector<T> {
    private _value: T;

    @inject<Injector<T>>("bar")
    setValue(value: T) {
        this._value = value;
    }

    getValue() {
        return this._value;
    }
}
