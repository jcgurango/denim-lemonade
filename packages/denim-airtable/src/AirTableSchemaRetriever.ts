import cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';
import got from 'got';
import { AirTable } from './types/schema';

export default class AirTableSchemaRetriever {
  static async retrieveSchema(
    email: string,
    password: string,
    ...baseId: string[]
  ): Promise<AirTable[][]> {
    const cookieJar = new CookieJar();

    const loginPage = await got('https://www.airtable.com/login', {
      cookieJar,
    }).text();

    const loginPageSchema = cheerio.load(loginPage);
    const _csrf = loginPageSchema('[name=_csrf]').val();

    const loginAttempt = await got('https://airtable.com/auth/login/', {
      method: 'POST',
      form: {
        _csrf,
        email,
        password,
      },
      cookieJar,
      followRedirect: false,
    }).text();

    const schemas: AirTable[][] = [];

    if (loginAttempt === 'Found. Redirecting to /') {
      for (let i = 0; i < baseId.length; i++) {
        // Success.
        const baseDocsPage = await got(
          `https://airtable.com/${baseId[i]}/api/docs`,
          {
            cookieJar,
          }
        ).text();
        const baseDocsPageSchema = cheerio.load(baseDocsPage);
        const window: any = {};
        eval(
          baseDocsPageSchema(baseDocsPageSchema('script')[1]).html() ||
            'window.empty = true;'
        );

        if (window.empty) {
          throw new Error(`Failed to retrieve schema for ${baseId}.`);
        }
        const tables: AirTable[] = [];

        window.application.tables.forEach((table: any) => {
          tables.push({
            id: table.id,
            name: table.name,
            columns: table.columns.map((column: any) => ({
              id: column.id,
              name: column.name,
              type: column.type,
              typeOptions: column.typeOptions,
            })),
          });
        });

        schemas.push(tables);
      }

      return schemas;
    } else {
      // Get error.
      const loginPage = await got('https://www.airtable.com/login', {
        cookieJar,
      }).text();
      throw new Error(cheerio.load(loginPage)('.small.strong.quiet').text());
    }
  }
}
