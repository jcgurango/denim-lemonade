import cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';
import got from 'got';
import { AirTable } from './types/schema';

type SchemaResult = {
  apiKey: string;
  bases: {
    [key: string]: {
      name: string;
      category: string;
      tables: AirTable[];
    };
  };
};

export default class AirTableSchemaRetriever {
  static async retrieveSchema(
    email: string,
    password: string,
    ...baseIds: string[]
  ): Promise<SchemaResult> {
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

    const result: SchemaResult = {
      apiKey: '',
      bases: {},
    };

    if (loginAttempt === 'Found. Redirecting to /') {
      // Retrieve all bases.
      console.log('Retrieving bases...');
      const apiPage = await got('https://airtable.com/api', {
        cookieJar,
      }).text();
      const $apiPage = cheerio.load(apiPage);
      const baseIdList: string[] = [];

      $apiPage('a[href$="/api/docs"]').each(function () {
        const $link = $apiPage(this);
        const [, baseKey] = /\/(.+)\/api\/docs/g.exec(
          String($link.attr('href'))
        ) || [null, null];

        if (baseKey && (!baseIds.length || baseIds.includes(baseKey))) {
          baseIdList.push(baseKey);
          result.bases[baseKey] = {
            name: '',
            category: $link.parent().find('div.py1.mb1.quieter.strong').text(),
            tables: [],
          };
        }
      });

      for (let i = 0; i < baseIdList.length; i++) {
        const baseId = baseIdList[i];

        // Success.
        const baseDocsPage = await got(
          `https://airtable.com/${baseId}/api/docs`,
          {
            cookieJar,
          }
        ).text();
        const baseDocsPageSchema = cheerio.load(baseDocsPage);

        if (!result.apiKey) {
          result.apiKey = String(
            baseDocsPageSchema('div[data-api-key]').attr('data-api-key')
          );
        }

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

        result.bases[baseId].name = window.application.name;
        result.bases[baseId].tables = tables;
      }

      return result;
    } else {
      // Get error.
      const loginPage = await got('https://www.airtable.com/login', {
        cookieJar,
      }).text();
      throw new Error(cheerio.load(loginPage)('.small.strong.quiet').text());
    }
  }
}
