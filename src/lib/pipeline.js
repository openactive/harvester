import pipes from './pipes/index.js';

class PipeLine {
  constructor(rpdeItemUpdate, pipeOutputCb) {
    this.rpdeItemUpdate = rpdeItemUpdate;
    this.pipeOutputCb = pipeOutputCb;
  }

  run() {
    return new Promise(async resolve => {
      for (const Pipe of pipes) {
        try {
          const pipeSection = new Pipe(this.rpdeItemUpdate);
          this.rpdeItemUpdate = await pipeSection.run();
        } catch (error) {
          console.log(`Error running data through pipe: ${error}`);
        }
      }
      this.pipeOutputCb(this.rpdeItemUpdate);

      resolve("All pipes run");
    });
  }

}

export default PipeLine;