import * as tape from "tape";
import { Uuid } from "@implab/core/Uuid";

tape("simple", t => {
    t.pass("sync assert");
    setTimeout(() => {
        t.pass("async assert");
        t.comment(Uuid());
        t.ok(Uuid() !== Uuid());
        // end should be called after the last assertion
        t.end();
    }, 100);
});
