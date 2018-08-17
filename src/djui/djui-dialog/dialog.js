/**
 * 对话框组件
 * ver: 0.0.1
 * build: 2018-01-25
 * power by LJH.
 */
!(function (window, angular, undefined) {

  var theModule = angular.module('dj-ui');

  theModule.component('djuiDialog', {
    bindings: {
      param: '<',
    },
    scope_______: {
      dialogShow: '=',
      backClose: '@',
      dlgBody: '@',
      dlgTitle: '@',
      hideCancel: '@',
      hideOk: '@',
      onClose: '&',
      onClickBack: '&'
    },
    transclude: {
      'title': '?djuiDialogTitle',
      'body': '?djuiDialogBody',
      'footer': '?djuiDialogFooter'
    },
    template: `
      <div class="djui-dialog flex-cc">
        <div class="back" ng-click="clickBack()"></div>
        <div class="box">
          <div class="title" ng-transclude="title" ng-if="!param.hideHeader">
            <div class="text">
              {{param.title}}
            </div>
          </div>
          <div class="body" ng-transclude="body">
            <div class="content">{{param.body}}</div>
          </div>
          <div class="footer" ng-transclude="footer" ng-if="!param.hideFooter">
            <div class="thin-btns flex flex-arround">
              <div class="thin-btn {{param.cancel.css||'default'}}" ng-if="!param.cancel.hide" ng-click="cancel()">{{param.cancel.text||'取消'}}</div>
              <div class="thin-btn {{param.OK.css||'primary'}}" ng-if="!param.OK.hide" ng-click="OK()">{{param.OK.text||'确定'}}</div>
            </div>
          </div>
        </div>
      </div>
    `,
    controller: ["$scope", "$element", "$q", "$animateCss", function ($scope, $element, $q, $animateCss) {
      $scope.param = {};
      this.$onChanges = (changes) => {
        if (changes.param) {
          $scope.param = changes.param.currentValue || {};
          // console.log("对话框, param = ", changes.param.currentValue);
        }
        animate(1);
      }

      var execClose = (name) => {
        if ($scope.param.beforeClose) {
          var result = $scope.param.beforeClose(name);
          if (result === false) return;
          $q.when(result).then(r => {
            animate(0);
            $scope.$emit("dj-pop-box-close", name);
          }).catch(function (e) {
          });
        }
        else {
          animate(0);
          $scope.$emit("dj-pop-box-close", name)
        }
      }

      $scope.clickBack = () => {
        //this.onClickBack();
        if ($scope.param.backClose) {
          execClose("cancel");
        }
      };
      $scope.OK = function () {
        execClose("OK");
      };
      $scope.cancel = function () {
        execClose("cancel");
      };


      /** 动画支持 */
      function animate(b) {
        b = b && 1 || 0;
        if (animate.running) return $q.when(animate.running);
        //$element.css("opacity", 0)
        var animator = $animateCss($element, {
          from: { opacity: b - 1 },
          to: { opacity: b },
          easing: 'ease',
          duration: 0.5 // 秒
        });
        return animate.running = animator.start().then(() => {
          $element.css("opacity", b);
          animate.running = 1;
        }).catch(e => {
          //console.log("动画失败, e = ", e);
        });
      }

    }]
  });
})(window, angular);