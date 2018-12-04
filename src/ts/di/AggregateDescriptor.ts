import { Descriptor } from "./interfaces";
import { ActivationContext } from "./ActivationContext";

export class AggregateDescriptor implements Descriptor {
    _value: object;

    constructor(value: object) {
        this._value = value;
    }

    activate(context: ActivationContext, name: string) {
        context.enter(name);
        const v = context.parse(this._value, ".params");
        context.leave();
        return v;
    }

    isInstanceCreated(): boolean {
        return false;
    }
    getInstance(): any {
        throw new Error("Not supported");
    }
}
