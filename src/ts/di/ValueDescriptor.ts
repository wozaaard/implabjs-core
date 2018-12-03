import { Descriptor } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

export class ValueDescriptor<T> implements Descriptor {
    _value: T

    constructor(value: T) {
        this._value = value;
    }

    activate(context: ActivationContext, name: string) {
        context.enter(name);
        let v = this._value;
        context.leave();
        return v;        
    }
    isInstanceCreated(): boolean {
        return true;
    }
    getInstance(): T {
        return this._value;
    }
}