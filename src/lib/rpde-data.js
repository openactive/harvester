

class RPDEItemUpdate {
  constructor(activityItem, publisherKey, feedKey) {
    this.data = activityItem.data;
    this.api_id = activityItem.id;
    this.kind = activityItem.kind;
    this.publisher = publisherKey;
    this.feed_id = feedKey;
  }

  id(){
    return this.publisher + "-" + this.feed_id + "-" + this.api_id;
  }
}

export default RPDEItemUpdate