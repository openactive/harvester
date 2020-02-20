import pipes from './pipes/index.js';

class PipeLine {
  constructor(activity, pipeOutputCb) {
    this.activity = activity;
    this.pipeOutputCb = pipeOutputCb;
  }

  run() {
    return new Promise(async resolve => {
      if (this.activity.state == 'deleted') {
        this.pipeOutputCb(augmentedActivity);
      } else {
        for (const Pipe of pipes) {
          try {
            const pipeSection = new Pipe(this.activity);

            const augmentedActivity = await pipeSection.run();
            this.pipeOutputCb(augmentedActivity);

          } catch (error) {
            console.log(`Error running data through pipe: ${error}`);
          }
        }
      }

      resolve("All pipes run");
    });
  }

}

export default PipeLine;