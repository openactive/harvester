import Pipe from './pipe.js';
import { cache } from '../utils.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

class TestPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      let normalisedEvent1 = new NormalisedEvent("id1", {
        "test": 1,
        "data": this.rawData.data
        });

      this.normalisedEvents.push(normalisedEvent1);


      let normalisedEvent2 = new NormalisedEvent("id2", {
        "test": 2,
        "data": this.rawData.data
        });
      this.normalisedEvents.push(normalisedEvent2 );


      resolve(this.normalisedEvents);
    });
  }
}

export default TestPipe;