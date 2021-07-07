import bcrypt from 'bcrypt';
import { DenimDataSourceV2, DenimQueryOperator } from 'denim';
import randomString from 'random-string';
import {
  CallbackResult,
  DenimAuthenticationRouterProvider,
} from './DenimAuthenticationRouter';

export default class DenimDbAuthProvider extends DenimAuthenticationRouterProvider {
  public codes: {
    [key: string]: {
      userId: string;
      redirectUrl: string;
    };
  } = {};
  usersTable: string;
  usernameColumn: string;
  passwordColumn: string;

  constructor(
    dataSource: DenimDataSourceV2,
    usersTable: string,
    usernameColumn: string,
    passwordColumn: string
  ) {
    super('database', dataSource);
    this.usersTable = usersTable;
    this.usernameColumn = usernameColumn;
    this.passwordColumn = passwordColumn;
  }

  public async authorize(
    redirectUrl: string,
    callbackUrl: string,
    body: any
  ): Promise<string> {
    const { username, password } = body;

    if (username && password) {
      // Look for the user.
      const [user] = await this.dataSource.retrieveRecords(this.usersTable, {
        conditions: {
          conditionType: 'single',
          field: this.usernameColumn,
          operator: DenimQueryOperator.Equals,
          value: username,
        },
        pageSize: 1,
        page: 1,
      });

      if (user) {
        const hashedPassword = String(user[this.passwordColumn]);

        if (await bcrypt.compare(password, hashedPassword)) {
          const code = randomString({ length: 24 });
          this.codes[code] = {
            redirectUrl,
            userId: user.id || '',
          };

          return callbackUrl + '&code=' + code;
        }
      }
    }

    throw new Error('Invalid credentials.');
  }

  public async callback(
    queryParams: any
  ): Promise<CallbackResult | null> {
    if (this.codes[queryParams.code]) {
      const data = this.codes[queryParams.code];
      delete this.codes[queryParams.code];

      return data;
    }

    throw new Error('Invalid credentials.');
  }
}
