import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";
import { Builder } from "../di/Annotations";

interface Services {
    foo: Foo;

    bar: Bar;

    box: Box<Foo>;

    host: string;

}

const services = {
    build: <T>() => {
        return new Builder<T, Services>();
    }
};

namespace services {

}

export = services;
