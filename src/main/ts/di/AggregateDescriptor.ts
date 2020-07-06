import { Descriptor } from "./interfaces";
import { ActivationContext } from "./ActivationContext";
import { isPrimitive } from "../safe";
import { isDescriptor } from "./traits";

export class AggregateDescriptor<S, T> implements Descriptor<S, T> {
    _value: any;

    constructor(value: any) {
        this._value = value;
    }

    activate(context: ActivationContext<S>): T {
        return this._parse(this._value, context, "$value");
    }

    _parse(value: any, context: ActivationContext<S>, path: string): any {
        if (isPrimitive(value))
            return value as any;

        if (isDescriptor(value))
            return context.activate(value, path);

        if (value instanceof Array)
            return value.map((x, i) => this._parse(x, context, `${path}[${i}]`)) as any;

        const t: any = {};
        for (const p in value)
            t[p] = this._parse(value[p], context, `${path}.${p}`);
        return t;
    }

    toString() {
        return "@walk";
    }
}
