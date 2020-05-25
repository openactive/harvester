const Settings = {
  // There is no good reason some start "elasticsearch" and some start "elastic". Sorry.
  "elasticsearchUsername": process.env.ELASTICSEARCH_USERNAME,
  "elasticsearchPassword": process.env.ELASTICSEARCH_PASSWORD,
  "elasticsearchURL": process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  "elasticIndexRaw": process.env.ELASTICSEARCH_INDEX_RAW || "harvester-raw",
  "elasticIndexStage1State": process.env.ELASTICSEARCH_INDEX_STAGE_1_STATE || "harvester-stage-1-state",
  "elasticIndexNormalised": process.env.ELASTICSEARCH_INDEX_NORMALISED || "harvester-normalised",
  "elasticIndexStage2State": process.env.ELASTICSEARCH_INDEX_STAGE_2_STATE || "harvester-stage-2-state",

  // "registryURL": "https://raw.githubusercontent.com/openactive/harvester/virtual-events/datasets.json",
  "registryURL": "https://raw.githubusercontent.com/openactive/harvester/master/datasets.json",

  // For dev, can also do
  //"registryURL": "http://localhost:3001",

  "activityListJSONLD": "https://www.openactive.io/activity-list/activity-list.jsonld"
}

export default Settings;
