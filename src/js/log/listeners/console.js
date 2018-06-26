define([], function () {
    if (console && console.log)
        return function (ch, name, msg) {
            
            var args = [ch + ":"];

            switch (name) {
                case "warn":
                case "error":
                case "log":
                    break;
                default:
                    args.push(name + ":");
                    name = "log";
            }


            if (msg instanceof Array)
                args.push.apply(args, msg);
            else
                args.push(msg);

            console[name].apply(console, args);
        };
});