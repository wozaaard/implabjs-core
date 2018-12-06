define({
    foo: {
        $type: "./Foo#Foo"
    },

    bar: {
        $type: "./Bar#Bar",
        params: {
            db: {
                provider: {
                    $dependency: "db"
                }
            }
        }
    },
    db: "db://localhost"
});