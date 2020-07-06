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

    box: Box<Bar>;

    host: string;

}

/**
 * Экспортируем вспомогательные функции для описания сервисов и кинфогурации
 */
export const { define, dependency, config } = declare<Services>();
