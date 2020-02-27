import Utils from './utils.js';
import Elasticsearch from '@elastic/elasticsearch';

class ActivityStore {

  constructor(esIndex, esHarvesterStateIndex){
    this.user = process.env.ELASTICSEARCH_USERNAME;
    this.pass = process.env.ELASTICSEARCH_PASSWORD;
    this.esIndex = esIndex;
    this.esHarvesterStateIndex = esHarvesterStateIndex;
    let clientOptions = { node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' };
    if (this.user && this.pass) {
      clientOptions['auth'] = { username: this.user, password: this.pass };
    }
    this.client = new Elasticsearch.Client(clientOptions);
  }

  async delete(publisherKey, activity) {
    try {
      await this.client.delete({
        index: this.esIndex,
        id: publisherKey + "-" + activity.id,
        refresh: 'wait_for',
      });
    } catch (e) {
      // A 404 here is natural - we may be seeing a delete message from the API for a data item we have never seen before
      // TODO can we raise errors that aren't a 404?
    }
  }

  async update(rpdeItemUpdate) {
    console.log(`Adding into ES ${rpdeItemUpdate.data.name}`);
    try {
      await this.client.index({
        index: this.esIndex,
        id: rpdeItemUpdate.publisher + "-" + rpdeItemUpdate.api_id,
        body: rpdeItemUpdate,
        refresh: 'wait_for',
      });
    } catch (e) {
      console.log(`Error adding ${e}`);
    }
  }

  async stateGet(publisherId) {
    try {
      const result = await this.client.get({
        index: this.esHarvesterStateIndex,
        id: publisherId
      });

      return result.body._source;
    } catch (e) {
      // Assuming error is a 404  TODO should check that
      return { last_timestamp: null, last_id: null };
    }
  }

  async stateUpdate(publisherId, lastTimestamp, lastId) {
    try {
      await this.client.delete({
        index: this.esHarvesterStateIndex,
        id: publisherId,
        refresh: 'wait_for',
      });
    } catch (e) {
      // console.log(`"error deleting ${e}`);
    }

    try {
      await this.client.index({
        index: this.esHarvesterStateIndex,
        id: publisherId,
        body: {
          last_timestamp: lastTimestamp,
          last_id: lastId
        },
        refresh: 'wait_for',
      });
    } catch (e) {
      console.log(`Error adding ${e}`);
    }
  }

  async setupIndex() {

    return new Promise(async resolve => {

      // Main Index
      const esIndexExistsQ = await this.client.indices.exists({
        index: this.esIndex,
      });


      if (!esIndexExistsQ.body) {
        console.log(`Creating index ${this.esIndex}`);
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
                "publisher": {
                  "type": "keyword"
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
        console.log(`Creating index ${this.esHarvesterStateIndex}`);
        const esHarvesterStateIndexCreateQ = await this.client.indices.create({
          index: this.esHarvesterStateIndex,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esHarvesterStateIndexCreateQ.error) {
          resolve(esHarvesterStateIndexCreateQ.error);
        }
      }

      // Done
      resolve(true);
    });

  }
}

export default ActivityStore