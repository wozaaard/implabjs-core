import { Cancellation } from "../Cancellation";
import { ICancellation } from "../interfaces";
import { first, isPromise, firstWhere, delay, nowait, notImplemented, debounce, fork } from "../safe";
import { test } from "./TestTraits";

test("await delay test", async t => {
    // schedule delay
    let resolved = false;
    let res = delay(0).then(() => resolved = true);

    t.false(resolved, "the delay should be async");

    await res;
    t.pass("await delay");

    // create cancellation token
    let cancel: (e?: any) => void = notImplemented;
    const ct = new Cancellation(c => cancel = c);

    // schedule delay
    resolved = false;
    res = delay(0, ct).then(() => resolved = true);

    t.false(resolved, "created delay with ct");

    // cancel
    cancel();

    try {
        await res;
        t.fail("the delay should fail when it is cancelled");
    } catch {
        t.pass("the delay is cancelled");
    }

    t.throws(() => {
        // try schedule delay after the cancellation is requested
        nowait(delay(0, ct));
    }, "Should throw if cancelled before start");
});

test("sequemce test", async t => {
    const sequence = ["a", "b", "c"];
    const empty: string[] = [];

    // synchronous tests
    t.equals(first(sequence), "a", "Should return the first element");
    t.equals(firstWhere(sequence, x => x === "b"), "b", "Should get the second element");

    let v: string | undefined;
    let e: Error | undefined;
    first(sequence, x => v = x);
    t.equal(v, "a", "The callback should be called for the first element");
    firstWhere(sequence, x => x === "b", x => v = x);
    t.equal(v, "b", "The callback should be called for the second element");

    t.throws(() => {
        first(empty);
    }, "Should throw when the sequence is empty");

    t.throws(() => {
        firstWhere(empty, x => x === "b");
    }, "Should throw when the sequence is empty");

    t.throws(() => {
        first(empty, x => v = x);
    }, "Should throw when the sequence is empty");

    t.throws(() => {
        firstWhere(empty, x => x === "b", x => v = x);
    }, "Should throw when the sequence is empty");

    t.throws(() => {
        firstWhere(sequence, x => x === "z");
    }, "Should throw when the element isn't found");

    t.throws(() => {
        firstWhere(sequence, x => x === "z", x => v = x);
    }, "Should throw when the element isn't found");

    first(empty, undefined, x => e = x);
    t.true(e, "The errorback should be called for the empty sequence");

    // async tests
    const asyncSequence = Promise.resolve(sequence);
    const asyncEmptySequence = Promise.resolve(empty);

    const promise = first(asyncSequence);
    t.true(isPromise(promise), "Should return promise");

    v = await promise;
    t.equal(v, "a", "Should return the first element");

    v = await new Promise(resolve => first(asyncSequence, resolve));
    t.equal(v, "a", "The callback should be called for the first element");
});

test("debounce tests", async (t, trace) => {
    let count = 0;
    let rejected = 0;
    function increment(step: number = 1) {
        count += step;
        return count;
    }

    const f = debounce(() => increment, 100);
    f().then(undefined, () => rejected++);
    f().then(undefined, () => rejected++);

    await f(1);

    t.equal(rejected, 2, "Previous operations should be rejected");
    t.equal(count, 1, "The operation should run once");

    const acc = debounce(
        () => (...values: number[]) => count = values.reduce((a, v) => v + a, count),
        100
    );

    acc(1, 2, 3).catch(() => { });
    const result = acc(1, 2, 3);
    acc.cancel();

    try {
        await result;
        t.notOk("fn.cancel() should make current operation to throw an exception");
    } catch {
        t.ok("fn.cancel() should make current operation to throw an exception");
    }

    t.equal(count, 1, "fn.cancel() The operation should not run");

    acc.cancel();
    await acc(1, 2);
    t.equal(count, 4, "The variable arguments list shoud be handled correctly");

    // create cancellation token
    let cancel: (e?: any) => void = notImplemented;
    const ct = new Cancellation(c => cancel = c);

    const d = debounce(() => async (_ct: ICancellation) => {
        _ct.throwIfRequested();
        trace.debug("do async increment");
        await fork();
        count++;
        return count;
    }, 0);

    const p = d(ct).then(undefined, () => rejected++);
    cancel();
    await p;

    t.equal(count, 4, "Cancellation token should prevent the function execution");
    t.equal(rejected, 3, "Cancellation token should reject operation");

});

test("async debounce test", async t => {
    let rejected = 0;
    let executed = 0;

    const longTask = (ct = Cancellation.none) => {
        executed++;
        return delay(100, ct);
    };

    // d - can be cancelled
    const d = debounce(ct => () => longTask(ct), 1);
    d().catch(() => rejected++);
    await delay(10);
    t.equal(executed, 1, "first call should be executed");
    await d();
    t.equal(rejected, 1, "First call to debounced should be rejected");
});

test("async debounce test", async t => {
    let rejected = 0;
    let executed = 0;
    let running = 0;

    const start = () => {
        if (running++)
            throw new Error("The task started in parallel");
        executed++;
    };

    const end = () => {
        if (--running)
            throw new Error("running !== 0");
    };

    const longTask = async (ct = Cancellation.none) => {
        start();
        try {
            await delay(100, ct);
        } finally {
            end();
        }
    };

    // d2 - can't be cancelled
    const d2 = debounce(ct => () => longTask(), 1);
    d2().catch(() => rejected++);
    await delay(10);
    t.equal(executed, 1, "first call should be executed");
    const p = d2();
    await delay(10);
    t.equal(rejected, 0, "First call to debounced can't be rejected");
    await p;
});
