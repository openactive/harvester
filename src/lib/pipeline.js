import pipes from './pipes/index.js';

class PipeLine {
  constructor(rawData, pipeOutputCb) {
    this.rawData = rawData;
    this.pipeOutputCb = pipeOutputCb;
  }

  run() {
    return new Promise(async resolve => {
      let normalisedEvents = [];
      for (const Pipe of pipes) {
        try {
          const pipeSection = new Pipe(this.rawData, normalisedEvents);
          normalisedEvents = await pipeSection.run();
        } catch (error) {
          Utils.log(`Error running data through pipe ${pipeSection.constructor.name} \n ${error}`);
        }
      }
      this.pipeOutputCb(normalisedEvents);

      resolve("All pipes run");
    });
  }

}

export default PipeLine;