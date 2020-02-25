# harvester
Harvester for slurping OA feed data, written in Node.js

This is an upgrade and refactoring of the work carried out creating an [Elasticsearch-based harvester](https://github.com/openactive/openactive-es-example), based on the OpenActive [Ruby feed library](https://github.com/openactive/openactive.rb).

## Install

`$ npm install`

## Running the harvester

Hint: use [nvm](https://github.com/nvm-sh/nvm) to manage node versions!

node version > 13 (with esm support & es6)

`$ node ./src/bin/harvester.js`

node version < 13

```
$ npm run build
$ node ./dist/bin/harvester.js
```

## Running test service

```
$ cd ./testing/test-service/
$ npm install
$ npm run test-service
```
