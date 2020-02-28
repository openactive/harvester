import Utils from "../utils.js";

class Pipe {
  constructor(rpdeItemUpdate) {
    this.rpdeItemUpdate = rpdeItemUpdate;
  }

  /* Override this function */
  run(){
    return new Promise(async resolve => {
      log(`Running ${this.augmentedActivity.id} - ${this.augmentedActivity.data.name} through ${this.constructor.name}`);
      /* Do stuff to the activity here */
      resolve(this.rpdeItemUpdate);
    });
  }

  log(msg) {
    Utils.log(msg, this.constructor.name);
  }

}

export default Pipe