import Utils from './utils.js';
import Elasticsearch from '@elastic/elasticsearch';
import Settings from './settings.js';

class ActivityStore {

  constructor(){
    let clientOptions = { node: Settings.elasticsearchURL };
    if (Settings.elasticsearchUsername && Settings.elasticsearchPassword) {
      clientOptions['auth'] = { username: Settings.elasticsearchUsername, password: Settings.elasticsearchPassword };
    }
    this.client = new Elasticsearch.Client(clientOptions);
  }

  /** Deletes an item of raw data. Used in stage 1.
  Actually we do soft deletes, so it saves it with a flag. **/
  async delete(rpdeItemUpdate) {
    log(`${Settings.elasticIndexRaw} Deleting ${rpdeItemUpdate.id()}`);
    rpdeItemUpdate.updated = Date.now();
    try {
      await this.client.index({
        index: Settings.elasticIndexRaw,
        id: rpdeItemUpdate.id(),
        body: rpdeItemUpdate,
        refresh: 'wait_for',
      });
    } catch (e) {
      // A 404 here is natural - we may be seeing a delete message from the API for a data item we have never seen before
      // TODO can we raise errors that aren't a 404?
    }
  }

  /** Updates/Creates an item of raw data. Used in stage 1. **/
  async update(rpdeItemUpdate) {
    log(`${Settings.elasticIndexRaw} Adding/Updating ${rpdeItemUpdate.id()}`);
    rpdeItemUpdate.updated = Date.now();
    try {
      await this.client.index({
        index: Settings.elasticIndexRaw,
        id: rpdeItemUpdate.id(),
        body: rpdeItemUpdate,
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${Settings.elasticIndexRaw} Error Adding/Updating ${rpdeItemUpdate.id()} \n ${e}`);
      log(rpdeItemUpdate);
    }
  }

  /** Gets a page of raw data. Used in stage 2. **/
  async get(publisherKey, start, count, updatedLastSeen) {
    try {
      // In this query, we have to use gte not gt because we cant guarantee there is only one item for each timestamp.
      // If there are 2 with the same timestamp, the previous run might only have processed the 1st.
      // And thus if we used gt we might miss the 2nd.
      // This way means we might process same data twice but that's better than missing data.
      return await this.client.search({
        index: Settings.elasticIndexRaw,
        body: {
          "query": {
            "bool": {
              "must": [
                {
                  "range": {
                    "updated": {
                      "gte": updatedLastSeen
                    }
                  }
                },
                {
                  "term": {
                    "publisher_id": {
                      "value": publisherKey
                    }
                  }
                }
              ]
            // Dev: use when writing a pipeline and you want raw data of one type only
            // },
            // "term": {
            //   "data_type": {
            //    "value": "CourseInstance"
            //   }
            }
          },
          "sort" : [
            { "updated" : {"order" : "asc"}},
            "_doc"
          ],
          "from" : start,
          "size" : count,
        }
      });
    } catch (e) {
      log(`${Settings.elasticIndexRaw} Error Searching ${e}`);
    }
  }

  /** Gets from the raw data with a keyword search **/
  async getRawByKeyword(key, value){
    try {
      return await this.client.search({
        index: Settings.elasticIndexRaw,
        body: {
          "query": {
            "term": {
              [key]: {
                "value": value
              }
            }
          }
        }
      })
    } catch (e) {
      log(`${Settings.elasticIndexRaw} Error searching by keyword ${e}`);
    }
  }


  /** Updates/Creates an normalised event. Used in stage 2. **/
  async updateNormalised(normalisedEvent) {
    log(`${Settings.elasticIndexNormalised} Adding/Updating ${normalisedEvent.id()}`);
    try {
      await this.client.index({
        index: Settings.elasticIndexNormalised,
        id: normalisedEvent.id(),
        body: normalisedEvent.body,
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${Settings.elasticIndexNormalised} Error Adding/Updating ${normalisedEvent.id()} \n ${e}`);
    }
  }


  /** Gets state for a publisher and feed (next URL). Used in stage 1. **/
  async stateGet(publisherId, feedKey) {
    try {
      const result = await this.client.get({
        index: Settings.elasticIndexStage1State,
        id: publisherId + "-" + feedKey
      });

      return result.body._source;
    } catch (e) {
      // Assuming error is a 404  TODO should check that
      return { nextURL: null };
    }
  }


  /** Saves state for a publisher and feed - saves the next URL. Used in stage 1. **/
  async stateUpdate(publisherId, feedKey, nextURL) {
    try {
      await this.client.index({
        index: Settings.elasticIndexStage1State,
        id: publisherId + "-" + feedKey,
        body: {
          nextURL: nextURL
        },
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${Settings.elasticIndexStage1State} Error Updating State ${publisherId} \n ${e}`);
    }
  }

  /** Gets state for stage 2. **/
  async stage2StateGet(publisherKey) {
    try {
      const result = await this.client.get({
        index: Settings.elasticIndexStage2State,
        id: publisherKey
      });

      return result.body._source.updatedLastSeen;
    } catch (e) {
      // Assuming error is a 404  TODO should check that
      return 0;
    }
  }

  /** Saves state for stage 2. **/
  async stage2StateUpdate(publisherKey, updatedLastSeen) {
    try {
      await this.client.index({
        index: Settings.elasticIndexStage2State,
        id: publisherKey,
        body: {
          updatedLastSeen: updatedLastSeen
        },
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${Settings.elasticIndexStage1State} Error Updating Stage 2 State ${publisherKey} \n ${e}`);
    }
  }

  async setupIndex() {

    return new Promise(async resolve => {

      // Raw Index
      const esIndexExistsQ = await this.client.indices.exists({
        index: Settings.elasticIndexRaw,
      });


      if (!esIndexExistsQ.body) {
        log(`Creating index ${Settings.elasticIndexRaw}`);
        const esIndexCreateQ = await this.client.indices.create({
          index: Settings.elasticIndexRaw,
          body: {
            "settings": {},
            "mappings": {
              "properties": {
                "api_id": {
                  "type": "keyword"
                },
                "data": {
                  "type": "object",
                  "dynamic": false
                },
                "kind": {
                  "type": "keyword"
                },
                "data_id": {
                  "type": "keyword"
                },
                "data_type": {
                  "type": "keyword"
                },
                "publisher_id": {
                  "type": "keyword"
                },
                "feed_id": {
                  "type": "keyword"
                },
                "deleted": {
                  "type": "boolean"
                },
                "updated": {
                  "type": "date"
                }
              }
            }
          }
        });

        if (esIndexCreateQ.error) {
          resolve(esIndexCreateQ.error);
        }
      }

      // Stage 1 State Index
      const esHarvesterStateIndexExistsQ = await this.client.indices.exists({
        index: Settings.elasticIndexStage1State,
      });


      if (!esHarvesterStateIndexExistsQ.body) {
        log(`Creating index ${Settings.elasticIndexStage1State}`);
        const esHarvesterStateIndexCreateQ = await this.client.indices.create({
          index: Settings.elasticIndexStage1State,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esHarvesterStateIndexCreateQ.error) {
          resolve(esHarvesterStateIndexCreateQ.error);
        }
      }

      // Normalised Index
      const esNormalisedIndexExistsQ = await this.client.indices.exists({
        index: Settings.elasticIndexNormalised,
      });

      if (!esNormalisedIndexExistsQ.body) {
        log(`Creating index ${Settings.elasticIndexNormalised}`);
        const esNormalisedIndexCreateQ = await this.client.indices.create({
          index: Settings.elasticIndexNormalised,
           body: {
            "settings": {},
            "mappings": {
              "properties": {
                "data_id": {
                  "type": "keyword"
                },
                "name": {
                  "type": "text"
                },
                "name_label" : {
                  "type" : "keyword"
                },
                "description": {
                  "type": "text"
                },
                "event_status": {
                  "type": "keyword"
                },
                "event_attendance_mode" {
                  "type" : "keyword"
                },
                "location": {
                  "properties": {
                    "coordinates": {
                      "type": "geo_point"
                    },
                    "postcode": {
                      "type": "keyword"
                    },
                    "locality": {
                      "type": "keyword"
                    },
                    "region": {
                      "type": "keyword"
                    },
                    "country": {
                      "type": "keyword"
                    }
                  }
                },
                "organizer": {
                  "type": "text"
                },
                "organizer_label" : {
                  "type" : "text"
                },
                "start_date": {
                  "type": "date"
                },
                "end_date": {
                  "type": "date"
                },
                "activity": {
                  "type": "keyword"
                },
                "derived_from_type": {
                  "type": "keyword"
                },
                "derived_from_id": {
                  "type": "keyword"
                },
                "derived_from_parent_type": {
                  "type": "keyword"
                },
                "derived_from_parent_id": {
                  "type": "keyword"
                },
              }
            }
          }
        });

        if (esNormalisedIndexCreateQ.error) {
          resolve(esNormalisedIndexCreateQ.error);
        }



      // Stage 2 State Index
      const esStage2StateIndexExistsQ = await this.client.indices.exists({
        index: Settings.elasticIndexStage2State,
      });


      if (!esStage2StateIndexExistsQ.body) {
        log(`Creating index ${Settings.elasticIndexStage2State}`);
        const esStage2StateIndexCreateQ = await this.client.indices.create({
          index: Settings.elasticIndexStage2State,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esStage2StateIndexCreateQ.error) {
          resolve(esStage2StateIndexCreateQ.error);
        }
      }



      }

      // Done
      resolve(true);
    });

  }
}

function log(msg) {
  Utils.log(msg, "activity-store");
}

export default ActivityStore
