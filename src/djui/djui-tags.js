
!(function (window, angular, undefined) {


  angular.module('dj-ui').component('djuiTags', {
    bindings: {
      param: '<',
      list: '<',
      initValue: '<',
      onChange: '&',
      editable: '@'
    },
    template: `
        <div class="flex flex-left flex-wrap">
          <div class="tag flex-cc {{selected[item.value||item]&&'active'||''}}"
            ng-repeat="item in list"
            ng-click="clickItem(item)"
          >{{item.title||item}}</div>
        </div>
        `,
    controller: ["$scope", "$element", function ctrl($scope, $element) {
      this.$onChanges = (changes) => {
        if (changes.list) {
          $scope.list = changes.list.currentValue || [];
          calcSelected();
        }
        if (changes.initValue) {
          var value = changes.initValue.currentValue;
          if (!angular.isArray(value)) value = [];
          $scope.value = value;
          calcSelected();
        }
        if (changes.editable) {
          // console.log("标签，可编辑 =", changes.editable.currentValue)
        }
      }

      /** 计算是否选中 */
      function calcSelected() {
        if (!$scope.list || !$scope.value) return;
        $scope.selected = {}
        $scope.value.map(v => {
          $scope.selected[v] = 1;
        });
      }

      $scope.clickItem = (item) => {
        var item_value = item.value || item;
        var b = $scope.selected[item_value] = !$scope.selected[item_value];
        if (b) {
          $scope.value.push(item_value);
        } else {
          $scope.value = $scope.value.filter(v => v != item_value);
        }
        var value = [];
        $scope.list.map(item => {
          if ($scope.value.indexOf(item) >= 0) value.push(item);
        });
        this.onChange({ value });
      }
    }]
  });


  angular.module('dj-ui').component('djuiTagsShow', {
    bindings: {
      list: '<',
    },
    template: `
        <div class="flex flex-left flex-wrap">
          <div class="tag flex-cc" ng-repeat="item in list">{{item.title||item}}</div>
        </div>
        `,
    controller: ["$scope", "$element", function ctrl($scope, $element) {
      this.$onChanges = (changes) => {
        if (changes.list) {
          var list = changes.list.currentValue;
          if (!angular.isArray(list)) list = [];
          $scope.list = list;
        }
      }
    }]
  });



})(window, angular);