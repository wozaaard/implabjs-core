import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { Box } from "./Box";
import { declare } from "../di/Annotations";

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

/**
 * Экспортируем вспомогательные функции для описания сервисов и кинфогурации
 */
export const { define, dependency } = declare<Services>();
