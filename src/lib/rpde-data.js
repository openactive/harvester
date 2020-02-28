

class RPDEItemUpdate {
  constructor(item, publisherKey, feedKey) {
    this.data = item.data;
    this.api_id = item.id;
    this.kind = item.kind;
    this.publisher = publisherKey;
    this.feed_id = feedKey;
  }
}

export default RPDEItemUpdate