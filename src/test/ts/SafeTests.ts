import tape = require("tape");
import { delay } from "./TestTraits";
import { Cancellation } from "@implab/core/Cancellation";
import { first, isPromise } from "@implab/core/safe";

tape("await delay test", async t => {
    // schedule delay
    let resolved = false;
    let res = delay(0).then(() => resolved = true);

    t.false(resolved, "the delay should be async");

    await res;
    t.pass("await delay");

    // create cancellation token
    let cancel: (e?: any) => void;
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

    let died = false;

    // try schedule delay after the cancellation is requested
    res = delay(0, ct).then(x => true, () => died = true);

    t.false(died, "The delay should be scheduled even if the cancellation is requested");

    await res;
    t.true(died, "the delay should fail when cancelled");

    t.end();
});

tape("sequemce test", async t => {
    const sequence = ["a", "b", "c"];
    const empty = [];

    // synchronous tests
    t.equals(first(sequence), "a", "Should return the first element");

    let v: string;
    let e: Error;
    first(sequence, x => v = x);
    t.equal(v, "a", "The callback should be called for the first element");

    t.throws(() => {
        first(empty);
    }, "Should throw when the sequence is empty");

    t.throws(() => {
        first(empty, x => v = x);
    }, "Should throw when the sequence is empty");

    first(empty, null, x => e = x);
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

    t.end();
});
