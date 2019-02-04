# BUILD

Для сборки необходимо иметь

* nodejs >= 8
* npm
* eslint
* mercurial (для автоматического определения версии)

В пцессе сборки будут установлены зависимости из package.json

## Properties

Свойства, испольуземые для управления сборкой, через них можно указать имя,
версию пакета, тип модулей, версию стандарта js для которого осуществляется
сборка. Значения по-умолчанию заданы в `gradle.properties`

### npmName

`default: core`

Имя пакета в терминологии npm.

### npmScope

`default: @implab`

Пространство в терминологии npm для пакета.

### target

`default: es5`

Версии стандарта js в среде выполнения, возможные значения:

* es3 - требует полифилы для es5, promise
* es5 - требует полифил для promise
* es6
* es2015
* es2016
* es2017

### jsmodule

`default: amd`

* amd - requirejs модули, хорошо подходит для использования в браузерах.
* commonjs - формат модулей для nodejs

## Tasks

### build

### test

### pack

### publish

## Examples

```shell
./gradlew test pack -PnpmName=core-amd
```

```shell
./gradlew test pack -Pjsmodule=commonjs -Ptarget=es2017
```