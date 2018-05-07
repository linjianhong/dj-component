/**
 * 对话框组件
 * ver: 0.0.1
 * build: 2018-01-25
 * power by LJH.
 */
!(function (window, angular, undefined) {
  'use strict';

  angular.module('dj-pop').directive('djDialog', function () {
    return {
      restrict: 'AE',
      transclude: {
        'title': '?djDialogTitle',
        'body': '?djDialogBody',
        'footer': '?djDialogFooter'
      },
      template: `
        <div ng-if="dialogShow">
          <div class="weui-mask" ng-click="clickBack()"></div>
          <div class="weui-dialog">
            <div class="weui-dialog__hd">
              <strong class="weui-dialog__title" ng-transclude="title">
                {{dlgTitle}}
              </strong>
            </div>
            <div class="weui-dialog__bd" ng-transclude="body">
              <div html-content="dlgBody"></div>
            </div>
            <div ng-transclude="footer">
              <div class="weui-dialog__ft">
                <span class="weui-dialog__btn weui-dialog__btn_default" ng-if="!hideCancel" ng-click="cancel()">取消</span>
                <span class="weui-dialog__btn weui-dialog__btn_primary" ng-if="!hideOk" ng-click="OK()">确定</span>
              </div>
            </div>
          </div>
        </div>
      `,
      scope: {
        dialogShow: '=',
        backClose: '@',
        dlgBody: '@',
        dlgTitle: '@',
        hideCancel: '@',
        hideOk: '@',
        onClose: '&',
        onClickBack: '&'
      },
      controller: ['$scope', '$element', '$rootScope', '$q', ctrl]
    };
  });


  function ctrl($scope, $element, $rootScope, $q) {
    $scope.clickBack = function () {
      $scope.onClickBack();
      if ($scope.backClose) {
        $scope.cancel();
      }
    };
    $scope.OK = function () {
      if ($scope.onClose) {
        $q.when($scope.onClose({ $name: 'OK' })).then(r => {
          $scope.dialogShow = r !== undefined && !r;
        });
      }
      else {
        $scope.dialogShow = false;
      }
    };
    $scope.cancel = function () {
      if ($scope.onClose) {
        $q.when($scope.onClose({ $name: 'cancel' })).then(r => {
          $scope.dialogShow = r !== undefined && !r;
        });
      }
      else {
        $scope.dialogShow = false;
      }
    };
    $scope.$on('$locationChangeStart', function (event) {
      //显示时按浏览器的后退按钮：关闭对话框
      if ($scope.dialogShow) {
        $scope.cancel();
        event.preventDefault();
      }
    });
  }
})(window, angular);