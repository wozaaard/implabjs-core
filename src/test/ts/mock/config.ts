import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";
import { primitive } from "../safe";
import { Constructor } from "../interfaces";

interface Services {
    foo: Foo;

    bar: Bar;

    box: Box<Foo>;

    host: string;

}

interface TypeDescriptor<T, C extends Constructor<T>> {
    $type: C;

    params: Wrap<ConstructorParameters<C>>;
}

function typeRegistration<T, C extends Constructor<T>>(target: C, params: Wrap<ConstructorParameters<C>>): TypeDescriptor<T, C> {
    throw new Error();
}

declare function register<T>(): { type<C extends Constructor<T>>(target: C, params: Wrap<ConstructorParameters<C>>): TypeDescriptor<T, C>};

type Wrap<T> = T extends primitive ? T :
    { [k in keyof T]: Wrap<T[k]> } | TypeDescriptor<T, Constructor<T>>;

const config: Wrap<Services> = {
    foo: typeRegistration(Foo, []),
    bar: typeRegistration(Bar, [{ foo: null as any, nested: null as any }]),
    box: register<Box<Foo>>().type(Box, [{ $type: Bar, params: [] }]),
    host: ""
};
