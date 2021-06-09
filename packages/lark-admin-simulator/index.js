const tough = require('tough-cookie');
const { default: got } = require('got');

const adminLogin = async (
  cookieJar,
  onQrCode = (code) => { },
) => {
  cookieJar = cookieJar || new tough.CookieJar();

  let adminResponse = await got('https://www.larksuite.com/admin/index', {
    cookieJar,
  });

  if (adminResponse.url.indexOf('https://www.larksuite.com/suite/passport/page/login') === 0) {
    console.log('Redirected to login. Getting QR...');

    const qrResponse = await got.post('https://www.larksuite.com/suite/passport/v3/qrlogin/init', {
      cookieJar,
      json: {
        app_id: 13,
        query_scope: 'local',
        redirect_uri: 'https://www.larksuite.com/admin/index',
      },
      headers: {
        'x-terminal-type': 2,
      },
      responseType: 'json',
    });
    const passportToken = qrResponse.headers['x-passport-token'];
    
    if (!qrResponse.body.data || !qrResponse.body.data.qr_code) {
      throw new Error(qrResponse.body.message);
    }

    onQrCode(JSON.stringify({
      qrlogin: {
        token: qrResponse.body.data.qr_code,
      }
    }));

    let user = null;

    while (true) {
      const qrScanResponse = await got.post('https://www.larksuite.com/suite/passport/v3/qrlogin/polling', {
        cookieJar,
        json: {
          app_id: 13,
          query_scope: 'local',
          redirect_uri: 'https://www.larksuite.com/admin/index',
        },
        headers: {
          'x-passport-token': passportToken,
          'x-terminal-type': 2,
        },
        responseType: 'json',
      });

      if (qrScanResponse.body.data.state === 0) {
        console.log('QR code scanned!');
        user = qrScanResponse.body.data.user;
        break;
      }
    }

    if (!user) {
      throw new Error('No user.');
    }

    const appLoginResponse = await got.post('https://www.larksuite.com/suite/passport/v3/app', {
      cookieJar,
      json: {
        user_id: user.user_id,
        apply_device_login_id: true,
      },
      headers: {
        'x-passport-token': passportToken,
        'x-terminal-type': 2,
      },
      responseType: 'json',
    });

    const urls = appLoginResponse.body.data.cross_login_uris;

    for (let i = 0; i < urls.length; i++) {
      await got.get(urls[i], {
        cookieJar,
        responseType: 'json',
      });
    }
  }

  adminResponse = await got('https://www.larksuite.com/admin/index', {
    cookieJar,
  });

  return adminResponse;
};

module.exports = {
  adminLogin,
};
