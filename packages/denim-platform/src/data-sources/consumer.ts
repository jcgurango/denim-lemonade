import { DenimCombinedDataSourceV2, DenimDataSourceV2 } from 'denim';
import {
  SchemaResult as AirTableSchemaResult,
  AirTableDataSourceV2,
} from 'denim-airtable';
import Airtable from 'airtable';

// Data source for the consumer backend.
const consumerDataSource = async (schemaSource: DenimDataSourceV2) => {
  const dataConnections = await schemaSource.retrieveRecords(
    'data-connections',
    {
      retrieveAll: true,
    }
  );

  const sources: DenimDataSourceV2[] = [];

  dataConnections.forEach((connection) => {
    const config: any = JSON.parse(String(connection.connectionConfiguration || '{ }'));

    if (connection.type === 'airtable') {
      const result: AirTableSchemaResult = JSON.parse(String(connection.cache));
      const airtable = new Airtable({
        apiKey: result.apiKey,
      });

      if (config.selectedBases) {
        const selectedBases: string[] = config.selectedBases;

        selectedBases.forEach((base) => {
          if (result.bases[base]) {
            sources.push(
              new AirTableDataSourceV2(
                airtable.base(base),
                result.bases[base].tables
              )
            );
          }
        });
      }
    }
  });

  return new DenimCombinedDataSourceV2(...sources);
};

export default consumerDataSource;
