import Pipe from './pipe.js';
import { cache } from '../utils.js';

class TestPipe extends Pipe {

  run(){
    return new Promise(async resolve => {
      console.log(`Running ${this.rpdeItemUpdate.api_id} - ${this.rpdeItemUpdate.data.name} through ${this.constructor.name}`);
      cache.counter++;
      console.log(cache);
      this.rpdeItemUpdate['test-data'] = '1234';
      resolve(this.rpdeItemUpdate);
    });
  }
}

export default TestPipe;