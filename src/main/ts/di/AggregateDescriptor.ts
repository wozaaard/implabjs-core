import { Descriptor, isDescriptor, Parse } from "./interfaces";
import { ActivationContext } from "./ActivationContext";
import { isPrimitive } from "../safe";

export class AggregateDescriptor<T> implements Descriptor<Parse<T>> {
    _value: T;

    constructor(value: T) {
        this._value = value;
    }

    activate<S>(context: ActivationContext<S>) {
        return this._parse(this._value, context, "$value");
    }

    _parse<S, V>(value: V, context: ActivationContext<S>, path: string): Parse<V> {
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
