import { Foo } from "./Foo";

export class Bar {
    name = "bar";

    foo: Foo;

    constructor(_opts) {
        if (_opts && _opts.foo)
            this.foo = _opts.foo;
    }
}
