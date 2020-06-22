import { Foo } from "./Foo";

export class Bar {
    name = "bar";

    foo: Foo | undefined;

    constructor(_opts?: { foo?: Foo; }) {
        if (_opts && _opts.foo)
            this.foo = _opts.foo;
    }

    getFoo() {
        if (this.foo === undefined)
            throw new Error("The foo isn't set");
        return this.foo;
    }
}
