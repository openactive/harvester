const Settings = {
  // There is no good reason some start "elasticsearch" and some start "elastic". Sorry.
  "elasticsearchUsername": process.env.ELASTICSEARCH_USERNAME,
  "elasticsearchPassword": process.env.ELASTICSEARCH_PASSWORD,
  "elasticsearchURL": process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  "elasticIndexRaw": process.env.ELASTICSEARCH_INDEX_RAW || "open-active-raw",
  "elasticIndexStage1State": process.env.ELASTICSEARCH_INDEX_STAGE_1_STATE || "open-active-raw-harvester-state",
  "elasticIndexNormalised": process.env.ELASTICSEARCH_INDEX_NORMALISED || "open-active-normalised",
  "elasticIndexStage2State": process.env.ELASTICSEARCH_INDEX_STAGE_2_STATE || "open-active-stage-2-state",

  "registryURL": "https://raw.githubusercontent.com/odscjames/openactive-sources/master/datasets.json",
  // For dev, can also do
  //"registryURL": "http://localhost:3001",

  "activityListJSONLD": "https://www.openactive.io/activity-list/activity-list.jsonld"
}

export default Settings;
