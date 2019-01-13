module.exports = {
    foo: {
        $type: "./Foo:Foo"
    },

    bar: {
        $type: "./Bar:Bar",
        params: {
            db: {
                provider: {
                    $dependency: "db"
                }
            },
            foo: {
                $type: "./Foo:Foo"
            }
        }
    },
    db: "db://localhost"
};
