import { Foo } from "./Foo";
import { Box } from "./Box";
import { Bar } from "./Bar";

/**
 * Сервисы доступные внутри контейнера
 */
export interface Services {
    foo: Foo;

    box: Box<Foo>;

    host: string;

}

export interface ChildServices extends Services {

    foo2?: Foo;

    bar: Bar;
}

export interface FooServices {
    foo: Foo;
}
