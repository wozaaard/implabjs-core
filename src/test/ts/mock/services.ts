import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";

/**
 * Сервисы доступные внутри контейнера
 */
export interface Services {
    foo: Foo;

    box: Box<Foo>;

    host: string;

}
