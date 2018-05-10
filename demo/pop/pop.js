
var theModule = angular.module('my-app', ['dj-form', 'dj-ui', 'dj-pop']);

theModule.config(['$locationProvider', function ($locationProvider) {
  // Configure existing providers
  $locationProvider.hashPrefix('');
}]);
theModule.component('myApp', {
  template: `
    <div class="btns flex flex-left flex-wrap" >
      <div class="djui-btn primary" ng-click="alert()">Alert</div>
      <div class="djui-btn primary" ng-click="alert2()">Alert with params</div>
      <div class="djui-btn danger" ng-click="input()">Input</div>
      <div class="djui-btn warning" ng-click="confirm()">Confirm</div>
      <div class="djui-btn info" ng-click="confirm2()">Confirm with params</div>
      <div class="djui-btn default" ng-click="toast()">toast</div>
      <div class="djui-btn comment" ng-click="gallery()">gallery</div>
      <div class="djui-btn disabled" ng-click="comment()">comment</div>
    </div>
  `,
  controller: ['$scope', '$q', '$location', 'DjPop', function ($scope, $q, $location, DjPop) {
    console.log("开始 demo");
    setTimeout(()=>{
      $location.path("/aa")
      //if(!location.hash)location.hash = "#1";
      $scope.$apply();
    });
    $scope.alert = function () {
      DjPop.alert('正文', '标题').then(function (res) {
        console.log("已确认: ", res);
      }).catch(function (res) {
        console.log("错误: ", res);
      })
    };
    $scope.alert2 = function () {
      DjPop.alert({
        param: {
          title: 'My title',
          body: 'Something you need know.',
          backClose: 0, // 点击背景是否关闭对话框
          cancel: {
            hide: 1
          },
          OK: {
            text: "I know"
          },
          beforeClose: function (name) {
            "Return false if you forbid dialog tobe closed.";
            "Return $q.reject if you forbid dialog tobe closed.";
            "Otherwise, the dialog will close.";
          }
        }
      }).then(function (res) {
        console.log("已确认: ", res);
      }).catch(function (res) {
        console.log("错误: ", res);
      })
    };
    $scope.confirm = function () {
      DjPop.confirm('Are you sure?', '标题-确认').then(function (res) {
        console.log("已确认: ", res);
      }).catch(function (res) {
        console.log("已取消或错误: ", res);
      })
    };
    $scope.input = function () {
      DjPop.input('Input some text').then(function (res) {
        console.log("已确认: ", res);
      }).catch(function (res) {
        console.log("已取消或错误: ", res);
      })
    };
    $scope.confirm2 = function () {
      DjPop.confirm({
        param: {
          body: '正文',
          title: 'Yes or no?',
          backClose: 1, // 点击背景是否关闭对话框
          beforeClose: function (name) {
            "Return false if you forbid dialog tobe closed.";
            "Return $q.reject if you forbid dialog tobe closed.";
            "Otherwise, the dialog will close.";
            if (name == 'cancel') {
              return $q.reject("不要关闭");
            }
          }
        }
      }).then(function (res) {
        console.log("已确认: ", res);
      }).catch(function (res) {
        console.log("错误: ", res);
      })
    };
    $scope.toast = function () {
      DjPop.toast('提示内容', 2000).then(function (res) {
        console.log("提示完成: ", res);
      }).catch(function (res) {
        console.log("错误: ", res);
      })
    };
    $scope.gallery = function () {
      DjPop.gallery({
        imgs: [
          'https://pgytc.oss-cn-beijing.aliyuncs.com/220106/23/01.jpg',
          'https://pgytc.oss-cn-beijing.aliyuncs.com/220106/23/02.jpg',
          'https://pgytc.oss-cn-beijing.aliyuncs.com/220106/23/03.jpg',
        ],
        btns: [{
          css: "fa fa-trash-o text-visited", text: "×", fn: function (n) {
            console.log(`call fn(${n})`);
          }
        }]
      });
    };
    $scope.comment = function () {
      DjPop.comment('标题', '正文');
    };
  }]
})

