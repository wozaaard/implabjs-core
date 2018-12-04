import { Descriptor } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

export class ValueDescriptor implements Descriptor {
    _value;

    constructor(value) {
        this._value = value;
    }

    activate(context: ActivationContext, name: string) {
        context.enter(name);
        const v = this._value;
        context.leave();
        return v;
    }
    isInstanceCreated(): boolean {
        return true;
    }
    getInstance() {
        return this._value;
    }
}
