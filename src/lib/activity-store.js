import Utils from './utils.js';
import Elasticsearch from '@elastic/elasticsearch';

class ActivityStore {

  constructor(esIndex, esHarvesterStateIndex){
    this.user = process.env.ELASTICSEARCH_USERNAME;
    this.pass = process.env.ELASTICSEARCH_PASSWORD;
    this.esIndex = esIndex;
    this.esHarvesterStateIndex = esHarvesterStateIndex;
    let client_options = { node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' };
    if (this.user && this.pass) {
        client_options['auth'] = { username: this.user, password: this.pass };
    }
    this.client = new Elasticsearch.Client(client_options);
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

  async update(publisherKey, activity){
    try {
      console.log(`Adding into ES ${activity.data.name}`);
      await this.client.index({
        index: this.esIndex,
        id: publisherKey + "-" + activity.id,
        body: activity.data,
        refresh: 'wait_for',
      });
    } catch(e) {
      console.log(`Error adding ${e}`);
    }

  }

  async harvester_state_get_information(publisher_id) {
    try {
        let result =  await this.client.get({
            index: this.esHarvesterStateIndex,
            id: publisher_id
        })
        return result.body._source;
    } catch (e) {
        // Assuming error is a 404  TODO should check that
        return { last_timestamp: 0, last_id: 0 };
    }
  }

  async harvester_state_put_information(publisher_id, last_timestamp, last_id) {
    try {
      await this.client.delete({
          index: this.esHarvesterStateIndex,
          id: publisher_id,
          refresh: 'wait_for',
        });
    } catch(e){
      // console.log(`"error deleting ${e}`);
    }

    try {
        this.client.index({
          index: this.esHarvesterStateIndex,
          id: publisher_id,
          body: {
            last_timestamp: last_timestamp,
            last_id: last_id
          },
          refresh: 'wait_for',
        });
    } catch(e) {
      console.log(`Error adding ${e}`);
    }
  }

  async setupIndex(){

    return new Promise(async resolve => {

      // Main Index
      const esIndexExistsQ = await this.client.indices.exists({
        index: this.esIndex,
      });


      if (!esIndexExistsQ.body){
        console.log(`Creating index ${this.esIndex}`);
        const esIndexCreateQ = await this.client.indices.create({
          index: this.esIndex,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esIndexCreateQ.error){
          resolve(esIndexCreateQ.error);
        }
      }

      // Meta Index
      const esHarvesterStateIndexExistsQ = await this.client.indices.exists({
        index: this.esHarvesterStateIndex,
      });


      if (!esHarvesterStateIndexExistsQ.body){
        console.log(`Creating index ${this.esHarvesterStateIndex}`);
        const esHarvesterStateIndexCreateQ = await this.client.indices.create({
          index: this.esHarvesterStateIndex,
          /* body: { "settings": {}, "mappings": {} } */
        });

        if (esHarvesterStateIndexCreateQ.error){
          resolve(esHarvesterStateIndexCreateQ.error);
        }
      }

      // Done
      resolve(true);
    });

  }
}

export default ActivityStore