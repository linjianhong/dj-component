

!(function (window, angular, undefined) {


  var theModule = angular.module('dj-ui');
  theModule.component('djuiDate', {
    bindings: {
      initValue: '<',
      onChange: '&',
      format: '<',
      param: '<',
      placeholder: '@',
    },
    template: `
      <div class="flex djui-input-box">
        <input class="flex-1" type="date"
          placeholder="{{$ctrl.placeholder}}"
          ng-model="ngModel"
          ng-change="onChange(ngModel)"
        >
      </div>`,
    controller: ['$scope', function ($scope) {
      this.$onChanges = (changes) => {
        if (changes.initValue) {
          var str = changes.initValue.currentValue || "";
          $scope.ngModel = new Date(Date.parse(str.replace(/-/g, "/")));
        }
      }
      $scope.onChange = (value) => {
        var format = this.format || this.param && this.param.format || 'yyyy-MM-dd';
        if (value === undefined) return;
        this.onChange({ value: timeFormat(value, format) })
      }
    }]
  });
  theModule.component('djuiTime', {
    bindings: {
      initValue: '<',
      onChange: '&',
      format: '<',
      param: '<',
      placeholder: '@',
    },
    template: `
      <div class="flex djui-input-box">
        <input class="flex-1" type="time"
          placeholder="{{$ctrl.placeholder}}"
          ng-model="ngModel"
          ng-change="onChange(ngModel)"
        >
      </div>`,
    controller: ['$scope', '$http', '$timeout', "$q", function ($scope, $http, $timeout, $q) {
      this.$onChanges = (changes) => {
        if (changes.initValue) {
          var hh_mm = (changes.initValue.currentValue || "00:00").split(":");
          $scope.ngModel = new Date();
          $scope.ngModel.setHours(hh_mm[0]);
          $scope.ngModel.setMinutes(hh_mm[1]);
          $scope.ngModel.setSeconds(0);
          $scope.ngModel.setMilliseconds(0);
        }
      }
      $scope.onChange = (value) => {
        var format = this.format || this.param && this.param.format || 'HH:mm';
        if (value === undefined) return;
        this.onChange({ value: timeFormat(value, format) });
      }
    }]
  });
  theModule.component('djuiDatetime', {
    bindings: {
      initValue: '<',
      onChange: '&',
      format: '<',
      param: '<',
      placeholder: '@',
    },
    template: `
      <div class="flex djui-input-box">
        <input class="flex-1" type="datetime-local"
          placeholder="{{$ctrl.placeholder}}"
          ng-model="ngModel"
          ng-change="onChange(ngModel)"
        >
      </div>`,
    controller: ['$scope', '$http', '$timeout', "$q", function ($scope, $http, $timeout, $q) {
      this.$onChanges = (changes) => {
        if (changes.initValue) {
          var str = changes.initValue.currentValue || "";
          $scope.ngModel = new Date(Date.parse(str.replace(/-/g, "/")));
        }
      }
      $scope.onChange = (value) => {
        var format = this.format || this.param && this.param.format || 'yyyy-MM-dd HH:mm';
        if (value === undefined) return;
        this.onChange({ value: timeFormat(value, format) })
      }
    }]
  });



  angular.module('dj-ui')
    .filter('timespan', function () { //可以注入依赖
      return function (timespan, format) {
        var d = new Date();
        d.setTime(timespan * 1000);
        return timeFormat(d, format || "yyyy-MM-dd");
      }
    });

  /** * 对Date的扩展，将 Date 转化为指定格式的String * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
    可以用 1-2 个占位符 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) * eg: * (new
    Date()).pattern("yyyy-MM-dd hh:mm:ss.S")==> 2006-07-02 08:09:04.423
   * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
   * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
   * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
   * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
   */
  function timeFormat(t, fmt) {
    if (!(t instanceof Date)) return "";
    var o = {
      "M+": t.getMonth() + 1, //月份
      "d+": t.getDate(), //日
      "h+": t.getHours() % 12 == 0 ? 12 : t.getHours() % 12, //小时
      "H+": t.getHours(), //小时
      "m+": t.getMinutes(), //分
      "s+": t.getSeconds(), //秒
      "q+": Math.floor((t.getMonth() + 3) / 3), //季度
      "S": t.getMilliseconds() //毫秒
    };
    var week = {
      "0": "/u65e5",
      "1": "/u4e00",
      "2": "/u4e8c",
      "3": "/u4e09",
      "4": "/u56db",
      "5": "/u4e94",
      "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (t.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[t.getDay() + ""]);
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
  }

  Date.prototype.format = Date.prototype.timeFormat = function (format) {
    return timeFormat(this, format || "yyyy-MM-dd");
  }

})(window, angular);

