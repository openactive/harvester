
/** This is used in stage 2, and holds information on a document from the Elastic index **/
class RawData {
  constructor(data) {
    this.id = data._id;
    this.data = data._source.data;
    this.meta = data._source;
  }


}

export default RawData;
