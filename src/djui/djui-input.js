
!(function (window, angular, undefined) {


  angular.module('dj-ui')
    .component('djuiInput', {
      bindings: {
        //ngModel: '=',
        param: '=',
        placeholder: '@',
        icon: '@',
        focus: '@',
        //ngChange: '&',


        initValue: '<',
        onChange: '&'
      },
      template: `
        <div class="flex">
          <i class="fa fa-{{$ctrl.icon || $ctrl.param.icon}}" ng-if="$ctrl.icon || $ctrl.param.icon"></i>
          <input class="flex-1"
            dj-focus="{{djFocus}}"
            placeholder="{{$ctrl.placeholder}}"
            ng-model="ngModel"
            ng-change="onChange(ngModel)"
          >
          <i class="fa fa-qrcode" ng-if="$ctrl.param.scan" ng-click="scanText()"></i>
          <i class="fa fa-check-square-o" ng-if="$ctrl.param.submit" ng-click="submitText()"></i>
          <i class="fa fa-times-circle" ng-if="$ctrl.param.clear" ng-click="clearContent()"></i>
        </div>
        `,
      controller: ['$scope', '$http', '$timeout', "$q", ctrl]
    });

  function ctrl($scope, $http, $timeout, $q) {
    this.$onChanges = (changes) => {
      if (changes.focus) {
        if (changes.focus.currentValue) {
          setFocus();
        }
      }
      if (changes.initValue) {
        $scope.ngModel = changes.initValue.currentValue;
      }
    }

    function setFocus() {
      $scope.djFocus = 1;
      $timeout(() => {
        $scope.djFocus = '';
      }, 300)
    };

    $scope.onChange = (value) => {
      this.onChange({ value, initValue: value })
    }


    $scope.clearContent = () => {
      $scope.ngModel = '';
      setFocus();
      this.onChange({ value: $scope.ngModel })
    }
    $scope.submitText = () => {
      var param = this.param || {};
      angular.isFunction(param.submit) && param.submit($scope.ngModel);
    }
    $scope.scanText = () => {
      var scan = this.param.scan;
      var beforeScan = scan.beforeScan && scan.beforeScan($scope.ngModel);
      // beforeScan 返回 === false 或 $q.reject 则禁止扫描
      if (beforeScan === false) return;
      $q.when(beforeScan).then(result => {
        callScan()
      }).catch(e => {
        console.log("扫描前处理, 拒绝=", e)
      })
    }
    var callScan = () => {
      var param = this.param || {};
      var scan = param.scan || {};
      $http.post("扫描二维码").then(text => {
        // 先通知值变化
        $scope.ngModel = text;
        this.onChange({ value: $scope.ngModel })
        // 再看要不要再扫描
        var reScan = scan.onText && scan.onText(text);
        if (!reScan) return;
        $q.when(reScan).then(result => {
          // 再看要不要再扫描
          if (result && result.reScan) {
            $timeout(callScan, result && result.delay || scan.delay || 600);
          }
        })
      });
    }
  }
})(window, angular);