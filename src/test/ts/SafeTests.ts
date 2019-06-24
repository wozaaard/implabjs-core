import { Cancellation } from "@implab/core/Cancellation";
import { first, isPromise, firstWhere, delay, nowait } from "@implab/core/safe";
import { test } from "./TestTraits";

test("await delay test", async t => {
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

    t.throws(() => {
        // try schedule delay after the cancellation is requested
        nowait(delay(0, ct));
    }, "Should throw if cancelled before start");
});

test("sequemce test", async t => {
    const sequence = ["a", "b", "c"];
    const empty = [];

    // synchronous tests
    t.equals(first(sequence), "a", "Should return the first element");
    t.equals(firstWhere(sequence, x => x === "b"), "b", "Should get the second element");

    let v: string;
    let e: Error;
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
});
