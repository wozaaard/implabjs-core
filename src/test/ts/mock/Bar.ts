import { Foo } from "./Foo";
import { annotate, dependency } from "./services";

export const service = annotate<Bar>();

@service.wire({
    foo: dependency("foo"),
    nested: {
        lazy: dependency("foo", { lazy: true })
    },
    host: dependency("host")
}, "")
export class Bar {
    barName = "Twister";

    _v: Foo | undefined;

    constructor(_opts: {
        foo?: Foo;
        nested?: {
            lazy: () => Foo
        },
        host: string
    }, s: string) {

        if (_opts && _opts.foo)
            this._v = _opts.foo;
    }

    setName(name: string) {

    }

    getFoo() {
        if (this._v === undefined)
            throw new Error("The foo isn't set");
        return this._v;
    }
}
