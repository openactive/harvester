# harvester
Harvester for slurping OA feed data, written in Node.js

This is an upgrade and refactoring of the work carried out creating an [Elasticsearch-based harvester](https://github.com/openactive/openactive-es-example), based on the OpenActive [Ruby feed library](https://github.com/openactive/openactive.rb).

## Architecture

This runs on a 2 stage process. 

In stage 1, raw data is downloaded from API end points and stored in an Elastic index unchanged.

In stage 2, this raw data is processed and normalised to events. These events are stored in another Elastic index.

Stage 2 uses a system of pipelines. Pipelines are called in the order defined in `src/lib/pipes/index.js` and are called once for each bit of raw data.

Before the first pipeline is called, there is an array of normalised events which is empty. Each pipeline has access to the original data and the normalised events created so far. Each pipeline can delete, edit or create normalised events as it wants.  After all pipelines are called, whatever normalised events are left are saved to Elastic.

### Mapping

All types of event are consolidated to a consistent structure called `NormalisedEvent`. We index only the fields that are needed.

* `data_id`: the original value of `id` or `@id` (may be missing)
* `name`, `description`, `event_status`: correspond to the equivalent Open Active fields
* `start_date` and `end_date`: full datetimes, from the corresponding fields in the original data or generated from parent objects
* `location`: an object with `geo_point`, `postcode` and `unitary_authority` extracted by the Geo Pipe
* `activity`: values from the Activity List, augmented from the original data
* `organizer`: values from the `organizer` field or derived from the publisher
* `derived_from_type` and `derived_from_id`: the original type of the main raw data object that the `NormalisedEvent` was extracted from, and the id we generated locally (aka `_id` in elasticsearch)
* `derived_from_parent_type` and `derived_from_parent_id`: (not always applicable) the original type of the raw data object any additional properties of the `NormalisedEvent` were extracted from - probably a parent/superEvent - and the id we generated locally for it (aka `_id` in elasticsearch)
* `part_of_id`: if a NormalisedEvent was derived from an event with a parent that is *also* a NormalisedEvent, put the NormalisedEvent (`_id`) of the parent here

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

However some publishers are not in that feed and some publishers have more than one feed. You can pass a URL of a file that has some extra data, for instance the `datasets.json` file in this repository.

The JSON schema is slightly different (see `data-url` string vs `data-urls` dict) but the code can handle either format.

### State

By default, the stage 1 runner will run incrementally - it will remember how far it got and start from the same place next time.

The state is stored in the Elasticsearch index set in `src/lib/settings.js`, `elasticIndexStage1State` variable.

If you want it to start from scratch for all publishers, simply delete this index and run again.

If you want it to start from scratch for one publisher, look in the index, find the correct record and delete it. Then run again. 

### Seeing Progress

Unfortunately, an RPDE API does not give you indication of how much more data there is to come - only a boolean feedback indicating if it's finished or not.

Thus we can't provide any insight on how long stage 1 will take.

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

### Seeing Progress

It is possible to work out how much progress stage 2 has made for any publisher. We have not done this in code, so this is just a loose description. 

Look up the `updatedLastSeen` value for a publisher in the index set in `src/lib/settings.js`, `elasticIndexStage2State` variable.

In the raw data index (set in `src/lib/settings.js`, `elasticIndexRaw` variable) count how many documents for this publisher have an `updated` value before and after the `updatedLastSeen` value. From this you can construct a percentage of how much work it has done. It's: `before count` / (`before count` + `after count`)

If there is no `updatedLastSeen` value for a publisher, the answer is 0%.


## Running the harvester - Both Stages at once

 
Hint: use [nvm](https://github.com/nvm-sh/nvm) to manage node versions!

node version > 13 (with esm support & es6)

`$ node ./src/bin/harvester-bothstages.js`

node version < 13

```
$ npm run build
$ node ./dist/bin/harvester-bothstages.js
```

In this mode, it will work on all publishers at the same time. As soon as it has finished stage 1 for a publisher it will start stage 2 for that publisher. So it may start stage 2 for one publisher while still working on stage 1 for another publisher.

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

Set up Config Vars (Settings section):

* ELASTICSEARCH_USERNAME
* ELASTICSEARCH_PASSWORD
* ELASTICSEARCH_URL - full URL, like: https://xxxxxxxxxxxx.eu-west-2.aws.cloud.es.io:9243/

Link a GitHub account and set up deploys from GitHub repository. Set it up to deploy automatically from `master` branch. Start a deploy manually now.

Go to the resources tab. Edit `web` and disable. Edit `worker` and enable.

You only want one worker; currently if you try and scale up the workers to more than 1 they will just duplicate effort.

### Kibana

#### Index Patterns

These need to be set up after some code has been run, so the indexes have been created and they have some data in them.

Go to `/app/kibana#/management/kibana/index_patterns?_g=()`

First create a index pattern for `harvester-raw`.
* Select `updated` as the Time Filter field name

Then create a index pattern for `harvester-normalised`.
* Select `start_date` as the Time Filter field name

#### Map

Go to `/app/maps#/?_g=()`.

Create a map.

Add layer:
* Type: Documents
* Index pattern: `harvester-normalised`
* Name: `Points`


Add another layer:
* Type: Grid Aggregation
* Index pattern: `harvester-normalised`
* Show as: Points
* Name: `Count`
* In Layer style change symbol size to 10 to 32 and select a 


Click Save (Top Menu) and name the map `Normalised Data`.


### Stopping and starting Heroku worker

You may want to do this if you need to change something in an external resource and want the worker to reload this properly.

Go to the resources tab. Edit `worker` and disable. Wait a minute. Edit `worker` and enable.


