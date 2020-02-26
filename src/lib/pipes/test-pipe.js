import Pipe from './pipe.js';
import { cache } from '../utils.js';

class TestPipe extends Pipe {

  run(){
    return new Promise(async resolve => {
      console.log(`Running ${this.augmentedActivity.id} - ${this.augmentedActivity.data.name} through ${this.constructor.name}`);
      cache.counter++;
      console.log(cache);
      this.augmentedActivity['test-data'] = '1234';
      resolve(this.augmentedActivity);
    });
  }
}

export default TestPipe;