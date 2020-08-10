import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";

/**
 * Сервисы доступные внутри контейнера
 */
export interface Services {
    foo: Foo;

    bar: Bar;

    bar2: Bar;

    box: Box<Bar>;

    host: string;

}
