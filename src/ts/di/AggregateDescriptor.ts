import { Descriptor, isDescriptor } from "./interfaces";
import { ActivationContext } from "./ActivationContext";
import { isPrimitive } from "util";

export class AggregateDescriptor implements Descriptor {
    _value: object;

    constructor(value: object) {
        this._value = value;
    }

    activate(context: ActivationContext) {
        return this._parse(this._value, context, "$value");
    }

    // TODO: make async
    _parse(value, context: ActivationContext, path: string) {
        if (isPrimitive(value))
            return value;

        if (isDescriptor(value))
            return context.activate(value, path);

        if (value instanceof Array)
            return value.map((x, i) => this._parse(x, context, `${path}[${i}]`));

        const t = {};
        for (const p of Object.keys(value))
            t[p] = this._parse(value[p], context, `${path}.${p}`);
        return t;

    }

    toString() {
        return "@walk";
    }
}
