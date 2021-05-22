const { AirTableSchemaRetriever } = require('denim-airtable');
const fs = require('fs');

(async () => {
  const [
    coreBaseSchema,
    movementBaseSchema,
    timekeepingBaseSchema,
  ] = await AirTableSchemaRetriever.retrieveSchema(
    process.env.AIRTABLE_USERNAME,
    process.env.AIRTABLE_PASSWORD,
    process.env.CORE_BASE_ID,
    process.env.MOVEMENT_BASE_ID,
    process.env.TIMEKEEPING_BASE_ID,
  );

  fs.writeFileSync('../denim-lemonade/src/schema/airtable-schema.json', JSON.stringify(coreBaseSchema, null, '\t'));
  fs.writeFileSync('../denim-lemonade/src/schema/airtable-movement-schema.json', JSON.stringify(movementBaseSchema, null, '\t'));
  fs.writeFileSync('../denim-lemonade/src/schema/airtable-timekeeping-schema.json', JSON.stringify(timekeepingBaseSchema, null, '\t'));
})();
