import Utils from './utils.js';
import Elasticsearch from '@elastic/elasticsearch';

class ActivityStore {

  constructor(esIndex){
    this.user = "test";
    this.pass = "test";
    this.esIndex = esIndex;
    this.client = new Elasticsearch.Client({ node: 'http://localhost:9200' });
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