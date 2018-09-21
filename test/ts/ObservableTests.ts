import { TraceSource, DebugLevel } from '@implab/core/log/TraceSource'
import * as tape from 'tape';
import { TapeWriter, delay } from './TestTraits';
import { Observable } from '@implab/core/Observable';
import { IObservable } from '@implab/core/interfaces';

let trace = TraceSource.get("ObservableTests");

tape('events sequence example', async t => {


    let events: IObservable<number>

    let done = new Promise<void>((resolve) => {
        events = new Observable<number>(async (notify, fail, complete) => {
            for (let i = 0; i < 10; i++) {
                await delay(0);
                notify(i);
            }
            complete();
            resolve();
        });
    });

    let count = 0;
    let complete = false;
    events.on(x => count = count + x, null, () => complete = true);

    let first = await events.next();

    t.equals(first, 0, "the first event");
    t.false(complete, "the sequence is not complete");

    await done;

    t.equals(count, 45, "the summ of the evetns");
    t.true(complete, "the sequence is complete");

    t.end();
});

tape('event sequence termination', async t => {
    let events: IObservable<number>

    let done = new Promise<void>((resolve) => {
        events = new Observable<number>(async (notify, fail, complete) => {
            await delay(0);
            notify(1);
            complete();
            notify(2);
            complete();
            fail("Sequence terminated");
            resolve();
        });
    });

    let count = 0;
    events.on(() => {}, (e) => count++, () => count++);

    let first = await events.next();
    t.equals(first, 1, "the first message");
    try {
        await events.next();
        t.fail("shoud throw an exception");
    } catch(e) {
        t.pass("the sequence is terminated");
    }

    await done;

    t.equals(count, 1, "the sequence must be terminated once");

    t.end();
});