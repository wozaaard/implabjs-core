import { Descriptor } from "./interfaces";

export class ValueDescriptor implements Descriptor {
    _value;

    constructor(value) {
        this._value = value;
    }

    activate() {
        return this._value;
    }

    toString() {
        return `@type=${typeof this._value}`;
    }
}
