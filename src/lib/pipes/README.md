## Adding attributes to the datastore

If you wish to add new attributes to the datastore for analysis, there are two steps that need to be taken:

1. Add the relevant field to the Elasticsearch mapping file
2. Ensure that the field is populated from the feed.

Note that both of these steps involve Stage 2 of the process; the harvesting (Stage 1) process should be unaffected.

### Setting Elasticsearch mappings

Additions to the mapping file need to be indicated in `src/lib/activity-store.js` file.

### Processing new attributes

Processing of new attributes needs to be done in the the files for processing individual event types - typically within the `parseEvent` method. These files currently include:

* `normalise-event-pipe.js`
* `normalise-eventseries-pipe.js`
* `normalise-ondemand-event.js`
* `normalise-scheduledsession.js`
