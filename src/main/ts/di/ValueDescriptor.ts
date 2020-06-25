import { Descriptor } from "./interfaces";

export class ValueDescriptor<T> implements Descriptor<T> {
    _value: T;

    constructor(value: T) {
        this._value = value;
    }

    activate() {
        return this._value;
    }

    toString() {
        return `@type=${typeof this._value}`;
    }
}
