import Utils from './utils.js';
import Elasticsearch from '@elastic/elasticsearch';

class ActivityStore {

  constructor(esIndex, esHarvesterStateIndex, esNormalisedIndex){
    this.user = process.env.ELASTICSEARCH_USERNAME;
    this.pass = process.env.ELASTICSEARCH_PASSWORD;
    this.esIndex = esIndex;
    this.esHarvesterStateIndex = esHarvesterStateIndex;
    this.esNormalisedIndex = esNormalisedIndex;
    let clientOptions = { node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' };
    if (this.user && this.pass) {
      clientOptions['auth'] = { username: this.user, password: this.pass };
    }
    this.client = new Elasticsearch.Client(clientOptions);
  }

  async delete(rpdeItemUpdate) {
    log(`${this.esIndex} Deleting ${rpdeItemUpdate.id()}`);
    rpdeItemUpdate.updated = Date.now();
    try {
      await this.client.index({
        index: this.esIndex,
        id: rpdeItemUpdate.id(),
        body: rpdeItemUpdate,
        refresh: 'wait_for',
      });
    } catch (e) {
      // A 404 here is natural - we may be seeing a delete message from the API for a data item we have never seen before
      // TODO can we raise errors that aren't a 404?
    }
  }

  async update(rpdeItemUpdate) {
    log(`${this.esIndex} Adding/Updating ${rpdeItemUpdate.id()}`);
    rpdeItemUpdate.updated = Date.now();
    try {
      await this.client.index({
        index: this.esIndex,
        id: rpdeItemUpdate.id(),
        body: rpdeItemUpdate,
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${this.esIndex} Error Adding/Updating ${rpdeItemUpdate.id()} \n ${e}`);
      log(rpdeItemUpdate);
    }
  }

  async get(start, count) {
    try {
      return await this.client.search({
        index: this.esIndex,
        body: {
          "query": {
            "match_all": {}
          },
          "from" : start,
          "size" : count,
        }
      });
    } catch (e) {
      log(`${this.esIndex} Error Searching ${e}`);
    }
  }



  async updateNormalised(normalisedEvent) {
    log(`${this.esIndex} Adding/Updating ${normalisedEvent.id}`);
    try {
      await this.client.index({
        index: this.esNormalisedIndex,
        id: normalisedEvent.id,
        body: normalisedEvent.data,
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${this.esIndex} Error Adding/Updating ${normalisedEvent.id} \n ${e}`);
    }
  }

  async stateGet(publisherId, feedKey) {
    try {
      const result = await this.client.get({
        index: this.esHarvesterStateIndex,
        id: publisherId + "-" + feedKey
      });

      return result.body._source;
    } catch (e) {
      // Assuming error is a 404  TODO should check that
      return { nextURL: null };
    }
  }

  async stateUpdate(publisherId, feedKey, nextURL) {
    try {
      await this.client.index({
        index: this.esHarvesterStateIndex,
        id: publisherId + "-" + feedKey,
        body: {
          nextURL: nextURL
        },
        refresh: 'wait_for',
      });
    } catch (e) {
      log(`${this.esHarvesterStateIndex} Error Updating State ${publisherId} \n ${e}`);
    }
  }

  async setupIndex() {

    return new Promise(async resolve => {

      // Main Index
      const esIndexExistsQ = await this.client.indices.exists({
        index: this.esIndex,
      });


      if (!esIndexExistsQ.body) {
        log(`Creating index ${this.esIndex}`);
        const esIndexCreateQ = await this.client.indices.create({
          index: this.esIndex,
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

      // State Index
      const esHarvesterStateIndexExistsQ = await this.client.indices.exists({
        index: this.esHarvesterStateIndex,
      });


      if (!esHarvesterStateIndexExistsQ.body) {
        log(`Creating index ${this.esHarvesterStateIndex}`);
        const esHarvesterStateIndexCreateQ = await this.client.indices.create({
          index: this.esHarvesterStateIndex,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esHarvesterStateIndexCreateQ.error) {
          resolve(esHarvesterStateIndexCreateQ.error);
        }
      }  
      
      
      
      // Normalised Index
      const esNormalisedIndexExistsQ = await this.client.indices.exists({
        index: this.esNormalisedIndex,
      });


      if (!esNormalisedIndexExistsQ.body) {
        log(`Creating index ${this.esNormalisedIndex}`);
        const esNormalisedIndexCreateQ = await this.client.indices.create({
          index: this.esNormalisedIndex,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esNormalisedIndexCreateQ.error) {
          resolve(esNormalisedIndexCreateQ.error);
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