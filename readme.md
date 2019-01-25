# Implabjs-core

Набор стандартных библиотек для создания приложений со сложным функционалом.
Данную библиотеку можно использовать как для разработки приложений, которые
будут работать в среде браузеров, так и в серверных средах.

Библиотека написана на TypeScript, некоторая часть на JavaScript, но постепенно
планируется перейти полностью на использование TypeScript

Более подробная документация доступна по ссылке: <https://bitbucket.org/implab/implabjs-core/src/default/docs/ru/>

## Основные компоненты

### DI

Контейнер для внедрения зависимостей, позволяет гибко описывать структуру
приложения и создавать слабосвязанные компоненты.

### LOG

Средства журналирования похожие на JLog, позволяют эффективно вести журнал
выполнения программы.

### Cancellations

Специальные маркеры для отмены асинхронных операций, по аналогии с .NET
CancelationToken.
