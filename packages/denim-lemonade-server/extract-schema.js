const { AirTableSchemaRetriever } = require('denim-airtable');
const fs = require('fs');

(async () => {
  const result = await AirTableSchemaRetriever.retrieveSchema(
    process.env.AIRTABLE_USERNAME,
    process.env.AIRTABLE_PASSWORD,
    process.env.CORE_BASE_ID,
    process.env.MOVEMENT_BASE_ID,
    process.env.TIMEKEEPING_BASE_ID,
  );

  const {
    bases: {
      [process.env.CORE_BASE_ID]: {
        tables: coreBaseSchema,
      },
      [process.env.MOVEMENT_BASE_ID]: {
        tables: movementBaseSchema,
      },
      [process.env.TIMEKEEPING_BASE_ID]: {
        tables: timekeepingBaseSchema,
      },
    },
  } = result;

  fs.writeFileSync('../denim-lemonade/src/schema/airtable-schema.json', JSON.stringify(coreBaseSchema, null, '\t'));
  fs.writeFileSync('../denim-lemonade/src/schema/airtable-movement-schema.json', JSON.stringify(movementBaseSchema, null, '\t'));
  fs.writeFileSync('../denim-lemonade/src/schema/airtable-timekeeping-schema.json', JSON.stringify(timekeepingBaseSchema, null, '\t'));
  
})();
