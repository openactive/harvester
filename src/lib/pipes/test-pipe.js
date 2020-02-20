import Pipe from './pipe.js';

class TestPipe extends Pipe {

  run(){
    return new Promise(async resolve => {
      console.log(`Running ${this.augmentedActivity.id} - ${this.augmentedActivity.data.name} through ${this.constructor.name}`);
      this.augmentedActivity['test-data'] = '1234';
      resolve(this.augmentedActivity);
    });
  }
}

export default TestPipe;