import { test } from "./TestTraits";
import { Container } from "@implab/core/di/Container";
import { ReferenceDescriptor } from "@implab/core/di/ReferenceDescriptor";
import { AggregateDescriptor } from "@implab/core/di/AggregateDescriptor";

test("Container register/getService tests", async t => {
    const container = new Container();

    const connection1 = "db://localhost";

    container.register("connection", connection1);

    t.equals(container.getService("connection"), connection1);

    container.register(
        "dbParams",
        new AggregateDescriptor({
            timeout: 10,
            connection: new ReferenceDescriptor({name: "connection"})
        })
    );

    const dbParams = container.getService("dbParams");
    t.equals(dbParams.connection, connection1);

});
