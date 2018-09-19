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
            resolve();
        });
    });

    let count = 0;
    events.on(x => count = count + x);

    let first = await events.next();

    t.equals(first, 0, "the first event");

    await done;

    t.equals(count, 45, "the summ of the evetns");

    t.end();
});