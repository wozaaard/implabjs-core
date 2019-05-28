HISTORY
=======

1.2.16
------

Minor fixes and improvements

- added `isCancellable` type predicate function to `safe` module
- `isString, isNumber, isInteger, isPrimitive` are now type predicates

1.2.0
-----

Major rafactoring, moving to support both browser (rjs) and server (cjs) environments.

- dependency injection container ported to typescript
- sources are split to several sets to provide the ability for the conditional build of the project.

1.0.1
-----

First release, intorduces the following features

- `di` - dependency injection container
- `log` - log4 style logging system
- `text` - simple and fast text templating and formatting
- `Uuid` - uuid generation traits