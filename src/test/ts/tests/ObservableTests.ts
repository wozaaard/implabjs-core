import { TraceSource } from "../log/TraceSource";
import { Observable } from "../Observable";
import { IObservable } from "../interfaces";
import { delay, fork } from "../safe";
import { test } from "./TestTraits";

const trace = TraceSource.get("ObservableTests");

test("events sequence example", async t => {

    let events: IObservable<number> | undefined;

    const done = new Promise<void>(resolve => {
        events = new Observable<number>(async (notify, fail, finish) => {
            for (let i = 0; i < 10; i++) {
                await fork();
                notify(i);
            }
            finish();
            resolve();
        });
    });

    let count = 0;
    let complete = false;
    if (!events)
        throw new Error("events === undefined");
    events.on(x => count = count + x, undefined, () => complete = true);

    const first = await events.next();

    t.equals(first, 0, "the first event");
    t.false(complete, "the sequence is not complete");

    await done;

    t.equals(count, 45, "the summ of the evetns");
    t.true(complete, "the sequence is complete");
});

test("event sequence termination", async t => {
    let events: IObservable<number> | undefined;

    const done = new Promise<void>(resolve => {
        events = new Observable<number>(async (notify, fail, complete) => {
            await fork();
            notify(1);
            complete();
            notify(2);
            complete();
            fail("Sequence terminated");
            resolve();
        });
    });

    if (!events)
        throw new Error("events === undefined");

    let count = 0;
    events.on(() => {}, e => count++, () => count++);

    const first = await events.next();
    t.equals(first, 1, "the first message");
    try {
        await events.next();
        t.fail("shoud throw an exception");
    } catch (e) {
        t.pass("the sequence is terminated");
    }

    await done;

    t.equals(count, 1, "the sequence must be terminated once");
});
