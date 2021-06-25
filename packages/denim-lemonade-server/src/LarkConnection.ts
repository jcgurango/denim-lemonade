import bent, { RequestFunction } from 'bent';

export type RequestFunctions = {
  get: RequestFunction<any>;
  post: RequestFunction<any>;
  put: RequestFunction<any>;
  token: string;
};
export type RequestCallback = (functions: RequestFunctions) => any;

export default class LarkConnection {
  public appId: string;
  public appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  async withAppAccessToken(
    callback: RequestCallback,
    mapResponseData?: (responseData: any) => any,
  ) {
    const { app_access_token } = await bent('POST', 'json')(
      'https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal',
      {
        app_id: this.appId,
        app_secret: this.appSecret,
      },
    );

    const get = bent('GET', 'json');
    const post = bent('POST', 'json');
    const put = bent('PUT', 'json');

    const result = await callback({
      get,
      post,
      put,
      token: app_access_token,
    });

    if (result) {
      if (result.code) {
        console.error(result);
        throw new Error(result.msg);
      }

      return mapResponseData ? mapResponseData(result.data) : result.data;
    }
  }

  async withTenantAccessToken(
    callback: RequestCallback,
    mapResponseData?: (responseData: any) => any,
  ) {
    const { tenant_access_token } = await bent('POST', 'json')(
      'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal/',
      {
        app_id: this.appId,
        app_secret: this.appSecret,
      },
    );

    const get = bent('GET', 'json', {
      Authorization: 'Bearer ' + tenant_access_token,
    });

    const post = bent('POST', 'json', {
      Authorization: 'Bearer ' + tenant_access_token,
    });

    const put = bent('PUT', 'json', {
      Authorization: 'Bearer ' + tenant_access_token,
    });

    const result = await callback({
      get,
      post,
      put,
      token: tenant_access_token,
    });

    if (result) {
      if (result.code) {
        console.error(result);
        throw new Error(result.msg);
      }

      return mapResponseData ? mapResponseData(result.data) : result.data;
    }
  }
}
