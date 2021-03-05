const { default: axios } = require('axios');
const user = require(require('path').join(process.cwd(), './.lark/user.json'));
const FormData = require('form-data');
const Zip = require('node-zip');
const fs = require('fs');

module.exports = {
  execute: async (appId, appUrl) => {
    const zip = new Zip();
    const assets = require('../assets')(
      appId,
      appUrl,
      '/loading',
      '/',
    );

    Object.keys(assets).forEach((asset) => {
      zip.file(asset, assets[asset].trim());
    });

    const data = zip.generate({ base64: false, compression: 'DEFLATE' });
    fs.writeFileSync('dist.zip', data, 'binary');

    const uploadUrl = `https://open.larksuite.com/miniprogram/api/v3/app/${appId}/testing`;

    const formData = new FormData();
    formData.append('intro', 'Lark web container.');
    formData.append('version', '1.0.0');
    formData.append('source', fs.createReadStream('dist.zip'));

    const {
      data: {
        error,
        message,
      },
    } = await axios.put(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        Cookie: user.cookie,
      },
    });

    if (error) {
      console.log(message);
    } else {
      let status = 1;

      while (status === 1) {
        const { data: { status: newStatus, message } } = await axios.get(`https://open.larksuite.com/miniprogram/api/v3/app/${appId}/compile_progress`, {
          headers: {
            Cookie: user.cookie,
          },
        });

        console.log(message);
        status = newStatus;
      }
    }
  },
};
