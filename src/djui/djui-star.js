
!(function (window, angular, undefined) {


  angular.module('dj-ui')
    .component('djuiStar', {
      bindings: {
        mode: '@',
        max: '<',
        initValue: '<',
        onChange: '&'
      },
      template: `
        <div class="flex flex-left flex-v-center" ng-mouseleave="leave()">
          <span class="star flex-cc" nth="{{i}}"
            ng-repeat="i in stars"
            ng-mouseover="overstar(i)"
            ng-mouseup="click(i)"
          >{{i>0 && ((valueOver<0 && i<=value || i<=valueOver) && '★' || '☆') || ''}}</span>
        </div>
        `,
      controller: ["$scope", "$element", ctrl]
    });

  function ctrl($scope, $element) {
    this.$onChanges = (changes) => {
      if (changes.mode) {
        //console.log("星星， mode=", changes.mode.currentValue);
        $scope.mode = changes.mode.currentValue || "";
      }
      if (changes.max) {
        var max = +changes.max.currentValue
        if (!max || max < 0) max = 5;
        if (max > 20) max = 20;
        $scope.max = max;
        $scope.stars = Array.from({ length: max + 1 }, (v, k) => k);
      }
      if (changes.initValue) {
        var value = +changes.initValue.currentValue || 0;
        $scope.value = value;
      }
    }

    $scope.valueOver = -1;
    $scope.leave = () => {
      if ($scope.mode == "show") return;
      $scope.valueOver = -1;
    }
    $scope.overstar = (value) => {
      if ($scope.mode == "show") return;
      $scope.valueOver = value;
    }

    $scope.click = (value) => {
      if ($scope.mode == "show") return;
      //console.log("星星", value)
      $scope.value = value;
      this.onChange({ value })
    }
  }
})(window, angular);