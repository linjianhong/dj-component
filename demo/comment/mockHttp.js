
!(function (angular, window, undefined) {

  var theConfigModule = angular.module('my-app');
  var thePics = [
    'https://pgytc.oss-cn-beijing.aliyuncs.com/220106/23/01.jpg',
    'https://pgytc.oss-cn-beijing.aliyuncs.com/220106/23/02.jpg',
    'https://pgytc.oss-cn-beijing.aliyuncs.com/220106/23/03.jpg',
  ];

  theConfigModule.run(['$http', '$q', 'sign', function ($http, $q, sign) {


    sign.registerHttpHook({
      match: /^comment\/li$/,
      hookRequest: function (config, mockResponse, match) {
        var param = config.data;
        return mockResponse.OK({
          list: [
            {
              id: 1,
              type: "publish",
              uid: 1,
              attr: {
                content: "AAAA",
                pics: thePics,
              }
            },
            {
              id: 11,
              type: "feedback",
              cid: 1,
              uid: 2,
              attr: {
                content: "How so!"
              }
            },
          ]
        });
      }
    });

    sign.registerHttpHook({
      match: /^comment\/(praise|unpraise|remove|add|feedback)$/,
      hookRequest: function (config, mockResponse, match) {
        return mockResponse.OK({});
      }
    });

    sign.registerHttpHook({
      match: /^用户\/个人信息$/,
      hookRequest: function (config, mockResponse, match) {
        var param = config.data;
        return mockResponse.OK({
          uid: 1,
          wx: { nickname: 'Jackie', headimgurl: thePics[0] }
        });
      }
    });

    sign.registerHttpHook({
      match: /^用户\/微信数据$/,
      hookRequest: function (config, mockResponse, match) {
        var param = config.data;
        return mockResponse.OK({
          list: [
            { uid: 1, nickname: 'Jackie', headimgurl: thePics[0] },
            { uid: 2, nickname: 'Pujoin', headimgurl: thePics[1] },
            { uid: 3, nickname: 'Trumps', headimgurl: thePics[2] },
          ]
        });
      }
    });

    sign.registerHttpHook({
      match: /^翻译资源$/,
      hookRequest: function (config, mockResponse, match) {
        var param = config.data;
        var urls = param.urls;
        return mockResponse.OK({ urls });
      }
    });

  }]);


})(angular, window);
