
class RPDEItem {
  constructor(activityItem, publisherKey, feedKey) {
    this.api_id = activityItem.id;
    this.publisher_id = publisherKey;
    this.feed_id = feedKey;
  }

  id(){
    return this.publisher_id + "-" + this.feed_id + "-" + this.api_id;
  }
}

export default RPDEItem;
