const { default: axios } = require('axios');
const fs = require('fs');
const constants = require('./constants');

module.exports = {
  execute: async () => {
    console.log('Initializing Lark login...');
    const { data: tokenData } = await axios.get(constants.loginTokenUrl);

    if (tokenData.error) {
      console.log(`Error ${tokenData.error} encountered. ${tokenData.message}`);
      return;
    }

    const { token: loginToken } = tokenData.data;
    const loginRedirectUrl = `${constants.loginRedirectUrl}?token=${loginToken}`;
    const loginPageUrl = `${constants.loginPageUrl}&redirect_uri=${encodeURIComponent(loginRedirectUrl)}&lang=en`;

    console.log(`Please open this link:\n\n${loginPageUrl}\n\nin your browser to login.`);
    console.log('Waiting for login confirmation...');
    let successfulLoginData = { };

    for (let i = 0; i < 60; i++) {
      // Check if the login was successful.
      const { data: loginData, headers } = await axios.get(`${constants.loginCheckUrl}?token=${loginToken}`);
      
      if (loginData.error === 4) {
        // Don't do anything.
      } else if (loginData.error === 0) {
        let cookie = headers['set-cookie'];

        cookie.forEach((c) => {
          if (c.indexOf('miniprogram-session') === 0) {
            cookie = c.split(';')[0];
          }
        })

        // Found it!
        successfulLoginData = {
          cookie,
          user: loginData.data,
        };
        break;
      } else {
        // Error!
        console.log(`Error ${loginData.error} encountered. ${loginData.message}`);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!successfulLoginData) {
      console.log(`Login timed out.`);
      return;
    }

    if (!fs.existsSync('.lark')) {
      fs.mkdirSync('.lark');
    }

    fs.writeFileSync('.lark/user.json', JSON.stringify(successfulLoginData));
    console.log('Login data written to ./.lark/user.json!');
  },
};
