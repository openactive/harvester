import Utils from './utils.js';
import Elasticsearch from '@elastic/elasticsearch';

class ActivityStore {

  constructor(esIndex, esHarvesterStateIndex){
    this.user = process.env.ELASTICSEARCH_USERNAME;
    this.pass = process.env.ELASTICSEARCH_PASSWORD;
    this.esIndex = esIndex;
    let client_options = { node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' };
    if (this.user && this.pass) {
        client_options['auth'] = { username: this.user, password: this.pass };
    }
    this.client = new Elasticsearch.Client(client_options);
  }

  async delete(activity) {
    return this.client.delete({
      index: this.esIndex,
      id: activity.id,
      refresh: 'wait_for',
    });
  }

  async add(activity){
    return this.client.index({
      index: this.esIndex,
      id: activity.id,
      body: activity.data,
      refresh: 'wait_for',
    });
  }

  async update(activity){
    try {
      await this.delete(activity);
    } catch(e){
      // console.log(`"error deleting ${e}`);
    }

    try {
      console.log(`Adding into ES ${activity.data.name}`);
      await this.add(activity);
    } catch(e) {
      console.log(`Error adding ${e}`);
    }

  }

  async setupIndex(){

    return new Promise(async resolve => {

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
      resolve(true);
    });

  }
}

export default ActivityStore