const { adminLogin } = require('lark-admin-simulator');
const { default: got } = require('got');
const tough = require('tough-cookie');
const qrcodeTerminal = require('qrcode-terminal');
const CookieFileStore = require('tough-cookie-file-store').FileCookieStore;

let cookies = null;
let csrfToken = '';

const getCsrfCookie = async (url = 'https://www.larksuite.com/approval/admin/approvalList', tokenCookie = '_csrf_token') => {
  const all = await cookies.getCookies(url);
  const cookie = all.find(({ key }) => key === tokenCookie);
  return cookie.value;
};

const crossAppLogin = async (host, appId, callbackUrl, cookieJar) => {
  const csrf = await getCsrfCookie(`https://${host}/suite/admin/appcenter/app/${appId}/auth_code`, 'csrf_token');

  const authCodeResponse = await got.get(`https://${host}/suite/admin/appcenter/app/${appId}/auth_code`, {
    cookieJar,
    headers: {
      'x-csrf-token': csrf,
    },
    responseType: 'json',
  });

  const { authCode } = authCodeResponse.body;

  await got.get(`${callbackUrl}&code=${authCode}`, {
    cookieJar,
  });
};

module.exports = {
  init: async () => {
    const cookieJar = new tough.CookieJar(new CookieFileStore('.larkadmincookie'));

    const adminResponse = await adminLogin(
      cookieJar,
      (code) => {
        qrcodeTerminal.generate(code, { small: true });
        console.log('Please scan this QR code to continue.');
      }
    );

    cookies = cookieJar;
    const url = new URL(adminResponse.url);

    // Log into attendance admin.
    await crossAppLogin(url.host, 'cli_9dc2bfd708759106', 'https://www.larksuite.com/attendance/manage/callback?next=https%3a%2f%2fwww.larksuite.com%2fattendance%2fmanage%2fgroup%2flist', cookieJar);

    // Log into approval admin.
    await crossAppLogin(url.host, 'cli_9c7cc8a9a9edd105', 'https://www.larksuite.com/approval/admin/callback?next=https%3a%2f%2fwww.larksuite.com%2fapproval%2fadmin', cookieJar);
    csrfToken = await getCsrfCookie('https://www.larksuite.com/approval/admin', 'lob_csrf_token');
  },
  attendance: {
    getUser: async (QueryString) => {
      const { body } = await got('https://www.larksuite.com/attendance/manage/SearchOapiUser', {
        method: 'POST',
        json: {
          Body: { QueryString },
          Head: {},
        },
        cookieJar: cookies,
        headers: {
          'x-csrftoken': csrfToken,
        },
        responseType: 'json',
      });

      return body;
    },
    getColumns: async (TaskType = 'daily') => {
      const { body: { data } } = await got('https://www.larksuite.com/attendance/manage/GetStatisticsColumns', {
        method: 'POST',
        json: {
          Body: { TaskType },
          Head: {},
        },
        cookieJar: cookies,
        headers: {
          'x-csrftoken': csrfToken,
        },
        responseType: 'json',
      });

      return data;
    },
    getStatistics: async (query) => {
      const { body } = await got('https://www.larksuite.com/attendance/manage/GetStatisticsList', {
        method: 'POST',
        json: query,
        cookieJar: cookies,
        headers: {
          'x-csrftoken': csrfToken,
        },
        responseType: 'json',
      });

      return body.data;
    },
  },
  leaves: {
    getOvertimeRules: async () => {
      const { body } = await got('https://www.larksuite.com/approval/admin/api/workManagement/rule/list', {
        method: 'POST',
        json: {},
        cookieJar: cookies,
        headers: {
          'x-csrftoken': csrfToken,
        },
        responseType: 'json',
      });

      return body.data;
    },
    getOvertimeRule: async (id) => {
      const { body } = await got('https://www.larksuite.com/approval/admin/api/workManagement/rule/detail', {
        method: 'POST',
        json: {
          id,
        },
        cookieJar: cookies,
        headers: {
          'x-csrftoken': csrfToken,
        },
        responseType: 'json',
      });

      return body.data;
    },
    getBalanceLog: async (defId, userId) => {
      const { body } = await got('https://www.larksuite.com/approval/admin/api/GetBalanceLogForUser', {
        method: 'POST',
        json: {
          defId,
          userId,
        },
        cookieJar: cookies,
        responseType: 'json',
      });

      return body.data;
    },
    updateBalance: async (defId, userId, deltaQuota, reason = '') => {
      const csrf = await getCsrfCookie();

      const { body } = await got('https://www.larksuite.com/approval/admin/api/leave/balance/update', {
        method: 'POST',
        json: {
          balanceDefinitionId: defId,
          deltaQuota,
          userId,
          reason,
        },
        headers: {
          'x-csrftoken': csrf,
        },
        cookieJar: cookies,
        responseType: 'json',
      });

      return body.data;
    },
  },
};
