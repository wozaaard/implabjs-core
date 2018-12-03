import { Descriptor } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

export class AggregateDescriptor<T> implements Descriptor {
    _value: T

    constructor(value: T) {

    }

    activate(context: ActivationContext, name: string) {
        context.enter(name);
        let v = context.parse(this._value, ".params");
        context.leave();
        return v;
    }

    isInstanceCreated(): boolean {
        return false;
    }
    getInstance(): T {
        throw new Error("Not supported exception");
    }
}
