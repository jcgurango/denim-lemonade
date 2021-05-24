module.exports = (appId, appUrl, loadingUrl, entryUrl) => ({
  'app.js': `
App({
  onLaunch: function () {

  }
});
  `,
  'app.json': `
{
  "pages": ["pages/index/index"],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "Gadget",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#ffffff"
  },
  "debug": false
}
  `,
  'app.ttss': `
  
  `,
  'project.config.json': `
{
  "setting": {
    "urlCheck": true,
    "es6": true,
    "postcss": true,
    "minified": true,
    "newFeature": true
  },
  "appid": "${appId}",
  "projectname": "lemonade-lark"
}
  `,
  'pages/index/index.js': `
const app = getApp();
const baseUrl = ${JSON.stringify(appUrl)};

Page({
  data: {
    loginUrl: baseUrl + ${JSON.stringify(loadingUrl)},
  },
  onLoad: function () {
    var app = this;

    tt.login({
      success(res) {
        const { code } = res;

        app.setData({
          loginUrl: app.getEntryUrl(code),
        });
      }
    });
  },
  getEntryUrl: function (loginCode) {
    return baseUrl + '${entryUrl}?type=app&code=' + loginCode;
  }
});
  `,
  'pages/index/index.ttml': `
<web-view src="{{loginUrl}}"></web-view>
  `,
  'pages/index/index.ttss': `
.intro {
  margin: 30px;
  text-align: center;
}
  `
});
