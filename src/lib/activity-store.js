import Elasticsearch from '@elastic/elasticsearch';

class ActivityStore {

  constructor(){
    this.user = "test";
    this.pass = "test";
    this.esIndex = "test";
    this.client = new Elasticsearch.Client({ node: 'http://localhost:9200' });
  }

  async delete(activity){

    console.log(`Deleting ${activity.id} from the store`)
  }

  async add(activity){}

  async update(activity){
    console.log(`Updating ${activity.data.name} in the store`)
    await this.delete(activity);
    this.add(activity);
  }
}

export default ActivityStore