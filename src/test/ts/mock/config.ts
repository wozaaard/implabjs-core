import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { ActivationType } from "../di/interfaces";
import { Builder } from "../di/Annotations";
import { Box } from "./Box";

interface RegistrationOptions {
    activation?: ActivationType;
}

interface ConfigBuilder<S> {
    service<K extends keyof S>(name: K): Builder<S[K], S>;
}

interface ContainerServices {
    barBox: Box<Bar>;

    foo: Foo;

    bar: Bar;

    password: string;

    user: string;

    timeout: number;
}

export declare const config: ConfigBuilder<ContainerServices>;
