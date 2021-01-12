import { AirTableDataSource } from '../denim/connectors/airtable';
import AirTableSchemaSource from '../denim/connectors/airtable/AirTableSchemaSource';
import DenimDataSourceRouter from '../denim/express/DenimDataSourceRouter';
import { DenimCombinedDataSource, DenimDataSource } from '../denim/service';

export default (data: DenimDataSource<any, any>) => {
  const source = new DenimCombinedDataSource(
    data,
    new AirTableDataSource<{}, AirTableSchemaSource<{}>>(
      new AirTableSchemaSource<{}>(
        require('../schema/airtable-test-schema.json'),
      ),
      'appDvEQrTWmwWIKlG',
    ),
  );

  source.registerLink('Test Link', 'Employee', 'Test Link', false);
  source.registerLink('Test Link', 'Employee', 'Test Multi Link', true);

  return source;
};
