# harvester
Harvester for slurping OA feed data, written in Node.js

This is an upgrade and refactoring of the work carried out creating an [Elasticsearch-based harvester](https://github.com/openactive/openactive-es-example), based on the OpenActive [Ruby feed library](https://github.com/openactive/openactive.rb).

## Architecture

This runs on a 2 stage process. 

In stage 1, raw data is downloaded from API end points and stored in an Elastic index unchanged.

In stage 2, this raw data is processed and normalised to events. These events are stored in another Elastic index.

Stage 2 uses a system of pipelines. Pipelines are called in the order defined in src/lib/pipes/index.js and are called once for each bit of raw data.

Before the first pipeline is called, there is an array of normalised events which is empty. Each pipeline has access to the original data and the normalised events created so far. Each pipeline can delete, edit or create normalised events as it wants.  After all pipelines are called, whatever normalised events are left are saved to Elastic.

## Install

`$ npm install`

## Running the harvester - Stage 1

Hint: use [nvm](https://github.com/nvm-sh/nvm) to manage node versions!

node version > 13 (with esm support & es6)

`$ node ./src/bin/harvester.js`

node version < 13

```
$ npm run build
$ node ./dist/bin/harvester.js
```

## Running the harvester - Stage 2

Hint: use [nvm](https://github.com/nvm-sh/nvm) to manage node versions!

node version > 13 (with esm support & es6)

`$ node ./src/bin/harvester-stage2.js`

node version < 13

```
$ npm run build
$ node ./dist/bin/harvester-stage2.js
```

## Running test service

```
$ cd ./testing/test-service/
$ npm install
$ npm run test-service
```

# Setting up Production servers

## Elastic.co

Set up new instance using AWS, London zone and the rest as default options.

## Heroku

Create a new app via web interface. Europe region.

Link GitHub account and set up deploys from GitHub repository.

Set up Config Vars (Settings section):

* ELASTICSEARCH_USERNAME
* ELASTICSEARCH_PASSWORD
* ELASTICSEARCH_URL - full URL, like: https://xxxxxxxxxxxx.eu-west-2.aws.cloud.es.io:9243/
