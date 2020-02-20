class Pipe {
  constructor(activity) {
    this.augmentedActivity = activity;

    if (!this.augmentedActivity.hasOwnProperty('updated-by')){
      this.augmentedActivity['updated-by'] = [];
    }

    this.augmentedActivity['updated-by'].push(this.constructor.name);
  }

  /* Override this function */
  run(){
    return new Promise(async resolve => {
      console.log(`Running ${this.augmentedActivity.id} - ${this.augmentedActivity.data.name} through ${this.constructor.name}`);
      /* Do stuff to the activity here */
      resolve(this.augmentedActivity);
    });
  }

}

export default Pipe