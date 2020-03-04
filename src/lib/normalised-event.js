
/** This is used in stage 2, and holds information on a normalised event.
Pipelines can create any number of these as they process data.
**/
class NormalisedEvent {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

}

export default NormalisedEvent;
