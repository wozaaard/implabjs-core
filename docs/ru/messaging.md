# Обмен сообщениями

## Session

Контекст обмена сообщениями, отвечает за создание конечных точек для получения и отправки сообщений, а также инкапсулирует в себе работу с провайдером системы обмена сообщениями.

Сессия позволяет выполнить конфигурацию компонент обработки сообщений, до начала реального обмена и после окончания конфигурации выполнить метод `start` после которого начнется реальная обработка. Такой способ позволяет избежать ошибки и потерю сообщений по причине того, что часть компонент готова к работе и уже получает и отправляет сообщения, а часть еще не настроена.

```ts

// some provider related code
const connection = new StompService("ws://broker.329broker.com:15674/ws", { user: "user", pass: "secret" });
const session = connection.createSession();

// create and configure consumers and producers
const consumer = session.createConsumer("topic://notify");

// make event driven consumer
consumer.observe().on(msg => {
    // do something

    // mark the message as processed
    msg.ack();
});

const producer = session.createProducer("queue://requests");

// signal the session to start
session.start();

// await the session is started
await session.getCompletion();

```

### start

Начинает сессию

### createConsumer

### createProducer

## Consumer

### Push-consumer

#### messages

### Pull-consumer

#### read

## Producer

### post