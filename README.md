# harvester
Harvester for slurping OA feed data, written in Node.js

This is an upgrade and refactoring of the work carried out creating an [Elasticsearch-based harvester](https://github.com/openactive/openactive-es-example), based on the OpenActive [Ruby feed library](https://github.com/openactive/openactive.rb).

## Architecture

This runs on a 2 stage process. 

In stage 1, raw data is downloaded from API end points and stored in an Elastic index unchanged.

In stage 2, this raw data is processed and normalised to events. These events are stored in another Elastic index.

Stage 2 uses a system of pipelines. Pipelines are called in the order defined in `src/lib/pipes/index.js` and are called once for each bit of raw data.

Before the first pipeline is called, there is an array of normalised events which is empty. Each pipeline has access to the original data and the normalised events created so far. Each pipeline can delete, edit or create normalised events as it wants.  After all pipelines are called, whatever normalised events are left are saved to Elastic.

## Install

`$ npm install`

## Running the harvester - Stage 1

Hint: use [nvm](https://github.com/nvm-sh/nvm) to manage node versions!

node version > 13 (with esm support & es6)

`$ node ./src/bin/harvester-stage1.js`

node version < 13

```
$ npm run build
$ node ./dist/bin/harvester-stage1.js
```

### Registry

It will get a list of end points from a URL, defined in `src/lib/settings.js`, `registryURL` variable.

You can set this URL to `https://status.openactive.io/datasets.json` to only get data from the status page.

However some publishers are not in that feed and some publishers have more than one feed. You can pass a URL of a file that has some extra data, for instance `https://raw.githubusercontent.com/odscjames/openactive-sources/master/datasets.json`.

The JSON schema is slightly different (see `data-url` string vs `data-urls` dict) but the code can handle either format.

### State

By default, the stage 1 runner will run incrementally - it will remember how far it got and start from the same place next time.

The state is stored in the Elasticsearch index set in `src/lib/settings.js`, `elasticIndexStage1State` variable.

If you want it to start from scratch for all publishers, simply delete this index and run again.

If you want it to start from scratch for one publisher, look in the index, find the correct record and delete it. Then run again. 

## Running the harvester - Stage 2

Hint: use [nvm](https://github.com/nvm-sh/nvm) to manage node versions!

node version > 13 (with esm support & es6)

`$ node ./src/bin/harvester-stage2.js`

node version < 13

```
$ npm run build
$ node ./dist/bin/harvester-stage2.js
```

### State

By default, the stage 2 runner will run incrementally - it will remember how far it got and start from the same place next time.

The state is stored in the Elasticsearch index set in `src/lib/settings.js`, `elasticIndexStage2State` variable.

If you want it to start from scratch, simply delete this index and run again.

## Running test service

```
$ cd ./testing/test-service/
$ npm install
$ npm run test-service
```

## Setting up Production servers

### Elastic.co

Set up new instance using AWS, London zone and the rest as default options.

### Heroku

Create a new app via web interface. Europe region.

Link GitHub account and set up deploys from GitHub repository.

Set up Config Vars (Settings section):

* ELASTICSEARCH_USERNAME
* ELASTICSEARCH_PASSWORD
* ELASTICSEARCH_URL - full URL, like: https://xxxxxxxxxxxx.eu-west-2.aws.cloud.es.io:9243/
* MAPIT_APIKEY

