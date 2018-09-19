# Observable

Универсальный способ организации потока сообщений. Данный механизм может
использоваться для оповещения об изменениях состояний объектов или для доставки
самостоятельных событий, например, связанных с действиями пользователя.

Является реализацией классического шаблона наблюдателя с возможность сообщить
о коце потока событий. Данная реализация не содержит никаких дополнительных
функций, таких как фильтрация, канал с состоянием, преобразования сообщений и
т.п. Это сделано специально, чтобы реализация оставалась максимально простой.

Пример того, как можно создать последовательность из 10 событий:

```ts
var events = new Observable(async (notify, error, complete) => {
    // цикл в котором возникает событие
    for(let i = 0; i < 10; i++) {
        await delay(1000);
        // в качестве данных передается номер события
        notify(i);
    }
    // по окончании последовательности информируем, что событий больше не будет
    compelte();
});

// создаем окно с отображением хода событий
var progress = showProgress({ min: 0, max: 9, current: 0});

// подписываемся на события
events.on(
    // обработчик очередного события
    msg => {
        progress.setValue(msg);
    }.
    // обработчик ошибки
    e => {
        progress.showError(e);
    },
    // обработчик конца потока
    () => {
        progress.close();
    }
);
```

Пример создания `Observable` из событий другого объекта, например, виджета:

```ts
postCreate() {
    // превращаем события виджета в Observable
    this.mouseMove = new Observable((notify) => {
        this.moveArea.on('mousemove',(x) => notify(x.) );
    });
}

```

Пример инициализации `Observable` внутри класса и генерация событий:

```ts

class PositionWidget extends Widget {
    _nextPosition: (pos: Position) => void

    _complete: () => void

    readonly position: Observable<Position>;

    constructor(...args[]) {
        super(args);

        this.position = new Observable<Position>((notify, error, complete) => {
            this._nextPosition = notify;
            this._complete = complete
        });
    }

    destroy() {
        this._complete();

        super();
    }
}

```