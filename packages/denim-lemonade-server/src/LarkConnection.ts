import bent, { RequestFunction } from 'bent';

export type RequestFunctions = {
  get: RequestFunction<any>;
  post: RequestFunction<any>;
  patch: RequestFunction<any>;
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

    const get: RequestFunction<any> = async (...args: any[]) => {
      try {
        return await (bent('GET', 'json') as any)(...args);
      } catch (e) {
        if (e.json) {
          try {
            const response = await e.json();
            return response;
          } catch (e) {
          }
        }

        throw e;
      }
    };

    const post: RequestFunction<any> = async (...args: any[]) => {
      try {
        return await (bent('POST', 'json') as any)(...args);
      } catch (e) {
        if (e.json) {
          try {
            const response = await e.json();
            return response;
          } catch (e) {
          }
        }

        throw e;
      }
    };

    const patch: RequestFunction<any> = async (...args: any[]) => {
      try {
        return await (bent('PATCH', 'json') as any)(...args);
      } catch (e) {
        if (e.json) {
          try {
            const response = await e.json();
            return response;
          } catch (e) {
          }
        }

        throw e;
      }
    };

    const result = await callback({
      get,
      post,
      patch,
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

    const get: RequestFunction<any> = async (...args: any[]) => {
      try {
        return await (bent('GET', 'json', {
          Authorization: 'Bearer ' + tenant_access_token,
        }) as any)(...args);
      } catch (e) {
        if (e.json) {
          try {
            const response = await e.json();
            return response;
          } catch (e) {
          }
        }

        console.log(args);
        throw e;
      }
    };

    const post: RequestFunction<any> = async (...args: any[]) => {
      try {
        return await (bent('POST', 'json', {
          Authorization: 'Bearer ' + tenant_access_token,
        }) as any)(...args);
      } catch (e) {
        if (e.json) {
          try {
            const response = await e.json();
            return response;
          } catch (e) {
          }
        }

        console.log(args);
        throw e;
      }
    };

    const patch: RequestFunction<any> = async (...args: any[]) => {
      try {
        return await (bent('PATCH', 'json', {
          Authorization: 'Bearer ' + tenant_access_token,
        }) as any)(...args);
      } catch (e) {
        if (e.json) {
          try {
            const response = await e.json();
            return response;
          } catch (e) {
          }
        }

        console.log(args);
        throw e;
      }
    };

    const result = await callback({
      get,
      post,
      patch,
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
