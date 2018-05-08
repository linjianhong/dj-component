/**
 * 动态表单组件
 * ver: 0.1.0
 * build: 2018-04-26
 * power by LJH.
 * 
 * 子组件插座
 */
!(function (window, angular, undefined) {

  angular.module('dj-form').component('djFormItemHost', {
    bindings: {
      mode: '<', // edit(默认)/show
      configs: '<',
      initValue: '<',
      onValueChange: '&',
      onStatusChange: '&'
    },
    controller: ['$scope', '$element', '$timeout', '$q', '$compile', 'DjFormDefaultDefine',
      function ($scope, $element, $timeout, $q, $compile, DjFormDefaultDefine) {
        var theMode = false;
        var theChanges = {};

        this.$onChanges = (changes) => {
          /** 首先，保存所有的参数传递 */
          ['configs', 'initValue', 'onValueChange', 'onStatusChange'].map(name => {
            if (changes[name]) {
              theChanges[name] = changes[name];
            }
          });

          /** 如果有 mode 改变，就初始化或重新初始化插座 */
          if (changes.mode) {
            var mode = changes.mode.currentValue;
            //console.log("HOST mode =", mode);
            if (mode != 'show') mode = 'edit';
            if (mode != theMode) {
              theMode = mode;
              var fn = mode == "show" && ctrlHostShow || ctrlHostEdit;
              fn.call(this, $scope, $element, $timeout, $q, $compile, DjFormDefaultDefine);
            }
          }

          /** 如果有 mode 数据，就响应参数传递 */
          if (theMode) {
            this.onChangesCtrl(theChanges);
            theChanges = {};
          }
        }
      }
    ]
  });




  /**
   * 可编辑插座
   */
  function ctrlHostEdit($scope, $element, $timeout, $q, $compile, DjFormDefaultDefine) {

    /** 编译生成动态子表单项 */
    function compileConfigs(configs) {
      if (!configs) {
        $element.html("");
        return;
      }
      var eleType = configs.type || 'input';
      var eleName = configs.pre + eleType;
      var css = configs.css.hostEdit || configs.css.host || '';
      var template = `
        <${eleName}
          class="${css} {{dirty&&'ng-dirty'||''}} {{!theValid.valid&&'ng-invalid'||''}}"
          configs="$ctrl.configs"
          init-value="initValue"
          on-change="onChange(value)"
          invalid-text="theValid.tip"
          dj-require="theValid.require"
          dj-valid="theValid.valid"
          dj-dirty="theValid.dirty"
        ></${eleName}>
      `;
      $element.html(template);
      var childElement = $compile($element.contents())($scope);
      var childScope = $scope.$$childHead;
      var childTemplate = configs.template || DjFormDefaultDefine.getTemplateEdit(eleType);
      childElement.html(childTemplate);
      $compile(childElement.contents())(childScope);
    };

    /** 数据校验 */
    var theValid = $scope.theValid = {
      valid: true,
      require: false,
      tip: "", //错误提示

      configs: false,
      configReady: false,
      value: "", // 总是
      valueReady: false,
      setConfig: (configs) => {
        // console.log("数据校验, configs = ", configs);
        if (!configs) return;
        theValid.configs = configs;
        theValid.configReady = true;
        theValid.calc();
      },
      /** 复制数据到本对象，同时复制到$scope.initValue */
      setValue: (value) => {
        if (theValid.valueReady && angular.equals(theValid.value, value)) return false;
        theValid.valueReady = true;
        if (angular.isArray(value)) {
          theValid.value = angular.merge([], value);
          $scope.initValue = angular.merge([], value);
        }
        else if (angular.isObject(value)) {
          theValid.value = angular.merge({}, value);
          $scope.initValue = angular.merge({}, value);
        }
        else {
          theValid.value = value;
          $scope.initValue = value;
        }
        theValid.calc();
        return true;
      },
      /** 计算，验证数据是否有效，同时，设置提示文本 */
      calc: () => {
        if (!theValid.configReady || !theValid.valueReady) return;
        var valid = theValid.configs.param && theValid.configs.param.valid
          || theValid.configs.valid || {};

        var invalid = angular.extend({ required: "不可为空" }, theValid.configs.invalid);

        if (valid.minLength) valid.minlength = valid.minlength || valid.minLength; // 允许名字兼容
        if (valid.maxLength) valid.maxlength = valid.maxlength || valid.maxLength; // 允许名字兼容

        /** 先假定数据有效，然后再验证 */
        theValid.valid = true;
        theValid.tip = "";
        theValid.require = valid.require;
        /** 开始验证 */
        if (valid.require) {
          if (!theValid.value && theValid.value !== 0) {
            theValid.valid = false;
            theValid.tip = invalid.required || valid.errorTip || "";
            return;
          }
        }
        // 不要求输入，且值为空，就不检查了
        else {
          if (!theValid.value && theValid.value !== 0) {
            return;
          }
        }
        if (valid.pattern) {
          if (!(valid.pattern instanceof RegExp)) {
            valid.pattern = new RegExp(valid.pattern);
          }
          if (!valid.pattern.test(theValid.value)) {
            theValid.valid = false;
            theValid.tip = invalid.pattern || valid.errorTip || "";
            return;
          }
        }
        if (valid.max) {
          var not_number = typeof (theValid.value) == "object" || Number.isNaN(Number(theValid.value));
          var error = not_number || +theValid.value > valid.max;
          if (error) {
            theValid.valid = false;
            theValid.tip = (not_number ? invalid.number : invalid.max) || valid.errorTip || "";
            return;
          }
        }
        if (valid.min) {
          var not_number = typeof (theValid.value) == "object" || Number.isNaN(Number(theValid.value));
          var error = not_number || +theValid.value < valid.min;
          if (error) {
            theValid.valid = false;
            theValid.tip = (not_number ? invalid.number : invalid.min) || valid.errorTip || "";
            return;
          }
        }
        if (valid.maxlength) {
          var v = theValid.value || '';
          var error = !v.hasOwnProperty('length') || v.length > valid.maxlength;
          if (error) {
            theValid.valid = false;
            theValid.tip = invalid.maxlength || valid.errorTip || "";
            return;
          }
        }
        if (valid.minlength) {
          var v = theValid.value || '';
          var error = !v.hasOwnProperty('length') || v.length < valid.minlength;
          if (error) {
            theValid.valid = false;
            theValid.tip = invalid.minlength || valid.errorTip || "";
            return;
          }
        }
      },
    };

    /** 响应参数传递 */
    this.onChangesCtrl = (changes) => {
      if (changes.initValue) {
        theValid.setValue(changes.initValue.currentValue);
        $scope.valid = '----';
        syncStatus(false).then(emitStatus);
      }
      if (changes.configs) {
        compileConfigs(changes.configs.currentValue);
        theValid.setConfig(changes.configs.currentValue);
        $scope.valid = '----';
        syncStatus(false).then(emitStatus);
      }
    }


    /** 状态，及其初始化 */
    $scope.valid = true;
    $scope.dirty = false;
    function syncStatus(dirty) {
      var valid = theValid.valid;
      if (valid === $scope.valid && dirty === $scope.dirty) {
        return $q.reject('状态未改变');
      }
      $scope.valid = valid;
      $scope.dirty = dirty;
      //console.log('状态改变 valid=', valid, ', dirty=', dirty)
      return $q.when({ valid, dirty });
    }
    var emitStatus = (status) => {
      this.onStatusChange && this.onStatusChange({
        item: this.configs,
        valid: status.valid,
        dirty: status.dirty,
      });
    }

    /** 下级值改变事件 */
    $scope.onChange = (value) => {
      if (!theValid.setValue(value)) {
        //console.log('下级值事件，值未变 插座', value);
        return;
      }
      //console.log('收到值改变 插座', value);
      syncStatus(true)
        .then(emitStatus)
        .finally(() => {
          this.onValueChange({
            item: this.configs,
            value: value,
            valid: $scope.valid,
            dirty: $scope.dirty
          });
        });
    }
  }

  /**
   * 只读插座
   */
  function ctrlHostShow($scope, $element, $timeout, $q, $compile, DjFormDefaultDefine) {

    this.onChangesCtrl = (changes) => {
      if (changes.configs) $scope.configs = changes.configs.currentValue;
      if (changes.initValue) $scope.value = changes.initValue.currentValue;
      compileConfigs($scope.configs, $scope.value);
    }

    /** 编译生成动态子表单项 */
    function compileConfigs(configs, value) {
      //console.log("HOST 编译 ", configs, value);
      if (!configs) {
        $element.html("");
        return;
      }
      /** 一些自动隐藏 */
      if (configs.show) {
        if (configs.show.autohide == 'empty' && value !== 0 && !value) {
          $element.html("");
          return;
        }
        if (configs.show.autohide == 'zero length' && !(value && value.length)) {
          $element.html("");
          return;
        }
      }

      /** 开始编译子组件 */
      var eleType = configs.type || 'input';
      var eleName = configs.pre + eleType;
      var css = configs.css.hostShow || configs.css.host || '';
      var template = `
        <${eleName}-show
          class="${css}"
          configs="$ctrl.configs"
          init-value="$ctrl.initValue"
        ></${eleName}-show>
      `;
      $element.html(template);
      var childElement = $compile($element.contents())($scope);
      var childScope = $scope.$$childHead;
      var childTemplate = configs.template || DjFormDefaultDefine.getTemplateShow(eleType);
      childElement.html(childTemplate);
      $compile(childElement.contents())(childScope);
    };



  }

})(window, angular);