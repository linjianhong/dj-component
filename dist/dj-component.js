'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//angular.module('dj-component', ['dj-form', 'dj-pop', 'dj-ui', 'ui.uploader']);


angular.module('dj-form', ['dj-ui']);

angular.module('dj-pop', ['dj-ui', 'ngAnimate']);

angular.module('dj-ui', ['ngAnimate']);

/**
 * 动态表单组件
 * ver: 0.1.0
 * build: 2018-04-26
 * power by LJH.
 * 
 * 子组件插座
 */
!function (window, angular, undefined) {

  angular.module('dj-form').component('djFormItemHost', {
    bindings: {
      mode: '<', // edit(默认)/show
      configs: '<',
      initValue: '<',
      onValueChange: '&',
      onStatusChange: '&'
    },
    controller: ['$scope', '$element', '$timeout', '$q', '$compile', 'DjFormDefaultDefine', function ($scope, $element, $timeout, $q, $compile, DjFormDefaultDefine) {
      var _this = this;

      var theMode = false;
      var theChanges = {};

      this.$onChanges = function (changes) {
        /** 首先，保存所有的参数传递 */
        ['configs', 'initValue', 'onValueChange', 'onStatusChange'].map(function (name) {
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
            fn.call(_this, $scope, $element, $timeout, $q, $compile, DjFormDefaultDefine);
          }
        }

        /** 如果有 mode 数据，就响应参数传递 */
        if (theMode) {
          _this.onChangesCtrl(theChanges);
          theChanges = {};
        }
      };
    }]
  });

  /**
   * 可编辑插座
   */
  function ctrlHostEdit($scope, $element, $timeout, $q, $compile, DjFormDefaultDefine) {
    var _this2 = this;

    /** 编译生成动态子表单项 */
    var compileConfigs = function compileConfigs(configs) {
      if (!configs) {
        $element.html("");
        return;
      }
      var componentName = configs.componentEdit || configs.component;
      var css = configs.css.hostEdit || configs.css.host || 'normal';
      if (componentName) {
        var template = '\n          <div class="' + css + ' {{theValid.dirty&&\'ng-dirty\'||\'\'}} {{!theValid.valid&&\'ng-invalid\'||\'\'}}">\n            <div class="a flex prompt-top" dj-form-default-tip></div>\n            <' + componentName + '\n              configs="$ctrl.configs"\n              init-value="initValue"\n              on-change="onChange(value)"\n            ></' + componentName + '>\n          </div>';
        $element.html(template);
        $compile($element.contents())($scope);
        return;
      }
      var eleType = DjFormDefaultDefine.getSafeType(configs.type);
      var eleName = configs.pre + eleType;
      var css = configs.css.hostEdit || configs.css.host || 'normal';
      var template = '\n        <' + eleName + '\n          class="' + css + ' {{theValid.dirty&&\'ng-dirty\'||\'\'}} {{!theValid.valid&&\'ng-invalid\'||\'\'}}"\n          configs="$ctrl.configs"\n          init-value="initValue"\n          on-change="onChange(value)"\n          the-valid="theValid"\n        ></' + eleName + '>\n      ';
      $element.html(template);
      var childElement = $compile($element.contents())($scope);
      var childScope = $scope.$$childHead;
      var childTemplate = configs.template || DjFormDefaultDefine.getTemplateEdit(eleType);
      childElement.html(childTemplate);
      $compile(childElement.contents())(childScope);
    };

    /** 数据校验 */
    var theValid = $scope.theValid = this.theValid = {
      valid: true,
      require: false,
      tip: "", //错误提示

      configs: false,
      configReady: false,
      value: "", // 总是
      valueReady: false,
      setConfig: function setConfig(configs) {
        // console.log("数据校验, configs = ", configs);
        theValid.configs = configs;
        if (!configs) return;
        if (!theValid.configs.param) theValid.configs.param = {};
        theValid.configReady = true;
        theValid.calc();
      },
      /** 复制数据到本对象，同时复制到$scope.initValue */
      setValue: function setValue(value) {
        if (theValid.valueReady && angular.equals(theValid.value, value)) return false;
        theValid.valueReady = true;
        if (angular.isArray(value)) {
          theValid.value = angular.merge([], value);
          $scope.initValue = angular.merge([], value);
        } else if (angular.isObject(value)) {
          theValid.value = angular.merge({}, value);
          $scope.initValue = angular.merge({}, value);
        } else {
          theValid.value = value;
          $scope.initValue = value;
        }
        theValid.calc();
        return true;
      },
      /** 计算，验证数据是否有效，同时，设置提示文本 */
      calc: function calc() {
        if (!theValid.configReady || !theValid.valueReady) return;
        var valid = theValid.configs.param.valid || theValid.configs.valid || {};
        var invalid = angular.extend({ required: "required" }, theValid.configs.invalid, theValid.configs.param.invalid);

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
          var not_number = _typeof(theValid.value) == "object" || Number.isNaN(Number(theValid.value));
          var error = not_number || +theValid.value > valid.max;
          if (error) {
            theValid.valid = false;
            theValid.tip = (not_number ? invalid.number : invalid.max) || valid.errorTip || "";
            return;
          }
        }
        if (valid.min) {
          var not_number = _typeof(theValid.value) == "object" || Number.isNaN(Number(theValid.value));
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
      }
    };

    /** 响应参数传递 */
    this.onChangesCtrl = function (changes) {
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
    };

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
      return $q.when({ valid: valid, dirty: dirty });
    }
    var emitStatus = function emitStatus(status) {
      _this2.onStatusChange && _this2.onStatusChange({
        item: _this2.configs,
        valid: status.valid,
        dirty: status.dirty
      });
    };

    /** 下级值改变事件 */
    $scope.onChange = function (value) {
      if (!theValid.setValue(value)) {
        //console.log('下级值事件，值未变 插座', value);
        return;
      }
      //console.log('收到值改变 插座', value);
      syncStatus(true).then(emitStatus).finally(function () {
        _this2.onValueChange({
          item: _this2.configs,
          value: value,
          valid: $scope.valid,
          dirty: $scope.dirty
        });
      });
    };
  }

  /**
   * 只读插座
   */
  function ctrlHostShow($scope, $element, $timeout, $q, $compile, DjFormDefaultDefine) {

    this.onChangesCtrl = function (changes) {
      if (changes.configs) $scope.configs = changes.configs.currentValue;
      if (changes.initValue) $scope.value = changes.initValue.currentValue;
      compileConfigs($scope.configs, $scope.value);
    };

    function hideHost() {
      $element.html("");
      $element.addClass("empty");
    }

    /** 编译生成动态子表单项 */
    var compileConfigs = function compileConfigs(configs, value) {
      //console.log("HOST 编译 ", configs, value);
      if (!configs) {
        $timeout(hideHost);
        return;
      }
      /** 一些自动隐藏 */
      if (configs.show) {
        if (configs.show.autohide == 'empty' && value !== 0 && !value) {
          $timeout(hideHost);
          return;
        }
        if (configs.show.autohide == 'zero length' && !(value && value.length)) {
          $timeout(hideHost);
          return;
        }
      }

      /** 自定义控件情况 */
      var componentName = configs.componentShow || configs.component;
      var css = configs.css.hostShow || configs.css.host || 'normal';
      if (componentName) {
        var template = '\n          <div class="' + css + '">\n            <div flex-row="5em" class="{{configs.css.hostBodyShow}}">\n              <span class="a">{{configs.title}}</span>\n              <' + componentName + '\n                configs="$ctrl.configs"\n                init-value="initValue"\n              ></' + componentName + '>\n            </div>\n          </div>';
        $element.html(template);
        $compile($element.contents())($scope);
        return;
      }

      /** 开始编译子组件 */
      var eleType = DjFormDefaultDefine.getSafeType(configs.type);
      var eleName = configs.pre + eleType;
      var css = configs.css.hostShow || configs.css.host || 'normal';
      var template = '\n        <' + eleName + '-show\n          class="' + css + '"\n          configs="$ctrl.configs"\n          init-value="$ctrl.initValue"\n        ></' + eleName + '-show>\n      ';
      $element.html(template);
      var childElement = $compile($element.contents())($scope);
      var childScope = $scope.$$childHead;
      var childTemplate = configs.template || DjFormDefaultDefine.getTemplateShow(eleType);
      childElement.html(childTemplate);
      $compile(childElement.contents())(childScope);
    };
  }
}(window, angular);

angular.module('dj-form').filter('formFormat', function () {
  //可以注入依赖
  return function (str, format) {
    if (!angular.isString(format)) return str;
    if (!angular.isString(str)) str = "";
    return format.replace(/\{1\}/g, str);
  };
});
/**
 * 动态表单组件
 * ver: 0.1.1
 * build: 2018-05-06
 * power by LJH.
 */
!function (window, angular, undefined) {
  var DJ_FORM_DEFAULT = {
    pre: "dj-form-default-item-"
  };
  angular.module('dj-form').value("DJ_FORM_DEFAULT", DJ_FORM_DEFAULT);

  angular.module('dj-form').component('djForm', {
    bindings: {
      mode: '<', // edit(默认)/show
      configs: '<',
      initValues: '<',
      onFormValues: '&',
      onFormStatus: '&'
    },
    template: '\n      <dj-form-item-host class="{{$ctrl.configs.css.host || \'flex-v\'}} {{$ctrl.configs.css.host2}} mode-{{mode}}"\n        mode="mode==\'show\' && \'show\' || subItem.mode"\n        configs="subItem"\n        init-value="memValue[subItem.name]"\n        on-status-change="onItemStatusChange(item, valid, dirty)"\n        on-value-change="onItemValueChange(item, value, valid, dirty)"\n        ng-repeat="subItem in configItems track by $index"\n        ng-if="!stop"\n      ></dj-form-item>',
    controller: ['$scope', '$element', '$timeout', '$q', 'DjWaiteReady', function ($scope, $element, $timeout, $q, DjWaiteReady) {
      var _this3 = this;

      var theMode = false;
      var theChanges = {};

      $scope.stop = true;

      this.$onChanges = function (changes) {
        /** 首先，保存所有的参数传递 */
        ['configs', 'initValues', 'onFormValues', 'onFormStatus'].map(function (name) {
          if (changes[name]) {
            theChanges[name] = changes[name];
          }
        });

        /** mode 是否改变 ? */
        if (changes.mode) {
          var mode = changes.mode.currentValue;
          if (mode != 'show') mode = 'edit';
          if (mode != theMode) {
            theMode = $scope.mode = mode;
            /** mode 改变，初始化或重新初始化插座 */
            reInit(theMode, theChanges).then(function () {
              theChanges = {};
            });
            return;
          }
        }

        /** 如果已有 mode，且 配置改变，则重新初始化。保留原数据 */
        if (theMode && changes.configs) {
          reInit(theMode, theChanges).then(function () {
            theChanges = {};
          });
          return;
        }

        /** 如果有 mode 数据，就响应参数传递 */
        if (theMode && _this3.onChangesCtrl) {
          $timeout(function () {
            _this3.onChangesCtrl(theChanges);
            theChanges = {};
          });
        }
      };

      var reInit = function reInit(mode, changes) {
        $scope.stop = true;
        var theValue = $scope.memValue || {};
        //console.log("有 mode 改变: ", theMode, " => ", mode, ", memValue=", theValue);
        if (!changes.configs) changes.configs = {};
        if (!changes.configs.currentValue) changes.configs.currentValue = $scope.configs;
        if (!changes.initValues) changes.initValues = {};
        if (!changes.initValues.currentValue) changes.initValues.currentValue = theValue;
        return $timeout(function () {
          $scope.stop = false;
          var fn = mode == "show" && ctrlHostShow || ctrlHostEdit;
          fn.call(_this3, $scope, $element, $timeout, $q, DjWaiteReady);
          _this3.onChangesCtrl(changes);
        });
      };
    }]
  });

  function ctrlHostEdit($scope, $element, $timeout, $q, DjWaiteReady) {
    var _this4 = this;

    var configReady = new DjWaiteReady();

    this.onChangesCtrl = function (changes) {
      if (changes.configs) {
        $scope.configs = changes.configs.currentValue;
        initConfigs(changes.configs.currentValue);
      }
      if (changes.initValues) {
        initValues(changes.initValues.currentValue);
      }
    };

    /**
     * 数据初始化
     */
    $scope.memValue = {};
    function initValues(vNew) {
      $scope.memValue = {};
      if ((typeof vNew === 'undefined' ? 'undefined' : _typeof(vNew)) === 'object') {
        /** 在配置初始化后，执行 */
        configReady.ready(function (configs) {
          for (var k in vNew) {
            // 在配置中有的名称，才初始化数据
            if (configs.items.find(function (item) {
              return item.name == k;
            })) {
              $scope.memValue[k] = vNew[k];
            }
          }
        });
      }
    }

    /**
     * 初始化配置
     */
    function initConfigs(vNew) {
      //console.log("Form 初始化配置 ", vNew);
      itemValid = {};
      itemDirty = {};
      if (!vNew) return;
      var templates = vNew.templates || {};
      var pre = vNew.pre || DJ_FORM_DEFAULT.pre;
      var css = vNew.css || {};
      $scope.configItems = vNew.items.map(function (item) {
        return angular.extend({ pre: pre, css: css, template: templates[item.type] }, item);
      });
      /** 通知配置已初始化 */
      vNew && configReady.resolve(vNew);
    };

    /**
     * 子组件事件接收
     */
    $scope.valid = true;
    $scope.dirty = false;
    var itemValid = {}; // 各子组件是否有效
    var itemDirty = {}; // 各子组件是否改变
    $scope.onItemStatusChange = function (item, valid, dirty) {
      itemValid[item.name] = valid;
      itemDirty[item.name] = dirty;
      $scope.valid = !Object.keys(itemValid).find(function (name) {
        return !itemValid[name];
      });
      $scope.dirty = !!Object.keys(itemDirty).find(function (name) {
        return itemDirty[name];
      });
      $timeout(notifyParentStatus);
    };

    /**
     * 全局状态监听和通知
     */
    var oldStatus = {};
    var notifyParentStatus = function notifyParentStatus() {
      if ($scope.valid === oldStatus.valid && $scope.dirty === oldStatus.dirty) return;
      oldStatus.valid = $scope.valid;
      oldStatus.dirty = $scope.dirty;
      /** 通知父组件: 表单状态改变 */
      _this4.onFormStatus && _this4.onFormStatus({
        valid: $scope.valid,
        dirty: $scope.dirty
      });
    };

    /**
     * 值改变事件接收
     */
    $scope.onItemValueChange = function (item, value, valid, dirty) {
      //console.log('收到值改变 djForm', item, value, valid, dirty);
      $scope.onItemStatusChange(item, valid, dirty);
      $scope.memValue[item.name] = value;
      /** 通知父组件: 表单数据改变 */
      _this4.onFormValues && _this4.onFormValues({
        value: $scope.memValue,
        valid: $scope.valid,
        dirty: $scope.dirty,
        item: item
      });
    };
  }

  function ctrlHostShow($scope) {
    this.onChangesCtrl = function (changes) {
      if (changes.configs) $scope.configs = changes.configs.currentValue;
      if (changes.initValues) $scope.memValue = changes.initValues.currentValue;
      if (changes.configs || changes.initValues) {
        initConfigs($scope.configs, $scope.memValue);
      }
    };
    /**
     * 初始化配置
     * 首次 configs 和 values 数据到来时，编译
     * 以后，configs 变化时，重新编译; values 变化时，仅传递数据
     */
    function initConfigs(configs, values) {
      if (!configs || !values) return;
      var templates = configs.templates || {};
      var pre = configs.pre || DJ_FORM_DEFAULT.pre;
      var css = configs.css || {};
      $scope.configItems = configs.items.map(function (item) {
        return angular.extend({ pre: pre, css: css, template: templates[item.type + "-show"] }, item);
      });
    };

    /**
     * 不接收事件
     */
    $scope.onItemStatusChange = function () {};
    $scope.onItemValueChange = function () {};
  }
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  theModule.component('djComponentHost', {
    bindings: {
      component: '@',
      param: '<'
    },
    controller: ["$scope", "$element", "$compile", function ($scope, $element, $compile) {
      var _this5 = this;

      $scope.ZZZ = "DJ_POP";
      this.$onChanges = function (changes) {
        if (changes.component && changes.param) {
          compile(changes.component.currentValue, changes.param.currentValue);
          return;
        }
        if (changes.component) {
          compile(changes.component.currentValue, _this5.param);
          return;
        }
        if (changes.param) {
          compile(_this5.component, changes.param.currentValue);
          return;
        }
      };
      function compile(name, param) {
        if (!name) {
          $element.html("");
          return;
        }
        var sBinds = "";
        if (param) for (var k in param) {
          $scope[k] = param[k];
          sBinds += ' ' + k + '="' + k + '"';
        }
        $element.html('<div class="dj-pop-box"><' + name + ' ' + sBinds + '></' + name + '></div>');
        $compile($element.contents())($scope);
      };
    }]
  });

  /** 仅供 DjPop 调用 */
  theModule.component('djPopBox', {
    bindings: {
      component: '@'
    },
    template: '<dj-component-host param="param || options.param" component="{{$ctrl.component}}"></dj-component-host>'
  });
  theModule.component('djPopToastBox', {
    bindings: {},
    template: '<dj-toast delay="{{options.param.delay}}" text="{{options.param.text}}"></dj-toast>'
  });

  theModule.factory("DjPop", ["$compile", "$rootScope", "DjWaiteReady", "$animateCss", "$q", function ($compile, $rootScope, DjWaiteReady, $animateCss, $q) {

    /**
     * 显示功能
     * @param {string} component
     * @param {object} options
     * @param {function|false} options.beforeClose: 将要关闭，返回 false, 或 reject, 不可关闭
     * @param {function|false} options.onClose: 关闭时回调
     */
    function show(component, options) {
      options = options || {};
      var waiteDialog = new DjWaiteReady();
      var element = options.element || document.body;
      var scopeParent = options.scope || $rootScope;
      var template = options.template || '<dj-pop-box component="' + component + '"></dj-pop-box>';
      var dlg = $compile(template)(scopeParent);
      element.append(dlg[0]);
      var scopeDjPop = dlg.children().scope();
      scopeDjPop.options = options;
      var listener = scopeDjPop.$on("dj-pop-box-close", function (event, data) {
        event.preventDefault();
        closeDjg(data);
      });
      //显示时按浏览器的后退按钮：关闭对话框
      var listener2 = scopeDjPop.$on("$locationChangeStart", function (event) {
        event.preventDefault();
        closeDjg("locationChange");
      });
      return waiteDialog.ready();

      function closeDjg(data) {
        setTimeout(function () {
          scopeDjPop.$destroy();
          dlg && dlg.remove();
          dlg = null;
        });
        //console.log('对话框关闭', data);
        waiteDialog.resolve(data);
      }
    }

    /**
    * 显示功能
    * @param {string} component
    * @param {object} options
    * @param {function|false} options.beforeClose: 将要关闭，返回 false, 或 reject, 不可关闭
    * @param {function|false} options.onClose: 关闭时回调
    */
    function showComponent(options) {
      if (!options || !options.template) return $q.reject("无模板");
      var waiteDialog = new DjWaiteReady();
      var element = options.element || document.body;
      var scopeParent = options.scope || $rootScope;
      var scopeDjPop = scopeParent.$new();
      scopeDjPop.param = options.param;
      var template = options.template;
      var dlg = angular.element('<div>' + template + '</div>');
      angular.element(element).append(dlg);
      dlg.scope(scopeDjPop);
      $compile(dlg.contents())(scopeDjPop);
      //var dlg = $compile(template)(scopeDjPop);
      //angular.element(element).append(dlg[0]);
      var listener = scopeDjPop.$on("dj-pop-box-close", function (event, data) {
        event.preventDefault();
        closeDjg({ btnName: data, param: scopeDjPop.param });
      });
      //显示时按浏览器的后退按钮：关闭对话框
      var listener2 = scopeDjPop.$on("$locationChangeStart", function (event) {
        event.preventDefault();
        closeDjg("locationChange");
      });
      return waiteDialog.ready();

      function closeDjg(data) {
        setTimeout(function () {
          scopeDjPop.$destroy();
          dlg && dlg.remove();
          dlg = null;
        });
        //console.log('对话框关闭', data);
        waiteDialog.resolve(data);
      }
    }
    /**
    * 显示功能
    * @param {string} component
    * @param {object} options
    * @param {function|false} options.beforeClose: 将要关闭，返回 false, 或 reject, 不可关闭
    * @param {function|false} options.onClose: 关闭时回调
    */
    function showComponentAutoParams(componentName, params, options) {
      options = options || {};
      var waiteDialog = new DjWaiteReady();
      var element = options.element || document.body;
      var scopeParent = options.scope || $rootScope;
      var scopeDjPop = scopeParent.$new();
      var attr = [];
      for (var k in params) {
        if (params.hasOwnProperty(k)) {
          attr.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + '="' + k + '"');
          scopeDjPop[k] = params[k];
        }
      }
      var template = '<' + componentName + ' ' + attr.join(' ') + '></' + componentName + '>';
      var dlg = angular.element('<div class="djui-fixed-box">' + template + '</div>');
      angular.element(element).append(dlg);
      dlg.scope(scopeDjPop);
      $compile(dlg.contents())(scopeDjPop);
      //var dlg = $compile(template)(scopeDjPop);
      //angular.element(element).append(dlg[0]);
      var listener = scopeDjPop.$on("dj-pop-box-close", function (event, data) {
        event.preventDefault();
        closeDjg(data);
      });
      //显示时按浏览器的后退按钮：关闭对话框
      var listener2 = scopeDjPop.$on("$locationChangeStart", function (event) {
        event.preventDefault();
        closeDjg("locationChange");
      });
      return waiteDialog.ready();

      function closeDjg(data) {
        setTimeout(function () {
          scopeDjPop.$destroy();
          dlg && dlg.remove();
          dlg = null;
        });
        //console.log('对话框关闭', data);
        waiteDialog.resolve(data);
      }
    }

    function component(componentName, params, options) {
      return showComponentAutoParams(componentName, params, options);
    }

    function dialog(componentName, params, options) {
      return showComponentAutoParams(componentName, params, options).then(function (btnName) {
        if (btnName != "OK") {
          return $q.reject(btnName);
        }
        return btnName;
      });
    }

    function gallery(params, options) {
      return showComponentAutoParams("djui-gallery", params, options);
    }

    function toast(text, delay) {
      var options = {};
      if (angular.isObject(text)) {
        options = text;
        delay = text.delay;
        text = text.text;
      }
      options.template = '<dj-toast text="' + text + '" delay="' + delay + '"></dj-toast>';
      return showComponent(options);
    }

    function alert(body, title) {
      var options = { param: { body: body, title: title, backClose: 1, cancel: { hide: 1 } } };
      if (angular.isObject(body)) {
        options = body;
        if (!options.param) options = { param: options };
      }
      options.template = '<djui-dialog param="param"></djui-dialog>';
      return showComponent(options).then(function (result) {
        if (!result || result.btnName != "OK") {
          return $q.reject(result);
        }
        return result;
      });
    }

    function confirm(body, title) {
      var options = { param: { body: body, title: title } };
      if (angular.isObject(body)) {
        options = body;
        if (!options.param) options = { param: options };
      }
      options.template = '<djui-dialog param="param"></djui-dialog>';
      return showComponent(options).then(function (result) {
        if (!result || result.btnName != "OK") {
          return $q.reject(result);
        }
        return result;
      });
    }

    function input(title, text) {
      var options = { param: { title: title, text: text } };
      if (angular.isObject(title)) {
        options = title;
        if (!options.param) options = { param: options };
      }
      options.template = '<djui-dialog param="param"><djui-dialog-body><textarea class="djui-dialog-input" ng-model="param.text"></textarea></djui-dialog-body></djui-dialog>';
      return showComponent(options).then(function (result) {
        if (!result || !result.param || result.btnName != "OK") {
          return $q.reject(result);
        }
        return result.param.text;
      });
    }

    return {
      show: show,
      alert: alert,
      confirm: confirm,
      input: input,
      toast: toast,
      gallery: gallery,
      component: component,
      dialog: dialog
    };
  }]);
}(window, angular);

!function (window, angular, undefined) {
  angular.module('dj-ui').directive('flexRow', ['$q', function ($q) {
    return {
      restrict: 'A',
      link: function link(scope, element, attr) {
        attr.$observe("flexRow", function (width) {
          element.addClass("flex flex-left");
          element.children().eq(0).addClass("shrink0");
          element.children().eq(1).addClass("flex-1");
          element.children()[0].style.opacity = 0.5;
          if (width) element.children()[0].style.width = width;
        });
      }
    };
  }]);

  angular.module('dj-ui').directive('brText', ['$q', function ($q) {
    return {
      restrict: 'A',
      link: function link(scope, element, attr) {
        attr.$observe("brText", function (str) {
          element.html(str.replace(/\n/g, "<br>"));
        });
      }
    };
  }]);
}(window, angular);

!function (window, angular, undefined) {

  angular.module('dj-ui').component('djuiInput', {
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
    template: '\n        <div class="flex">\n          <i class="fa fa-{{$ctrl.icon || $ctrl.param.icon}}" ng-if="$ctrl.icon || $ctrl.param.icon"></i>\n          <input class="flex-1"\n            dj-focus="{{djFocus}}"\n            placeholder="{{$ctrl.placeholder}}"\n            ng-model="ngModel"\n            ng-change="onChange(ngModel)"\n          >\n          <i class="fa fa-qrcode" ng-if="$ctrl.param.scan" ng-click="scanText()"></i>\n          <i class="fa fa-check-square-o" ng-if="$ctrl.param.submit" ng-click="submitText()"></i>\n          <i class="fa fa-times-circle" ng-if="$ctrl.param.clear" ng-click="clearContent()"></i>\n        </div>\n        ',
    controller: ['$scope', '$http', '$timeout', "$q", ctrl]
  });

  function ctrl($scope, $http, $timeout, $q) {
    var _this6 = this;

    this.$onChanges = function (changes) {
      if (changes.focus) {
        if (changes.focus.currentValue) {
          setFocus();
        }
      }
      if (changes.initValue) {
        $scope.ngModel = changes.initValue.currentValue;
      }
    };

    function setFocus() {
      $scope.djFocus = 1;
      $timeout(function () {
        $scope.djFocus = '';
      }, 300);
    };

    $scope.onChange = function (value) {
      _this6.onChange({ value: value, initValue: value });
    };

    $scope.clearContent = function () {
      $scope.ngModel = '';
      setFocus();
      _this6.onChange({ value: $scope.ngModel });
    };
    $scope.submitText = function () {
      var param = _this6.param || {};
      angular.isFunction(param.submit) && param.submit($scope.ngModel);
    };
    $scope.scanText = function () {
      var scan = _this6.param.scan;
      var beforeScan = scan.beforeScan && scan.beforeScan($scope.ngModel);
      // beforeScan 返回 === false 或 $q.reject 则禁止扫描
      if (beforeScan === false) return;
      $q.when(beforeScan).then(function (result) {
        callScan();
      }).catch(function (e) {
        console.log("扫描前处理, 拒绝=", e);
      });
    };
    var callScan = function callScan() {
      var param = _this6.param || {};
      var scan = param.scan || {};
      $http.post("扫描二维码").then(function (text) {
        // 先通知值变化
        $scope.ngModel = text;
        _this6.onChange({ value: $scope.ngModel });
        // 再看要不要再扫描
        var reScan = scan.onText && scan.onText(text);
        if (!reScan) return;
        $q.when(reScan).then(function (result) {
          // 再看要不要再扫描
          if (result && result.reScan) {
            $timeout(callScan, result && result.delay || scan.delay || 600);
          }
        });
      });
    };
  }
}(window, angular);

!function (window, angular, undefined) {

  angular.module('dj-ui').component('djuiStar', {
    bindings: {
      mode: '@',
      max: '<',
      initValue: '<',
      onChange: '&'
    },
    template: '\n        <div class="flex flex-left flex-v-center" ng-mouseleave="leave()">\n          <span class="star flex-cc" nth="{{i}}"\n            ng-repeat="i in stars"\n            ng-mouseover="overstar(i)"\n            ng-mouseup="click(i)"\n          >{{i>0 && ((valueOver<0 && i<=value || i<=valueOver) && \'\u2605\' || \'\u2606\') || \'\'}}</span>\n        </div>\n        ',
    controller: ["$scope", "$element", ctrl]
  });

  function ctrl($scope, $element) {
    var _this7 = this;

    this.$onChanges = function (changes) {
      if (changes.mode) {
        //console.log("星星， mode=", changes.mode.currentValue);
        $scope.mode = changes.mode.currentValue || "";
      }
      if (changes.max) {
        var max = +changes.max.currentValue;
        if (!max || max < 0) max = 5;
        if (max > 20) max = 20;
        $scope.max = max;
        $scope.stars = Array.from({ length: max + 1 }, function (v, k) {
          return k;
        });
      }
      if (changes.initValue) {
        var value = +changes.initValue.currentValue || 0;
        $scope.value = value;
      }
    };

    $scope.valueOver = -1;
    $scope.leave = function () {
      if ($scope.mode == "show") return;
      $scope.valueOver = -1;
    };
    $scope.overstar = function (value) {
      if ($scope.mode == "show") return;
      $scope.valueOver = value;
    };

    $scope.click = function (value) {
      if ($scope.mode == "show") return;
      //console.log("星星", value)
      $scope.value = value;
      _this7.onChange({ value: value });
    };
  }
}(window, angular);

!function (window, angular, undefined) {

  angular.module('dj-ui').component('djuiTags', {
    bindings: {
      param: '<',
      list: '<',
      initValue: '<',
      onChange: '&',
      editable: '@'
    },
    template: '\n        <div class="flex flex-left flex-wrap">\n          <div class="tag flex-cc {{selected[item.value||item]&&\'active\'||\'\'}}"\n            ng-repeat="item in list"\n            ng-click="clickItem(item)"\n          >{{item.title||item}}</div>\n        </div>\n        ',
    controller: ["$scope", "$element", function ctrl($scope, $element) {
      var _this8 = this;

      this.$onChanges = function (changes) {
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
      };

      /** 计算是否选中 */
      function calcSelected() {
        if (!$scope.list || !$scope.value) return;
        $scope.selected = {};
        $scope.value.map(function (v) {
          $scope.selected[v] = 1;
        });
      }

      $scope.clickItem = function (item) {
        var item_value = item.value || item;
        var b = $scope.selected[item_value] = !$scope.selected[item_value];
        if (b) {
          $scope.value.push(item_value);
        } else {
          $scope.value = $scope.value.filter(function (v) {
            return v != item_value;
          });
        }
        _this8.onChange({ value: $scope.value });
      };
    }]
  });

  angular.module('dj-ui').component('djuiTagsShow', {
    bindings: {
      list: '<'
    },
    template: '\n        <div class="flex flex-left flex-wrap">\n          <div class="tag flex-cc" ng-repeat="item in list">{{item}}</div>\n        </div>\n        ',
    controller: ["$scope", "$element", function ctrl($scope, $element) {
      this.$onChanges = function (changes) {
        if (changes.list) {
          var list = changes.list.currentValue;
          if (!angular.isArray(list)) list = [];
          $scope.list = list;
        }
      };
    }]
  });
}(window, angular);
/**
 * 数据等待类

   var dataNeedReady = new DjWaiteReaddy();

   ...

   dataNeedReady.ready(data =>{
     // this will run after dataNeedReady.resolve fun called.
     // data ready now!
   })

   ...

   dataNeedReady.resolve('这是备妥的数据！'); //

 */
!function (window, angular, undefined) {

  var serviceModule = angular.module('dj-ui');

  serviceModule.factory('DjWaiteReady', ['$q', function ($q) {

    function DjWaiteReady() {
      this._isReady = false;
      this.deferred = $q.defer();
      this.promise = this.deferred.promise;
    }

    DjWaiteReady.prototype = {
      /**
       * 数据是否已备妥
       */
      get isReady() {
        return this._isReady;
      },
      /**
       * 通知数据已备妥。 首次调用时通知，以后，只更新数据
       * @param data 已备妥的数据
       */
      resolve: function resolve(data) {
        if (!this.isReady) {
          this.deferred.resolve(data);
          this._isReady = true;
        }
        this.promise = data;
      },

      /**
       * 通知数据已备妥(拒绝)。 首次调用时通知，以后，只更新数据
       * @param data 已拒绝的原因
       */
      reject: function reject(reason) {
        if (!this.isReady) {
          this.deferred.reject(reason);
        }
        this._isReady = 'reject';
        this.promise = reason;
      },

      /**
       * 等待数据备妥承诺
       * @param func 兑现回调函数。承诺兑现时，调用本函数，并传递备妥的数据
       */
      ready: function ready(fn) {
        if (this._isReady == 'reject') {
          return $q.reject(this.promise);
        }
        fn && $q.when(this.promise).then(fn);
        return $q.when(this.promise);
      }
    };

    return DjWaiteReady;
  }]);
}(window, angular);
/**
 * 动态表单-所有子组件
 * ver: 0.1.0
 * build: 2018-04-26
 * power by LJH.
 */
!function (window, angular, undefined) {
  var DJ_FORM_DEFAULT = {
    pre: "dj-form-default-item-"
  };

  var theModule = angular.module('dj-form');

  /**
   * 初始化下拉列表
   * @param {*} param 要初始化列表的参数
   */
  function initDropdownList(param, $http, $q) {
    //console.log('获取下拉列表, param =', param);
    if (!param || !param.list) return $q.when([]);
    if (angular.isString(param.list)) {
      return $http.post('获取下拉列表', param.list).then(function (json) {
        //console.log('获取下拉列表, json =', json);
        return $q.when(json.list || json.datas.list);
      }).catch(function (e) {
        //console.log('获取下拉列表, 失败: ', e);
        return $q.reject([]);
      });
    }
    if (angular.isFunction(param.list)) {
      return $q.when(param.list());
    }
    return $q.when(param.list);
  }

  var theControlers = {
    /** 空的控制器 */
    "empty": ['$scope', function ($scope) {}],

    /** 一般的 input 绑定 */
    "input": ['$scope', function ($scope) {
      var _this9 = this;

      this.$onChanges = function (changes) {
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
        }
      };
      $scope.change = function (value) {
        //console.log("ng-change", value);
        _this9.onChange({ value: value });
      };
    }],

    /** 一般的显示 */
    "input-show": ['$scope', function ($scope) {
      this.$onChanges = function (changes) {
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
        }
      };
    }],

    /** 下拉框 */
    "dropdown": ["$scope", "$timeout", "$http", "$q", "DjWaiteReady", function ($scope, $timeout, $http, $q, DjWaiteReady) {
      var _this10 = this;

      var configReady = new DjWaiteReady();
      $scope.value = '';
      $scope.selected = '';
      $scope.onToggle = function (open) {
        $scope.focusInput = false;
        open && $timeout(function () {
          $scope.focusInput = true;
        }, 50);
      };
      $scope.click = function (item) {
        $scope.selected = item;
        _this10.onChange({ value: item.value || item });
      };
      $scope.filter = function (searchText) {
        if (!searchText) {
          $scope.list = $scope.list_full;
        } else {
          var pattern = new RegExp(searchText.split('').join('\s*'), 'i');
          $scope.list = $scope.list_full.filter(function (item) {
            return pattern.test(item.value ? item.value + '-' + item.title : item);
          });
        }
      };

      this.$onChanges = function (changes) {
        if (changes.configs) {
          var configs = changes.configs.currentValue;
          if (!configs || !configs.param) return;
          //$scope.list = this.configs.param.list;
          //$scope.list_full = this.configs.param.list;
          //console.log('原下拉列表, list: ', $scope.list);
          //console.log('组件,', this.configs.name, ",", $scope.id);
          //$scope.list_full = this.configs.param.list;
          $scope.searchMode = configs.param.searchMode;
          /** 通知配置已初始化 */
          initDropdownList(configs.param, $http, $q).then(function (list) {
            $scope.list = $scope.list_full = list;
            calcSelected();
            configReady.resolve(configs);
          }).catch(function (e) {
            $scope.list = $scope.list_full = [];
          });
        }
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
          configReady.ready(function (configs) {
            // 不重新获取（当值初始化，或被上级再改变时）
            initDropdownList(configs.param, $http, $q).then(function (list) {
              $scope.list = $scope.list_full = list;
              calcSelected();
            });
          });
        }
      };

      /**
       * 根据 $scope.value 计算选中项
       * 要求：list 已初始化
       */
      var calcSelected = function calcSelected() {
        if (!$scope.list) return;
        $scope.selected = $scope.list.find(function (item) {
          return (item.value || item) == $scope.value;
        });
      };
    }],

    /** 下拉框 - 显示 */
    "dropdown-show": ["$scope", "$timeout", "$http", "$q", "DjWaiteReady", function ($scope, $timeout, $http, $q, DjWaiteReady) {
      this.$onChanges = function (changes) {
        if (changes.configs) $scope.configs = changes.configs.currentValue;
        if (changes.initValue) $scope.value = changes.initValue.currentValue;
        getValueText($scope.configs, $scope.value);
      };
      function getValueText(configs, value) {
        $scope.text = '';
        if (!configs || !value) return;
        initDropdownList(configs.param, $http, $q).then(function (list) {
          var item = list.find(function (item) {
            return item.value == value || item == value;
          });
          if (item) {
            $scope.text = item.title || item;
          }
        });
      }
    }],

    /** 下拉编辑框 */
    "combobox": ["$scope", "$http", "$q", function ($scope, $http, $q) {

      this.$onChanges = function (changes) {
        if (changes.configs) {
          var configs = changes.configs.currentValue;
          if (!configs || !configs.param) return;
          /** 配置变化时，重新计算列表 */
          initDropdownList(configs.param, $http, $q).then(function (list) {
            $scope.list = list;
            calcSelected();
          }).catch(function (e) {
            $scope.list = [];
          });
        }
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
          calcSelected();
        }
      };
      /**
       * 根据 $scope.value 计算选中项
       * 要求：list 已初始化
       */
      var calcSelected = function calcSelected() {
        if (!$scope.list) return;
        $scope.selected = $scope.list.find(function (item) {
          return (item.value || item) == $scope.value;
        });
      };
    }],

    /** 多选标签 */
    "tags": ["$scope", "$http", "$q", function ($scope, $http, $q) {
      this.$onChanges = function (changes) {
        if (changes.configs) {
          var configs = changes.configs.currentValue;
          if (!configs || !configs.param) return;
          /** 配置变化时，重新计算列表 */
          initDropdownList(configs.param, $http, $q).then(function (list) {
            $scope.list = list;
          }).catch(function (e) {
            $scope.list = [];
          });
        }
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
        }
      };
    }],

    /** 下拉框 - 显示 */
    "tags-show": ["$scope", "$http", "$q", "DjWaiteReady", function ($scope, $http, $q, DjWaiteReady) {
      $scope.value = [];
      this.$onChanges = function (changes) {
        if (changes.configs) $scope.configs = changes.configs.currentValue;
        if (changes.initValue) $scope.value = changes.initValue.currentValue;
        getValueText($scope.configs, $scope.value);
      };
      function getValueText(configs, value) {
        $scope.text = '';
        if (!configs || !value) return;
        initDropdownList(configs.param, $http, $q).then(function (list) {
          $scope.value = value.map(function (v) {
            var item = list.find(function (item) {
              return item.value == v || item == v;
            });
            return item && item.value || item || v;
          });
        });
      }
    }],

    /** 单选框 */
    "radio": ["$scope", function ($scope) {}],

    /** 复选框 */
    "check-box": ["$scope", function ($scope) {}],

    /** 图片上传 */
    "imgs-uploader": ["$scope", function ($scope) {
      var _this11 = this;

      $scope.initValue = [];
      this.$onChanges = function (changes) {
        if (changes.initValue) {
          var initValue = changes.initValue.currentValue || [];
          if (!angular.isArray(initValue)) initValue = [];
          $scope.initValue = initValue;
        }
      };
      $scope.onChange = function (imgs) {
        _this11.onChange({ value: imgs });
      };
    }]
  };
  var theTemplates = {
    /** 几个通用显示(未格式化) */
    "initValue-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <span class="b">{{$ctrl.initValue}}</span>\n      </div>',
    "text-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <span class="b">{{text}}</span>\n      </div>',
    "textarea-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <span class="b" br-text="{{$ctrl.initValue}}"></span>\n      </div>',

    /** 几个通用显示 (格式化) */
    "initValue-format-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <span class="b">{{$ctrl.initValue|formFormat:($ctrl.configs.show.format)}}</span>\n      </div>',
    "text-format-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <span class="b">{{text|formFormat:($ctrl.configs.show.format)}}</span>\n      </div>',

    /** 文本框 */
    "input": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <djui-input class="b flex"\n        param="$ctrl.configs.param"\n        placeholder="{{$ctrl.configs.param.placeholder}}"\n        init-value="$ctrl.initValue"\n        on-change="$ctrl.onChange({value: value})"\n      ></djui-input>',

    /** 日期框 */
    "date": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <djui-date class="b flex"\n        param="$ctrl.configs.param"\n        placeholder="{{$ctrl.configs.param.placeholder}}"\n        init-value="$ctrl.initValue"\n        on-change="$ctrl.onChange({value: value})"\n      ></djui-date>',

    /** 多行文本 */
    "textarea": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <textarea class="b"\n        ng-model="value"\n        ng-change="change(value)"\n        placeholder="{{$ctrl.configs.param.placeholder}}"\n      ></textarea>',

    /** 下拉框 */
    "dropdown": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <div class="b inputs flex flex-v-center">\n        <div class="placeholder">{{$ctrl.configs.param.placeholder||\'\'}}</div>\n        <select class="b item-body {{!value&&\'empty\'}}" ng-model="value" ng-change="$ctrl.onChange({value:value})">\n          <option value=""></option>\n          <option ng-repeat="item in list track by $index" value="{{item.value||item}}">{{item.title||item}}</option>\n        </select>\n      </div>\n      ',

    /** 下拉编辑框 */
    "combobox": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <div class="b inputs">\n        <select class="item-body" ng-model="value" ng-change="$ctrl.onChange({value:value})">\n          <option value=""></option>\n          <option ng-repeat="item in list track by $index" value="{{item.value||item}}">{{item.title||item}}</option>\n        </select>\n        <div class="caret-down flex flex-v-center"><div></div></div>\n        <djui-input class="flex"\n          param="$ctrl.configs.param"\n          placeholder="{{$ctrl.configs.param.placeholder}}"\n          init-value="$ctrl.initValue"\n          on-change="$ctrl.onChange({value: value})"\n        ></djui-input>\n      </div>\n      ',

    /** 多标签选择 */
    "tags": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <djui-tags class="item-body"\n        list="list"\n        init-value="value"\n        on-change="$ctrl.onChange({value: value})"\n      ></djui-tags>\n      ',
    "tags-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <djui-tags-show class="b item-body" list="value"></djui-tags-show>\n      </div>\n      ',

    /** 单选框 */
    "radio": '\n      <div class="flex prompt-top" dj-form-default-tip></div>\n    ',

    /** 复选框 */
    "check-box": '\n      <div class="flex prompt-top" dj-form-default-tip></div>\n    ',

    /** 星星 */
    "star": '\n      <div class="a flex prompt-top" dj-form-default-tip></div>\n      <djui-star class=""\n        init-value="$ctrl.initValue"\n        on-change="$ctrl.onChange({value: value})"\n      ></djui-star>\n    ',
    "star-show": '\n      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">\n        <span class="a">{{$ctrl.configs.title}}</span>\n        <djui-star class="b"\n          init-value="$ctrl.initValue"\n          on-change="$ctrl.onChange({value: value})"\n          mode="show"\n        ></djui-star>\n      </div>\n    ',

    /** 图片上传 */
    "imgs-uploader": '\n      <div class="flex prompt-top" dj-form-default-tip></div>\n      <imgs-uploader class="padding-v-1"\n        imgs="initValue"\n        update-img="onChange(imgs)"\n      ></imgs-uploader>',
    "imgs-uploader-show": '\n      <div class="flex">\n        <imgs-uploader class="ab padding-v-1 {{$ctrl.configs.css.hostBodyShow}}"\n          imgs="$ctrl.initValue"\n          mode="show"\n        ></imgs-uploader>\n      </div>\n    '
  };

  var theComponentDefines = [{ name: "input", showTemplate: "initValue-format-show" }, { name: "date", controller: "input" }, { name: "textarea", showTemplate: "textarea-show", controller: "input" }, { name: "dropdown", showTemplate: "text-format-show", showController: "dropdown-show" }, { name: "combobox", showTemplate: "initValue-format-show", showController: "dropdown-show" }, { name: "tags" }, { name: "radio" }, { name: "star", controller: "input" }, { name: "check-box" }, { name: "imgs-uploader" }];
  /** 强制引用 */
  var theComponentDefineRefs = {
    select: "dropdown",
    combo: "combobox"
  };

  function getSafeDefine(type) {
    if (theComponentDefineRefs[type]) return getSafeDefine(theComponentDefineRefs[type]);
    var def = theComponentDefines.find(function (item) {
      return item.name == type;
    });
    if (!def) def = theComponentDefines.find(function (item) {
      return item.name == 'input';
    });
    return def;
  }
  function getSafeType(type) {
    return getSafeDefine(type).name;
  }
  function getTemplateEdit(type) {
    var def = getSafeDefine(type);
    /** 强行定义的 */
    if (def.editTemplate) {
      return theTemplates[def.editTemplate];
    }
    /** 默认定义的 */
    if (theTemplates[type]) {
      return theTemplates[type];
    }
    return theTemplates["input"];
  }
  function getTemplateShow(type) {
    var def = getSafeDefine(type);
    /** 强行定义的 */
    if (def.showTemplate) {
      return theTemplates[def.showTemplate];
    }
    /** 默认定义的 */
    if (theTemplates[type + "-show"]) {
      return theTemplates[type + "-show"];
    }
    return theTemplates["initValue-format-show"];
  }
  function getControllerEdit(type) {
    var def = getSafeDefine(type);
    /** 强行定义的 */
    if (def.editController) {
      return theControlers[def.editController];
    }
    /** 默认定义的 */
    if (theControlers[type]) {
      return theControlers[type];
    }
    return theControlers.input;
  }
  function getControllerShow(type) {
    var def = getSafeDefine(type);
    /** 强行定义的 */
    if (def.showController) {
      return theControlers[def.showController];
    }
    /** 默认定义的 */
    if (theControlers[type + "-show"]) {
      return theControlers[type + "-show"];
    }
    return theControlers.empty;
  }

  /** 默认模板注入，用于插座调用 */
  theModule.value("DjFormDefaultTemplate", theTemplates);
  theModule.value("DjFormDefaultDefine", {
    getSafeType: getSafeType,
    getTemplateEdit: getTemplateEdit,
    getTemplateShow: getTemplateShow
  });

  /** 自动生成组件 */
  function directiveNormalize(name) {
    return name.replace(/[:\-_]+(.)/g, function (_, letter, offset) {
      return offset ? letter.toUpperCase() : letter;
    });
  }
  theComponentDefines.map(function (conponent) {
    /** 所有编辑组件 */
    theModule.component(directiveNormalize('' + DJ_FORM_DEFAULT.pre + conponent.name), {
      bindings: {
        configs: '<',
        djDirty: '<',
        djValid: '<',
        invalidText: '<',
        djRequire: '<',
        initValue: '<',
        onChange: '&'
      },
      template: "",
      controller: getControllerEdit(conponent.name)
    });
    /** 所有显示组件 */
    theModule.component(directiveNormalize('' + DJ_FORM_DEFAULT.pre + conponent.name + '-show'), {
      bindings: {
        configs: '<',
        initValue: '<'
      },
      template: "",
      controller: getControllerShow(conponent.name)
    });
  });

  /** 默认的部分显示 */
  theModule.directive(directiveNormalize('dj-form-default-tip'), function () {
    return {
      restrict: 'A',
      template: '\n        <div class="flex title" dj-form-default-tip-mini></div>\n        <div class="prompt error">{{$ctrl.theValid.djValid && \' \' || $ctrl.theValid.invalidText || \'incorrect\'}}</div>\n      '
    };
  }).directive(directiveNormalize('dj-form-default-tip-mini'), function () {
    return {
      restrict: 'A',
      template: '\n        <div class="require">{{$ctrl.theValid.djRequire && \'*\' || \'\'}}</div>\n        <div class="prompt-text">{{$ctrl.configs.title}}</div>\n      '
    };
  });
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  /**
   * @param user: 全部有关的用户信息
   * @param item: 当前主贴及其回帖点赞等
   * @param clickItem: 回调函数
   */
  theModule.component('djCommentFeedbackShow', {
    bindings: {
      item: '<',
      user: '<',
      clickItem: '&'
    },
    template: '\n      <div class="feedback-top" ng-if="item.praise.length || item.feedback.length">\n      </div>\n      <div class="praise-list" ng-if="item.praise.length">\n        <span>&hearts;</span>\n        <span class="" ng-repeat="uid in item.praise track by $index">{{user[uid].nickname}}</span>\n      </div>\n      <div class="feedback-list" ng-if="item.feedback.length">\n        <div class="feedback-item" ng-mousedown="clickItem(item, feed.uid)" ng-repeat="feed in item.feedback track by $index">\n          <span class="username">{{user[feed.uid].nickname}}</span>\n          <span ng-if="feed.attr.fuid && feed.attr.fuid!=\'0\'"> \u56DE\u590D <span class="username">{{user[feed.attr.fuid].nickname}}</span></span>\n          <span class="feedback-content">: {{feed.attr.content}}</span>\n        </div>\n      </div>\n    ',
    controller: ["$scope", "$http", "$q", "$animateCss", function ($scope, $http, $q, $animateCss) {
      var _this12 = this;

      this.$onChanges = function (changes) {
        if (changes.item) {
          $scope.item = changes.item.currentValue;
        }
        if (changes.user) {
          $scope.user = changes.user.currentValue;
        }
      };

      /** 点击 */
      $scope.clickItem = function (item, fuid) {
        _this12.clickItem({ item: item, fuid: fuid });
      };
    }]
  });
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  /**
   * @param me: 个人数据
   * @param user: 全部有关的用户信息
   * @param item: 当前主贴及其回帖点赞等
   * @param fuid: 被回复的用户id
   * @param post: post函数
   */
  theModule.component('djCommentFeedback', {
    bindings: {
      param: '<'
    },
    template: '\n      <div class="dj-comment-box dj-comment-feedback-box  flex-v flex-stretch flex-between">\n        <div class="list flex-1" ng-click="closeFeedback()">\n          <div class="item flex flex-top" ng-repeat="item in [param.item]" >\n            <div class="left flex-1">\n              <img ng-src="{{user[item.uid].headimgurl}}"/>\n            </div>\n            <div class="right flex-6">\n              <div class="flex user-info">\n                <div class="name">{{user[item.uid].nickname}}</div>\n                <div class="level">{{user[item.uid].level}}</div>\n              </div>\n              <div class="content-box">\n                <div class="content {{more_content&&\' \' ||\' more\'}}" ng-click="more_content = !more_content">{{item.attr.content}}</div>\n                <div class="imgs" ng-if="item.attr.imgs.length">\n                  <img ng-src="{{url}}" ng-click="clickImg(item.attr.imgs, $index)" ng-repeate="url in item.comment.imgs track by $index">\n                </div>\n              </div>\n              <dj-comment-feedback-show item="item" user="user"></dj-comment-feedback-show>\n            </div>\n          </div>\n        </div>\n        <div class="feedback-box flex-v">\n          <div class="user" ng-if="param.fuid">\u56DE\u590D <span class="username">{{user[param.fuid].nickname}}</span></div>\n          <div class="flex input-box">\n            <input class="flex-1" ng-model="feedbackText">\n            <button class="btn btn-default shrink0" ng-click="sendFeedback(feedbackText)">\u56DE\u590D</button>\n          </div>\n        </div>\n      </div>\n    ',
    controller: ["$scope", "$http", "$q", "$animateCss", function ($scope, $http, $q, $animateCss) {

      /** 初始化 */
      !function () {
        $scope.active = 0;
        $scope.pageCount = 1;
        $scope.pop = "";
        this.$onChanges = function (changes) {
          if (changes.param) {
            if (!changes.param.currentValue) return;
            var param = $scope.param = changes.param.currentValue;
            $scope.user = param.user;
            $scope.post = param.post;
          }
        };
      }.call(this);

      /** 关闭 */
      $scope.closeFeedback = function () {
        $scope.$emit("dj-pop-box-close", {});
      };

      /** 请求回贴：*/
      $scope.sendFeedback = function (content) {
        var param = $scope.param;
        var fuid = param.fuid;
        var item = param.item;
        var me = param.me;
        param.post("comment", "feedback", { cid: item.id, fuid: fuid, content: content }).then(function (json) {
          if (!angular.isArray(item.feedback)) {
            item.feedback = [];
          }
          item.feedback.push({ uid: me.uid, attr: { fuid: fuid, content: content } });
          $scope.closeFeedback();
        }).catch(function (e) {});
      };
    }]
  });
}(window, angular);
!function (window, angular, undefined) {
  var theModule = angular.module('dj-pop');

  theModule.directive('djCommentInput', function () {
    return {
      template: '\n      <div class="flex flex-top dj-comment-form-item input prompt-top">\n        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>\n        <input class="flex-1" ng-model="value" ng-change="change(value)" placeholder="{{$ctrl.configs.param.placeholder}}">\n      </div>\n      '
    };
  });

  theModule.directive('djCommentTextarea', function () {
    return {
      template: '\n      <div class="flex flex-top dj-comment-form-item input prompt-top">\n        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>\n        <textarea class="flex-1" ng-model="value" ng-change="change(value)" placeholder="{{$ctrl.configs.param.placeholder}}">\n        </textarea>\n      </div>\n      '
    };
  });

  theModule.directive('djCommentDropdown', function () {
    return {
      template: '\n      <div class="flex flex-top dj-comment-form-item dropdown prompt-top">\n        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>\n        <select class="item-body" ng-model="value" ng-change="$ctrl.onChange({value:value})">\n          <option value="">{{$ctrl.configs.param.placeholder}}</option>\n          <option ng-repeat="item in list track by $index" value="{{$index}}">{{item.title||item}}</option>\n        </select>\n      </div>\n      '
    };
  });

  theModule.directive('djCommentImgsUploader', function () {
    return {
      template: '\n      <div class="flex dj-comment-form-item imgs-uploader prompt-top">\n        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>\n        <imgs-uploader class="padding-v-1 flex-1"\n          imgs="initValue"\n          update-img="onChange(imgs)"\n        ></imgs-uploader>\n      </div>\n      '
    };
  });
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  /**
   * @param me: 个人数据
   * @param user: 全部有关的用户信息
   * @param item: 当前主贴及其回帖点赞等
   * @param fuid: 被回复的用户id
   * @param post: post函数
   */
  theModule.component('djCommentPublish', {
    bindings: {
      param: '<'
    },
    template: '\n      <div class="dj-comment-box publish flex-v flex-stretch">\n        <div class="title flex flex-v-center flex-stretch">\n          <div class="flex-cc btn" ng-click="cancel()">\u53D6\u6D88</div>\n          <div class="flex-cc btn {{!valid&&\'disabled\'}}" ng-click="publish()">\u53D1\u8868</div>\n        </div>\n        <div class="body flex-1 flex-v">\n          <dj-form\n            configs="param.form"\n            init-values="formValue"\n            on-form-values="formValueChange(value, item, valid, dirty)"\n            on-form-status="formStatusChange(item, valid, dirty)"\n          ></dj-form>\n        </div>\n      </div>\n    ',
    controller: ["$scope", "$http", "$q", "$animateCss", function ($scope, $http, $q, $animateCss) {

      /** 初始化 */
      !function () {
        this.$onChanges = function (changes) {
          if (changes.param) {
            if (!changes.param.currentValue) return;
            var param = $scope.param = changes.param.currentValue;
            $scope.me = param.em;
          }
        };
      }.call(this);

      /** 关闭 */
      $scope.cancel = function () {
        $scope.$emit("dj-pop-box-close", {});
      };
      $scope.publish = function () {
        if (!$scope.valid) return;
        $scope.$emit("dj-pop-box-close", { ac: "submit", value: $scope.value });
        $http;
      };

      /** 表单事件 */
      !function () {
        $scope.valid = false;
        $scope.value = {};
        $scope.formValueChange = function (value, item, valid, dirty) {
          $scope.value = value;
          $scope.formStatusChange(item, valid, dirty);
        };
        $scope.formStatusChange = function (item, valid, dirty) {
          $scope.valid = valid;
        };
      }.call(this);
    }]
  });
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');
  /** 默认 api 接口 */

  var theDefault = {
    form_css: {
      host: "flex publish",
      host2: "",
      hostEdit: "box flex flex-top",
      hostShow: "flex-1",
      hostBodyShow: "flex-1 flex-top"
    },
    form: {
      items: [{ name: 'content', title: '评论', type: 'textarea', param: { valid: { require: true }, placeholder: "在此发表评论" } }, { name: 'pics', title: '图片', type: 'imgs-uploader' }],
      templates___: {
        "input": "<dj-comment-input></dj-comment-input>",
        "textarea": "<dj-comment-textarea></dj-comment-textarea>",
        "dropdown": "<dj-comment-dropdown></dj-comment-dropdown>",
        "imgs-uploader": "<dj-comment-imgs-uploader></dj-comment-imgs-uploader>"
      }
    },
    api: {
      comment: {
        root: "comment/",
        li: "li",
        remove: "remove",
        add: "add",
        praise: "praise",
        unpraise: "unpraise",
        feedback: "feedback",
        removeFeedback: "removeFeedback"
      },
      user: {
        root: "./app/",
        getWxInfo: "getWxInfo",
        me: "me"
      }
    }
  };

  var template_ac_row = '\n    <div class="flex info">\n      <div class="flex info">\n        <div class="eb-time" am-time-ago="1000*item.t_update"></div>\n        <span class="eb-action"\n          ng-if="item.uid==me.uid"\n          ng-click="deleteComment(item)"\n        >\u5220\u9664</span>\n      </div>\n      <div class="back">\n        <div class="btn-feedback" ng-click="showFeedbackMenu($event, item)"></div>\n        <div class="btn-feedback-menu">\n          <div class="flex">\n            <div ac="praise" ng-if="!item.i_praised"><i class="fa fa-heart-o"> </i> \u8D5E</div>\n            <div ac="unpraise" ng-if="item.i_praised"><i class="fa fa-heart-o"> </i> \u53D6\u6D88</div>\n            <div ac="feedback"><i class="fa fa-commenting-o"> </i> \u8BC4\u8BBA</div>\n          </div>\n        </div>\n      </div>\n    </div>';

  /**
   * @param api.comment: 评论内容api, 可选, 默认值: theDefault.api(深度默认)
   * @param api.user: 用户信息 api, 可选, 默认值: theDefault.api(深度默认)
   * @param module: 评论模块名称，各模块独立
   * @param mid: 评论项id
   * @param form: 评论内容的表单定义(编辑时使用)
   * @transclude dj-comment-header: 评论列表顶部导航条模板
   * @transclude dj-comment-content: 评论主体内容模板
   * @transclude dj-comment-footer: 评论列表脚部导航条模板
   */
  theModule.component('djCommentList', {
    bindings: {
      param: '<'
    },
    transclude: true,
    transclude_mark: {
      'header': '?djCommentHeader',
      'content': '?djCommentContent',
      'footer': '?djCommentFooter'
    },
    template: '\n      <div class="dj-comment-box flex-v flex-stretch">\n        <div class="header transclude-header"></div>\n        <div class="list">\n          <div class="item flex flex-top" ng-repeat="item in items track by $index" >\n            <div class="left flex-1">\n              <img ng-src="{{user[item.uid].headimgurl}}"/>\n            </div>\n            <div class="right flex-6">\n              <div class="main">\n                <dj-comment-item form="form" user="user" item="item" contentbody="contentbody"></dj-comment-item>\n                ' + template_ac_row + '\n              </div>\n              <dj-comment-feedback-show item="item" user="user" click-item="openFeedback($event, item, fuid)"></dj-comment-feedback-show>\n            </div>\n          </div>\n        </div>\n        <div class="btns transclude-footer">\n          <div class="djui-btn block primary" ng-click="openPublist()">\n            \u53D1\u8D34\n          </div>\n        </div>\n      </div>\n    ',
    controller: ["$scope", "$http", "$q", "$animateCss", "$transclude", "$element", "DjPop", function ($scope, $http, $q, $animateCss, $transclude, $element, DjPop) {

      $transclude(function (clone) {
        //$transclude中接收的函数里的参数含有指令元素的内容(指令元素的内容就是指令内部的元素，也就是应该被transclude的内容)  
        //$element包含编译后的DOM元素(也就是把指令template进行了编译)，所以就可以在控制器中同时操作DOM元素和指令内容。  
        var content_transcluded = [].filter.call(clone, function (item) {
          return (item.tagName || "").toLowerCase() == 'dj-comment-content';
        });
        if (content_transcluded.length > 0) {
          $scope.contentbody = content_transcluded[0].outerText;
        }
      });
      var post = function post(api, name, data) {
        if (api == 'comment') {
          data = angular.extend({ module: $scope.param.module, mid: $scope.param.mid }, data);
        }
        api = post.api[api];
        return $http.post(api.root + (api[name] || name), data);
      };

      /** 初始化 */
      !function () {
        $scope.active = 0;
        $scope.pageCount = 1;
        var old_param = {};
        this.$onChanges = function (changes) {
          if (changes.param) {
            if (!changes.param.currentValue) return;
            var param = angular.merge({}, changes.param.currentValue);
            param.api = post.api = angular.merge({}, theDefault.api, param.api);
            if (!angular.equals(old_param, param)) {
              old_param = angular.merge({}, param);
              theData.loadData($scope.param = param);
            }
          }
        };

        $scope.clickImg = function (imgs, active) {
          $http.post("翻译资源", { urls: imgs }).then(function (json) {
            var imgs = json.datas.urls;
            DjPop.gallery({
              param: {
                imgs: imgs,
                active: active
                //btns: [{ css: "fa fa-trash-o text-visited", fn: this.deleteImg }]
              }
            });
          });
        };
      }.call(this);

      /** 数据 */
      $scope.user = {};
      var theData = $scope.theData = {
        activeItem: false,
        loadData: function loadData(param) {

          $scope.form = param.form || theDefault.form;
          if (!$scope.form.css) $scope.form.css = theDefault.form_css;

          /** 个人信息 */
          var ajax_me = post("user", "me", {}).then(function (json) {
            $scope.me = json.datas;
            /** 我的头像呢称等，确保即使自己未发贴，在发贴回帖点赞之后，也有信息 */
            var my_uid = json.datas.uid;
            $scope.user = $scope.user || {};
            $scope.user[my_uid] = $scope.user[my_uid] || {};
            $scope.user[my_uid].headimgurl = json.datas.wx.headimgurl;
            $scope.user[my_uid].nickname = json.datas.wx.nickname;
          }).catch(function (e) {
            console.log('请求me, e=', e);
          });

          /** 主贴列表，及相关用户信息 */
          post("comment", "li", { count: 10 }).then(function (json) {
            var all_item = json.datas.list || [];
            // 主贴
            var publish = $scope.items = all_item.filter(function (item) {
              return item.type == 'publish' && item.attr && (item.attr.content || item.attr.pics);
            });
            publish.map(function (publish_item) {
              // 赞列表
              publish_item.praise = all_item.filter(function (item) {
                return item.type == 'praise' && item.cid == publish_item.id;
              }).map(function (item) {
                return item.uid;
              });
              // 回复列表
              publish_item.feedback = all_item.filter(function (item) {
                return item.type == 'feedback' && item.cid == publish_item.id && item.attr && (item.attr.content || item.attr.pics);
              });
            });

            // 我赞了没有
            $q.when(ajax_me).then(function () {
              publish.map(function (publish_item) {
                publish_item.i_praised = !!publish_item.praise.find(function (uid) {
                  return uid == $scope.me.uid;
                });
              });
            });

            // 用户
            var uids = [];
            all_item.map(function (item) {
              if (uids.indexOf(item.uid) < 0) {
                uids.push(item.uid);
              }
            });
            post("user", "getWxInfo", { uids: uids }).then(function (json) {
              $scope.user = $scope.user || {};
              json.datas.list.map(function (user) {
                $scope.user[user.uid] = user;
              });
            }).catch(function (e) {
              console.log('请求用户, e=', e);
            });
          }).catch(function (e) {
            console.log('获取列表失败, 使用测试数据');
            $scope.items = [];
          });
        }
      };

      /** 回复菜单 */
      !function () {
        var boxOpening = false;
        var boxOpened = false;
        var itemOpened = false;
        $scope.showFeedbackMenu = function (event, item, fuid) {
          itemOpened = item;
          var when_closed;
          /** 关闭菜单 */
          if (close.closing) {
            when_closed = $q.when(close.closing).then(function () {
              close(boxOpened);
            });
          } else {
            close(boxOpened);
          }
          var box = angular.element(event.target).parent()[0].querySelector(".btn-feedback-menu");
          if (box === boxOpened) return;
          open(box, when_closed);
        };
        function onClose(event) {
          /** 检查是否点击菜单 */
          if (event) {
            var btn = angular.element(event.target);
            if (!btn.attr("ac")) btn = btn.parent();
            if (!btn.attr("ac")) btn = btn.parent();
            if (btn.attr("ac") == "praise") {
              $scope.praise(event, itemOpened);
            }
            if (btn.attr("ac") == "unpraise") {
              $scope.unpraise(event, itemOpened);
            }
            if (btn.attr("ac") == "feedback") {
              $scope.openFeedback(event, itemOpened);
            }
          }

          /** 关闭菜单 */
          if (close.closing) {
            $q.when(close.closing).then(onClose);
          } else {
            setTimeout(function () {
              close(boxOpened);
            });
          }
        }
        /** 点击任意关闭 */
        function open(box, when_closed) {
          $q.when(when_closed).then(function () {
            document.addEventListener("mousedown", onClose);
            document.addEventListener("touchstart", onClose);
          });
          var animator = $animateCss(angular.element(box), {
            from: { width: "0" },
            to: { width: "11em" },
            easing: 'ease',
            duration: 0.3 // 秒
          });
          animator.start().then(function () {
            boxOpened = box;
            boxOpening = false;
          });
          boxOpening = box;
        }
        function close(box) {
          document.removeEventListener("mousedown", onClose);
          document.removeEventListener("touchstart", onClose);
          if (!box) return $q.when(1);
          var animator = $animateCss(angular.element(box), {
            from: { width: "11em" },
            to: { width: "0" },
            easing: 'ease',
            duration: 0.3 // 秒
          });
          var defer = $q.defer();
          close.closing = defer.promise;
          animator.start().then(function (e) {
            boxOpened = false;
            if (close.closing) {
              defer.resolve("1");
              close.closing = false;
            }
          });
          setTimeout(function () {
            boxOpened = false;
            if (close.closing) {
              defer.resolve("1");
              close.closing = false;
            }
          }, 320);
        };
      }.call(this);

      /** 回贴 */
      !function () {
        $scope.openFeedback = function (event, item, fuid) {
          function openOnMouseup() {
            document.removeEventListener("mouseup", openOnMouseup);
            document.removeEventListener("touchend", openOnMouseup);
            setTimeout(function () {
              DjPop.show("dj-comment-feedback", {
                param: {
                  param: {
                    me: $scope.me,
                    user: $scope.user,
                    item: item,
                    fuid: fuid,
                    post: post
                  }
                }
              });
            });
          }
          document.addEventListener("mouseup", openOnMouseup);
          document.addEventListener("touchend", openOnMouseup);
        };
      }.call(this);

      /** 赞 */
      !function () {
        function do_praise(praiseType, item) {
          post("comment", praiseType, { cid: item.id }).then(function (json) {
            item.praise = item.praise.filter(function (uid) {
              return uid != $scope.me.uid;
            });
            item.i_praised = praiseType == "praise";
            if (praiseType == "praise") {
              item.praise.push($scope.me.uid);
              item.i_praised = true;
            }
          }).catch(function (e) {
            console.log('赞, e=', e);
          });
        };
        $scope.praise = function (event, item) {
          do_praise("praise", item);
        };
        $scope.unpraise = function (event, item) {
          do_praise("unpraise", item);
        };
      }.call(this);

      /** 发贴 / 删贴 */
      !function () {

        // 删贴
        $scope.deleteComment = function (item) {
          $http.post("显示对话框/confirm", { body: "删除后，本贴及其回帖和点赞均不可恢复。确认？", title: "删除前，请确认：" }).then(function (json) {
            post("comment", "remove", { id: item.id }).then(function (json) {
              $scope.items = $scope.items.filter(function (row) {
                return row.id != item.id;
              });
            });
          });
        };

        // 发贴
        $scope.openPublist = function () {
          DjPop.show("dj-comment-publish", {
            param: {
              param: {
                me: $scope.me,
                user: $scope.user,
                form: $scope.form,
                post: post
              }
            }
          }).then(function (result) {
            if (result.ac == "submit") {
              post("comment", "add", { data: result.value }).then(function (json) {
                // 添加到列表
                $scope.items.push({
                  id: json.datas.id,
                  uid: $scope.me.uid,
                  t_update: json.datas.t_update || 0.001 * new Date(),
                  type: "publish", // 这个属性可以不要
                  praise: [],
                  feedback: [],
                  attr: result.value
                });
              }).catch(function (e) {
                console.log('发贴, e=', e);
              });
            }
            console.log("关闭", e);
          });
        };
      }.call(this);
    }]
  });

  /**
   * 评论内容组件
   *
   * @param user: 所有相关的用户信息，包括头像呢称等
   * @param item: 评论内容
   * @param contentbody: 评论模板
   */
  theModule.component('djCommentItem', {
    bindings: {
      form: '<',
      user: '<',
      item: '<',
      contentbody: '<'
    },
    template: '\n    <div class="flex user-info">\n      <div class="name">{{$ctrl.user[$ctrl.item.uid].nickname}}</div>\n      <div class="level">{{$ctrl.user[$ctrl.item.uid].level}}</div>\n    </div>\n    <div class="content-box transclude-content"></div>\n    ',
    controller: ["$scope", "$element", "$compile", "$timeout", function ($scope, $element, $compile, $timeout) {
      this.$onChanges = function (changes) {
        if (changes.item) $scope.item = changes.item.currentValue;
        if (changes.user) $scope.user = changes.user.currentValue;
        if (changes.contentbody) {
          //console.log("$scope.$id =", $scope.$id, "模板:", changes.contentbody.currentValue);
          compileContent(changes.contentbody.currentValue);
          //if (!changes.contentbody.currentValue) return;
        }
      };

      /** 编译内容 */
      var defaultTemplate = '\n      <div class="content {{more_content&&\' \' ||\' more\'}}" ng-click="more_content = 1">{{$ctrl.item.attr.content}}</div>\n      <div class="imgs flex flex-left flex-wrap" ng-if="$ctrl.item.attr.pics.length">\n        <img ng-src="{{url|assert:90}}" ng-click="clickImg($ctrl.item.attr.pics, $index)" ng-repeat="url in $ctrl.item.attr.pics track by $index">\n      </div>\n      ';
      var defaultTemplate = '\n      <dj-form\n        mode="\'show\'"\n        configs="$ctrl.form"\n        init-values="item.attr"\n      ></dj-form-show>\n      ';
      function compileContent(str) {
        $timeout(function () {
          console.log("编译，$scope.$id =", $scope.$id);
          var contentbody = str || defaultTemplate;
          var contentBlock = angular.element($element[0].querySelector(".transclude-content"));
          contentBlock.html(contentbody);
          $compile(contentBlock.contents())($scope);
        });
      }
    }]
  });
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  theModule.component('djToast', {
    bindings: {
      text: '@',
      delay: '@'
    },
    transclude: true,
    template: '<span>{{$ctrl.text}}</span>',
    controller: ["$scope", "$element", "$q", "$animateCss", function ($scope, $element, $q, $animateCss) {
      var _this13 = this;

      this.$onChanges = function (changes) {
        if (changes.delay) {
          var delay = +changes.delay.currentValue || 0;
          if (!angular.isNumber(delay)) delay = 2000;
          if (delay > 15000) delay = 15000;
          show(delay);
        }
        if (changes.text) {
          show(_this13.delay);
        }
      };

      var timer;
      var toast = function toast(delay) {
        clearTimeout(timer);
        //console.log("重置延时", delay);
        timer = setTimeout(function () {
          //console.log("时间到");
          hide();
        }, delay);
      };

      function show(delay) {
        setTimeout(function () {
          _show().then(function () {
            toast(delay);
          });
        });
      }

      /** 显示 toast, 每个组件只会被执行一次 */
      function _show() {
        if (show.done) return $q.when(show.done);
        //$element.css("opacity", 0)
        var animator = $animateCss($element, {
          from: { opacity: 0 },
          to: { opacity: 1 },
          easing: 'ease',
          duration: 0.5 // 秒
        });
        return show.done = animator.start().then(function () {
          $element.css("opacity", 1);
          show.done = 1;
        }).catch(function (e) {
          //console.log("动画失败, e = ", e);
        });
      }

      /** 隐藏组件，动画方式 */
      function hide() {
        var animator = $animateCss($element, {
          from: { opacity: 1 },
          to: { opacity: 0 },
          easing: 'ease',
          duration: 0.6 // 秒
        });
        animator.start().then(function (a) {
          $scope.$emit("dj-pop-box-close", {});
        });
      }
    }]
  });
}(window, angular);
/**
 * collapse 属性指令
 * ver: 0.0.1
 * build: 2018-04-10
 * power by LJH.
 *
 * html:
    <div class="my-class not-style-height not-style-overflow"
      dj-collapse="{{open}}"
      dj-collapse-group="open=false"
      group="abcde"
    >contents here</div>
 *
 * when you change the open value toggle true/false, action show.
 * if you want to auto close on other dj-collapse open, set attr dj-collapse-group as event code like upper.
 * this directive only send auto close event, and close only when attr dj-collapse is set to false.
 * if you do not set attr group, the attr dj-collapse-group will always recieved when same directivr elememt open,
 * or recieved on the same group.
 */
!function (window, angular, undefined) {

  var djCollapseId = 1;

  angular.module('dj-ui').directive('djCollapse', ["$rootScope", "$parse", "$timeout", function ($rootScope, $parse, $timeout) {
    return {
      restrict: 'A',
      link: function link(scope, element, attr) {
        element.djCollapseId = djCollapseId++;
        //console.log("collapse link");
        attr.$observe("djCollapse", showHide);
        attr.$observe("group", setGroup);
        scope.$on("dj-collapse-open-broadcast", onOpenBroadcast);
        element[0].addEventListener("webkitTransitionEnd", webkitTransitionEnd);

        function showHide(value) {
          value = value || "0";
          value = scope.$eval(value);
          element[0].style.height = element[0].scrollHeight + "px";
          $timeout(function () {
            element[0].style.overflow = "hidden";
            element[0].style.height = element[0].scrollHeight + "px";
            element[0].style.height = value ? element[0].scrollHeight + "px" : "0";
            if (value) {
              //console.log("打开 = ", element.djCollapseId);
              $rootScope.$broadcast("dj-collapse-open-broadcast", { element: element });
            }
          });
        }
        function webkitTransitionEnd(event) {
          //console.log("动画结束,", event);
          if (parseInt(element[0].style.height) > 0) {
            element[0].style.height = "auto";
            element[0].style.overflow = "visible";
          }
        }
        function setGroup(value) {
          element.djCollapseGroup = value;
        }
        function onOpenBroadcast(event, data) {
          //console.log("消息, ", element.djCollapseId, element);
          if (element == data.element) return;
          if (element.djCollapseGroup && element.djCollapseGroup !== data.element.djCollapseGroup) return;

          var handle = $parse(attr.djCollapseGroup);
          scope.$apply(function () {
            handle(scope, { element: element });
          });
        }
      }
    };
  }]);
}(window, angular);

!function (window, angular, undefined) {

  angular.module('dj-ui').component('djuiDate', {
    bindings: {
      initValue: '<',
      onChange: '&',
      format: '<',
      param: '<',
      placeholder: '@'
    },
    template: '\n        <div class="flex djui-input-box">\n          <input class="flex-1" type="date"\n            placeholder="{{$ctrl.placeholder}}"\n            ng-model="ngModel"\n            ng-change="onChange(ngModel)"\n          >\n        </div>\n        ',
    controller: ['$scope', '$http', '$timeout', "$q", ctrl]
  });

  function ctrl($scope, $http, $timeout, $q) {
    var _this14 = this;

    this.$onChanges = function (changes) {
      if (changes.initValue) {
        var str = changes.initValue.currentValue || "";
        $scope.ngModel = new Date(Date.parse(str.replace(/-/g, "/")));
      }
    };

    $scope.onChange = function (value) {
      var format = _this14.format || _this14.param && _this14.param.format || 'yyyy-MM-dd';
      if (value === undefined) return;
      _this14.onChange({ value: timeFormat(value, format) });
    };
  }

  angular.module('dj-ui').filter('timespan', function () {
    //可以注入依赖
    return function (timespan, format) {
      var d = new Date();
      d.setTime(timespan * 1000);
      return timeFormat(d, format || "yyyy-MM-dd");
    };
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
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length > 1 ? RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468" : "") + week[t.getDay() + ""]);
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
      }
    }
    return fmt;
  }
}(window, angular);

/**
 * 对话框组件
 * ver: 0.0.1
 * build: 2018-01-25
 * power by LJH.
 */
!function (window, angular, undefined) {

  var theModule = angular.module('dj-ui');

  theModule.component('djuiDialog', {
    bindings: {
      param: '<'
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
    template: '\n      <div class="djui-dialog flex-cc">\n        <div class="back" ng-click="clickBack()"></div>\n        <div class="box">\n          <div class="title" ng-transclude="title">\n            <div class="text">\n              {{param.title}}\n            </div>\n          </div>\n          <div class="body" ng-transclude="body">\n            <div class="content">{{param.body}}</div>\n          </div>\n          <div class="footer" ng-transclude="footer">\n            <div class="thin-btns flex flex-arround">\n              <div class="thin-btn {{param.cancel.css||\'default\'}}" ng-if="!param.cancel.hide" ng-click="cancel()">{{param.cancel.text||\'\u53D6\u6D88\'}}</div>\n              <div class="thin-btn {{param.OK.css||\'primary\'}}" ng-if="!param.OK.hide" ng-click="OK()">{{param.OK.text||\'\u786E\u5B9A\'}}</div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ',
    controller: ["$scope", "$element", "$q", "$animateCss", function ($scope, $element, $q, $animateCss) {
      $scope.param = {};
      this.$onChanges = function (changes) {
        if (changes.param) {
          $scope.param = changes.param.currentValue || {};
          // console.log("对话框, param = ", changes.param.currentValue);
        }
        animate(1);
      };

      var execClose = function execClose(name) {
        if ($scope.param.beforeClose) {
          var result = $scope.param.beforeClose(name);
          if (result === false) return;
          $q.when(result).then(function (r) {
            animate(0);
            $scope.$emit("dj-pop-box-close", name);
          }).catch(function (e) {});
        } else {
          animate(0);
          $scope.$emit("dj-pop-box-close", name);
        }
      };

      $scope.clickBack = function () {
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
        return animate.running = animator.start().then(function () {
          $element.css("opacity", b);
          animate.running = 1;
        }).catch(function (e) {
          //console.log("动画失败, e = ", e);
        });
      }
    }]
  });
}(window, angular);
!function (window, angular, undefined) {

  var theModule = angular.module('dj-ui');

  theModule.component('djuiGallery', {
    bindings: {
      imgs: '<',
      active: '<',
      nav: '@',
      pageCount: '@',
      onPage: '&',
      btns: '<'
    },
    transclude: true,
    replace: true,
    template: '\n      <div class="djui-gallery-box">\n        <div class="djui-gallery-list" ng-transclude>\n          <div class="djui-gallery-item item-{{$index+1-active}}" ng-repeat="img in imgs track by $index" >\n            <img class="" ng-src="{{img}}"/>\n          </div>\n        </div>\n        <div class="djui-gallery-debug" ng-if="debug">\n          {{debug}}\n        </div>\n        <div class="djui-gallery-top" ng-if="isMoving">\n        </div>\n      </div>\n      <div class="djui-gallery-nav flex flex-between">\n        <div class="dots flex flex-1 flex-center" ng-if="1">\n          <div ng-click="scrollTo($index)" ng-repeat="img in imgs track by $index">{{$index==active&&\'\u25CF\'||\'\u25CB\'}}</div>\n        </div>\n        <div class="btns flex flex-center" ng-if="$ctrl.btns.length">\n          <div ng-click="clickButton(btn)" ng-repeat="btn in $ctrl.btns track by $index">\n            <div class="{{btn.css}}">{{btn.text||\'\'}}</div>\n          </div>\n        </div>\n      </div>\n    ',
    controller: ["$scope", "$window", "$element", "$q", "$animateCss", function ($scope, $window, $element, $q, $animateCss) {
      var _this15 = this;

      $scope.active = 0;
      $scope.pageCount = 1;
      $scope.imgs = [];
      this.$onChanges = function (changes) {
        if (changes.imgs) {
          $scope.imgs = changes.imgs.currentValue || [];
          $scope.pageCount = $scope.imgs.length;
          //console.log('DJ_Gallery imgs=', $scope.imgs);
        }
        if (changes.pageCount && changes.pageCount.currentValue) {
          $scope.pageCount = changes.pageCount.currentValue || 1;
          setTimeout(Move.init);
        }
        if (changes.active) {
          $scope.active = changes.active.currentValue || 0;
        }
      };

      this.$onInit = function () {
        setHandleMouse(".djui-gallery-box");
      };
      function setHandleMouse(selector) {
        setTimeout(function () {
          Move.init();
          var eleHandleMouse = $element[0];
          eleHandleMouse = $element[0].querySelector(selector);
          eleHandleMouse.addEventListener('mousedown', Move.onTouchstart, true);
          eleHandleMouse.addEventListener('touchstart', Move.onTouchstart, true);
          eleHandleMouse.addEventListener('mousemove', Move.onTouchmove, true);
          eleHandleMouse.addEventListener('touchmove', Move.onTouchmove, true);
          eleHandleMouse.addEventListener('mouseup', Move.onTouchend, true);
          eleHandleMouse.addEventListener('touchend', Move.onTouchend, true);
          scrollTo($scope.active);
        });
      }

      var Move = {
        min: 10, // 超过这个值，表示已滑动，不再是点击了
        fastPx: 5, // 快速滑动系数，越小，表示满足快速滑动的速度越大
        slowTurn: 0.3, // 慢速移动可翻页的比例
        init: function init() {
          Move.box = $element[0].querySelector(".djui-gallery-box");
          angular.element(Move.box)
          //.css("height", $element[0].clientHeight)
          .css("width", $element[0].clientWidth);
          var w = Move.box.clientWidth;
          //console.log("初始化, w=", w);
          Move.list = $element[0].querySelector(".djui-gallery-list");
          angular.element(Move.list).css("width", w * $scope.pageCount + "px");
          angular.element(Move.list).children().css("width", w + "px");
          //setTimeout(() => { angular.element(Move.list).addClass("flex"); }, 200);
        },
        checkFast: function checkFast(timeStamp) {
          // 计算是否快速滑动
          var dt = timeStamp - Move.fast.t;
          var dx = Math.abs(Move.x1 - Move.fast.x);
          if (dx * Move.fastPx < dt) {
            //console.log("不够快！", dx, dt);
            // 不够快，数据复原
            Move.fast = { x: Move.x1, t: timeStamp };
            return false;
          } else {
            //console.log("快！", dx, dt);
            return true;
          }
        },
        minMove: function minMove(timeStamp) {
          if (Move.checkFast(timeStamp)) {
            //console.log("快！");
            return Move.box.clientWidth * Move.slowTurn * 0.3;
          }
          return Move.box.clientWidth * Move.slowTurn;
        },
        setMoving: function setMoving(isMoving) {
          $scope.isMoving = isMoving;
          //if(isMoving)setHandleMouse("djui-gallery-top");
          $scope.$apply();
          //setTimeout(() => { angular.element(Move.list).addClass("flex"); });
        },

        /** 事件监听 */
        onTouchstart: function onTouchstart(event) {
          Move.touchstart = true;
          //console.log("滚动, 开始");
          //event.preventDefault();
          //event.stopPropagation();
          Move.begin = true;
          Move.moved = false;
          Move.canceled = false;
          Move.setMoving(false);
          Move.x0 = Move.x1 = (event.touches && event.touches[0] || event).clientX;
          Move.y0 = Move.y1 = (event.touches && event.touches[0] || event).clientY;
          Move.fast = { x: Move.x1, t: event.timeStamp };
          Move.offsetLeft = parseInt(Move.list.style.left) || 0;

          //$scope.debug = "滚动, 开始" + Move.x1; $scope.$apply();
        },
        onTouchmove: function onTouchmove(event) {
          if (!Move.begin) return;
          if (Move.canceled) return;
          Move.touchstart = true;
          Move.x1 = (event.touches && event.touches[0] || event).clientX;
          Move.y1 = (event.touches && event.touches[0] || event).clientY;
          Move.list.style.left = Move.offsetLeft + Move.x1 - Move.x0 + 'px';
          var dx = Math.abs(Move.x1 - Move.x0);
          var dy = Math.abs(Move.y1 - Move.y0);
          if (!Move.moved && dy > Move.min && dy > dx) {
            Move.canceled = true;
            return;
          }
          // console.log("滚动, 移动", dx, dy);
          // 是否已移动了
          if (Math.abs(Move.x1 - Move.x0) >= Move.min || Math.abs(Move.y1 - Move.y0) >= Move.min) {
            Move.moved = true;
          }
          Move.checkFast(event.timeStamp);
          /** 总是要阻止默认行为，以防止变成拖拽 */
          event.preventDefault();
          event.stopPropagation();
          if (Move.moved) {
            Move.setMoving(true);
          }
        },
        onTouchend: function onTouchend(event) {
          Move.begin = false;
          Move.touchstart = false;
          //console.log("滚动, END");
          var lastLeft = parseInt(Move.list.style.left);
          var dMove = Move.offsetLeft - lastLeft;
          var minMove = Move.minMove(event.timeStamp);
          if (!Move.moved) {
            //console.log("点击");
            $scope.$emit("dj-pop-box-close", { active: $scope.active });
            if ($scope.imgs.length) {
              event.preventDefault();
              event.stopPropagation();
              Move.setMoving(false);
            }
            return;
          } else if (dMove > minMove) {
            scrollTo($scope.active + 1);
          } else if (dMove < -minMove) {
            scrollTo($scope.active - 1);
          } else {
            scrollTo($scope.active);
          }
          if (Move.moved) {
            event.preventDefault();
            event.stopPropagation();
          }
          Move.setMoving(false);
        }
      };

      /** 导航 */
      var scrollTo = $scope.scrollTo = function (nth) {
        Move.init();
        if (nth < 0) nth = 0;
        if (nth >= $scope.pageCount) nth = $scope.pageCount - 1;
        $scope.active = nth;

        var animator = $animateCss(angular.element(Move.list), {
          from: { left: Move.list.style.left },
          to: { left: -nth * Move.box.clientWidth + 'px' },
          easing: 'ease',
          duration: 0.2 // 0.2秒
        });
        animator.start().then(function (a) {
          //console.log("动画结束, a = ", a);
          $scope.active = nth;
          _this15.onPage({ page: nth });
        }).catch(function (e) {
          console.log("动画结束, e = ", e);
        });
      };

      /** 功能按钮 */
      $scope.clickButton = function (btn) {
        var result = btn.fn && btn.fn($scope.active, $scope.imgs);
        // console.log("点击, result = ", result);
        if (result) $q.when(result).then(function (r) {
          $scope.pageCount = $scope.imgs.length;
          if ($scope.pageCount < 1) {
            $scope.$emit("dj-pop-box-close", { active: $scope.active });
          }
          scrollTo($scope.active);
        }).catch(function (e) {
          console.log("点击, e = ", e);
        });
      };
    }]
  });
}(window, angular);
!function (window, angular, undefined) {

  angular.module('dj-ui').factory("IMG", ["$q", function ($q) {

    var maxsize = 2e5; // 200K以下文件，直接上传

    /**
     * 上传二进制对象
     * 返回一个承诺，该承诺支持上传进度通知
     */
    function upload(url, file, data, key) {
      var formData = getFormData();

      if (data) {
        for (var prop in data) {
          if (data.hasOwnProperty(prop)) {
            formData.append(prop, data[prop]);
          }
        }
      }
      return getOrientation(file).then(function (orientation) {
        //alert("orientation=" + orientation);
        //console.log("原图旋转:", orientation)
        return fileToBlob(file, orientation).then(function (blob) {
          formData.append(key || 'file', blob, file.name);
          return post(url, formData);
        });
      }).catch(function (e) {
        console.log("getOrientation ERROR:", e);
        return $q.reject(e);
      });
    }
    return {
      upload: upload
      /**
       * post提交
       * 返回一个承诺，该承诺支持上传进度通知
       */
    };function post(url, formData) {
      var deferred = $q.defer();
      var xhr = new window.XMLHttpRequest();

      xhr.open('post', url);

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          var status = xhr.status;
          if (status >= 200 && status < 300) {
            var json = JSON.parse(xhr.responseText);
            deferred.resolve(json);
          } else {
            deferred.reject(xhr);
          }
        }
      };

      //数据发送进度
      xhr.upload.onprogress = function (e) {
        deferred.notify(e);
      };

      xhr.send(formData);
      return deferred.promise;
    }

    /**
     * 将图片文件转换为 blob
     * 当文件较小时，就是文件本身，较大时，为压缩过的数据
     * @return 承诺，兑现内容为可上传的数据
     */
    function fileToBlob(file, orientation) {
      if (!/\/(?:jpeg|png|gif|bmp)/i.test(file.type)) return $q.reject('不支持的图片格式');

      var deferred = $q.defer();
      var reader = new FileReader();

      reader.onload = function (event) {
        var result = this.result;
        //console.log('图片大小', result.length);

        //如果图片大小小于200kb，则直接上传
        if (result.length <= maxsize) {
          //console.log('不压缩', result.length);
          deferred.resolve(file);
          return;
        }

        var img = new Image();
        img.src = result;

        //图片加载完毕之后进行压缩，然后上传
        if (img.complete) {
          callback();
        } else {
          img.onload = callback;
        }

        function callback() {
          var data = compressImgToDataURL(img, orientation);
          var blob = dataURItoBlob(data);
          //console.log("压缩后：blob = ", blob);

          img = null;
          deferred.resolve(blob);
        }
      };

      reader.readAsDataURL(file);
      return deferred.promise;
    }
    /**
     * 压缩图片, 返回 toDataURL 数据
     */
    function compressImgToDataURL(img, orientation) {
      var initSize = img.src.length;
      var width = img.width;
      var height = img.height;

      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");

      //如果图片大于三百万像素, 计算压缩比并将大小压至400万以下
      var ratio = width * height / 3e6;
      if (ratio > 1) {
        ratio = Math.sqrt(ratio);
        width /= ratio;
        height /= ratio;
      } else {
        ratio = 1;
      }

      canvas.width = width;
      canvas.height = height;

      // 铺底色
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 如果图片像素大于100万则使用瓦片绘制
      var count = width * height / 1e6;
      if (count > 1) {
        count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片

        // 计算每块瓦片的宽和高
        var nw = ~~(width / count);
        var nh = ~~(height / count);

        var tCanvas = document.createElement("canvas");
        var tctx = tCanvas.getContext("2d");

        tCanvas.width = nw;
        tCanvas.height = nh;

        for (var i = 0; i < count; i++) {
          for (var j = 0; j < count; j++) {
            tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);

            ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
          }
        }
        tCanvas.width = tCanvas.height = 0;
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      //旋转 镜像
      var ndata = getGoodOrientationDataURL(orientation, canvas, width, height);
      canvas.width = canvas.height = 0;

      //console.log("压缩前：" + initSize);
      //console.log("压缩后：", ndata.length, "尺寸：", width, height);
      //console.log("压缩率：" + ~~(100 * (initSize - ndata.length) / initSize) + "%");

      return ndata;
    }

    /** 获取图像正确旋转图像后的数据 */
    function getGoodOrientationDataURL(orientation, canvas, width, height) {
      if (orientation < 1 || orientation > 8) {
        return canvas.toDataURL("image/jpeg", 0.2);
      }
      //旋转 镜像
      var canvas3 = document.createElement("canvas");
      var ctx3 = canvas3.getContext("2d");
      execOrientation(orientation, canvas3, ctx3, canvas, width, height);

      //进行压缩
      var ndata = canvas3.toDataURL("image/jpeg", 0.2);
      canvas3.width = canvas3.height = 0;

      return ndata;
    }
    function execOrientation(orientation, canvas3, ctx3, source, width, height) {
      if (orientation < 1 || orientation > 8) return;
      var x,
          y,
          n = orientation,
          rotate = orientation > 4;
      if (rotate) n = 9 - n;
      n = n - 1;
      var scalex = [1, -1, -1, 1][n];
      var scaley = [1, 1, -1, -1][n];
      //console.log("变换", scalex, scaley);
      x = -width / 2;
      y = -height / 2;

      if (rotate) {
        //console.log("要旋转");
        canvas3.width = height;
        canvas3.height = width;
        ctx3.translate(-y, -x);
        ctx3.rotate(Math.PI * 1.5);
      } else {
        canvas3.width = width;
        canvas3.height = height;
        ctx3.translate(-x, -y);
      }
      ctx3.scale(scalex, scaley);
      ctx3.drawImage(source, 0, 0, width, height, x, y, width, height);
    }

    /**
     * 将 toDataURL 数据转换为二进制数据，以便上传
     * 该返回值可以塞进表单中，进行post提交，后端处理同普通的文件上传:
          var formdata = getFormData();
          formdata.append('imagefile', blob);
     */
    function dataURItoBlob(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      var subDataURI = dataURI.split(',');
      if (subDataURI[0].indexOf('base64') >= 0) byteString = atob(subDataURI[1]);else byteString = unescape(subDataURI[1]);

      // separate out the mime component
      var mimeString = subDataURI[0].split(':')[1].split(';')[0];

      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // return new Blob([ia], { type: mimeString }); // 未兼容的写法
      return new getBlob([ia], mimeString);
    }

    /**
     * 获取 blob 对象的兼容性写法
     */
    function getBlob(buffer, format) {
      try {
        return new Blob(buffer, { type: format });
      } catch (e) {
        var bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder)();
        buffer.forEach(function (buf) {
          bb.append(buf);
        });
        return bb.getBlob(format);
      }
    }

    /**
     * 获取 formdata 的兼容性写法
     */
    function getFormData() {
      var isNeedShim = ~navigator.userAgent.indexOf('Android') && ~navigator.vendor.indexOf('Google') && !~navigator.userAgent.indexOf('Chrome') && navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 534;

      return isNeedShim ? new FormDataShim() : new FormData();
    }

    /**
     * 获取图像旋转
     * @returns
     * -2: not jpeg
     * -1: not defined
     *
     * 1: 正常
     * 2: 原图是(左右镜像)
     * 3: 原图是(左右镜像, 上下镜像)
     * 4: 原图是(上下镜像)
     * 5: 原图是(上下镜像, 90)
     * 6: 原图是(左右镜像, 上下镜像, 90)
     * 7: 原图是(左右镜像, 90)
     * 8: 原图是(90)
     */
    function getOrientation(file) {
      var deferred = $q.defer();
      var reader = new FileReader();
      reader.onload = function (e) {
        var view = new DataView(this.result);
        if (view.getUint16(0, false) != 0xFFD8) return deferred.resolve(-2);
        var length = view.byteLength,
            offset = 2;
        while (offset < length) {
          var marker = view.getUint16(offset, false);
          offset += 2;
          if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) return deferred.resolve(-1);
            var little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            var tags = view.getUint16(offset, little);
            offset += 2;
            for (var i = 0; i < tags; i++) {
              if (view.getUint16(offset + i * 12, little) == 0x0112) return deferred.resolve(view.getUint16(offset + i * 12 + 8, little));
            }
          } else if ((marker & 0xFF00) != 0xFF00) break;else offset += view.getUint16(offset, false);
        }
        return deferred.resolve(-1);
      };
      reader.readAsArrayBuffer(file);
      return deferred.promise;
    }
  }]);
}(window, angular);
(function () {

  angular.module('dj-ui').filter('preview', function () {
    //可以注入依赖
    return function (url, width, height) {
      return url;
    };
  }).directive("multiFileUpload", function () {
    return {
      controller: ['$scope', '$element', function ($scope, $element) {
        $element.bind("change", function (e) {
          // console.log('有文件');
          $scope.change && $scope.change({ $files: e.target.files });
        });
      }],
      scope: {
        change: "&"
      }
    };
  }).component('imgsUploader', {
    template: '\n        <div class="box flex flex-left flex-wrap">\n          <div class="img preview" ng-click="clickImg($index)" ng-repeat=\'img in imgList track by $index\'>\n            <img ng-src="{{img|preview}}" />\n          </div>\n          <div class="img uploading" ng-repeat=\'file in File.uploadingFiles track by $index\'>\n            <div class="per">{{file.error||(file.per+\'%\')}}</div>\n          </div>\n          <div class="img add" ng-if="mode!=\'show\' && imgList.length < (maxCount||9)">\n            <input type="file" multiple accept="image/*,video/mp4" multi-file-upload change="File.onFile($files)">\n          </div>\n        </div>\n      ',
    bindings: {
      appData: "<",
      maxCount: "<",
      imgs: "<",
      mode: '@',
      onChange: "&",
      updateImg: "&" //选择图片更新用的回调函数
    },
    controller: ["$scope", "$http", "IMG", "DjPop", ctrl]
  });

  function ctrl($scope, $http, IMG, DjPop) {
    var _this16 = this;

    var imgData = this.imgData = { uploadings: [] };
    $scope.imgList = [];
    this.countError = 0;
    this.$onInit = function () {};
    this.$onChanges = function (changes) {
      if (changes.imgs) {
        $scope.imgList = angular.merge([], changes.imgs.currentValue || []);
      }
      if (changes.maxCount) {
        $scope.maxCount = +changes.maxCount.currentValue || 9;
      }
      if (changes.mode) {
        $scope.mode = changes.mode.currentValue || "";
      }
    };

    this.deleteImg = function (n, imgs) {
      if (n < 0 || n >= $scope.imgList.length) return;
      return DjPop.confirm("您确认要删除当前图片?").then(function (a) {
        imgs.splice(n, 1);
        $scope.imgList = angular.merge([], imgs);
      }).then(function () {
        //console.log("删除图片", $scope.imgList);
        var imgs = angular.merge([], $scope.imgList);
        _this16.updateImg({ imgs: imgs, value: imgs });
        _this16.onChange({ imgs: imgs, value: imgs });
      });
    };
    $scope.clickImg = function (n) {
      //DjPop.show("show-gallery", {imgs: this.imgs, remove: this.deleteImg})
      DjPop.gallery({
        imgs: $scope.imgList,
        active: n,
        btns: $scope.mode == "show" ? [] : [{ css: "icon-del", fn: _this16.deleteImg }]
      }).then(function (data) {
        //console.log("show-gallery", data);
      }).catch(function (data) {
        console.log("EEE", data);
      });
    };
    this.addImg = function (url) {
      if ($scope.imgList.length >= $scope.maxCount) return;
      $scope.imgList.push(url);
      //console.log("添加图片", $scope.imgList);
      var imgs = angular.merge([], $scope.imgList);
      _this16.updateImg({ imgs: imgs, value: imgs });
      _this16.onChange({ imgs: imgs, value: imgs });
    };

    /**
     * 上传模块
     **/
    var self = this;
    var File = $scope.File = {
      subTreeId: 0,
      uploadingFiles: [],

      /**
       * 文件选择事件
       **/
      onFile: function onFile(files) {
        //console.log(files);
        if (!files) return;
        //console.info('添加文件', files);
        File.uploadingFiles = File.uploadingFiles || [];
        for (var i = 0; i < files.length; i++) {
          File.uploadingFiles.push(files[i]);
        }
        $scope.$apply();
        this.upload();
      },

      /**
       * 上传
       **/
      uploadFile: function uploadFile(url, file, data) {
        IMG.upload(url, file, data).then(function (json) {
          //console.info('已上传, ', file, json);
          if (json.datas) {
            self.addImg(json.datas.url);
          }
          var n = File.uploadingFiles.indexOf(file);
          //console.info('删除已上传, ', n, file);
          File.uploadingFiles.splice(n, 1);
        }, function (e) {
          //console.info('上传失败, ', file, e);
          file.error = e;
          setTimeout(function () {
            var n = File.uploadingFiles.indexOf(file);
            File.uploadingFiles.splice(n, 1);
            $scope.$apply();
          }, 5000);
        }, function (process) {
          //console.info('上传进度, ', file, process);
          file.per = (process.loaded / file.size * 80).toFixed(2);
          if (file.per > 100) file.per = 100;
        });
      },

      /**
       * 上传
       **/
      upload: function upload() {
        return $http.post("签名", "upload/img").then(function (json) {
          return json.datas;
        }).catch(function (e) {
          //console.log("准备上传图片，无签名！")
          return { url: "/api/file/upload/img", data: {} };
        }).then(function (signed) {
          angular.forEach(File.uploadingFiles, function (file) {
            File.uploadFile(signed.url, file, signed.data);
          });
        });
      }
    };
  }
})();

/**
 * 左滑，显示删除按钮
 * 依赖：angular-touch, flex css
 * 要求：使用本指令的元素显示为一行无补白，且只有一个下级元素来显示正常内容
 * 使用：
      <div left-swipt-delete="deleteItem($index)">
        <div>显示内容</div>
      </div>


      $scope.deleteItem = function(index) {
        // do something here
        // return false; // close the botton animate
        // return value; // value!==false, close the botton quickly
        // return $http.post(...); // close the botton when promised, reject as false
      }
 */
angular.module('ngTouch').directive("leftSwiptDelete", ['$parse', '$compile', '$swipe', '$q', function ($parse, $compile, $swipe, $q) {
  // the button text
  var BUTTON_TEXT = '删除';
  // The maximum vertical delta for a swipe should be less than 75px.
  var MAX_VERTICAL_DISTANCE = 75;
  // Vertical distance should not be more than a fraction of the horizontal distance.
  var MAX_VERTICAL_RATIO = 0.3;
  // At least a 30px lateral motion is necessary for a swipe.
  var MIN_HORIZONTAL_DISTANCE = 30;
  // the delete button width in px
  var BUTTON_WIDTH = 100;

  return function (scope, element, attr) {
    var theAttr = attr['leftSwiptDelete'];
    var swipeHandler = $parse(theAttr);

    var startCoords,
        valid,
        theBtn,
        opening = false;

    function validSwipe(coords) {
      // Check that it's within the coordinates.
      // Absolute vertical distance must be within tolerances.
      // Horizontal distance, we take the current X - the starting X.
      // This is negative for leftward swipes and positive for rightward swipes.
      // After multiplying by the direction (-1 for left, +1 for right), legal swipes
      // (ie. same direction as the directive wants) will have a positive delta and
      // illegal ones a negative delta.
      // Therefore this delta must be positive, and larger than the minimum.
      if (!startCoords) return false;
      var deltaY = Math.abs(coords.y - startCoords.y);
      var deltaX = coords.x - startCoords.x;
      var moved = opening ? deltaX > MIN_HORIZONTAL_DISTANCE : -deltaX > MIN_HORIZONTAL_DISTANCE;
      return valid && // Short circuit for already-invalidated swipes.
      deltaY < MAX_VERTICAL_DISTANCE && deltaY / Math.abs(deltaX) < MAX_VERTICAL_RATIO && moved;
    }

    var pointerTypes = ['touch'];
    if (!angular.isDefined(attr['ngSwipeDisableMouse'])) {
      pointerTypes.push('mouse');
    }
    var theElement;
    setTimeout(function () {
      theElement = showMoving.element = element.children().eq(0);
      theElement.css({
        "position": 'relative',
        "z-index": "2"
      });
      bind(theElement);
      initButton();
    });
    function bind(element) {
      $swipe.bind(element, {
        'start': function start(coords, event) {
          startCoords = coords;
          valid = true;
        },
        'move': function move(coords, event) {
          var dx = coords.x - startCoords.x - (opening ? BUTTON_WIDTH : 0);
          if (dx > 0) dx = 0;
          showMoving(dx);
        },
        'cancel': function cancel(event) {
          valid = false;
          showMoving(0);
        },
        'end': function end(coords, event) {
          opening = validSwipe(coords) ? !opening : opening;
          showMoving(opening ? "show" : "hide");
        }
      }, pointerTypes);
      angular.element(element).on("click", function () {
        showMoving("hide");
      });
    }

    function initButton() {
      element.css("position", 'relative');
      var template = '<div class="left-swipe-delete-btn flex-cc">' + BUTTON_TEXT + '</div>';
      theBtn = $compile(template)(scope);
      element.append(theBtn);
      theBtn.bind("click", function (event) {
        var result = swipeHandler(scope, { $event: event });
        if (result === false) {
          showMoving("hide");
          return;
        }
        $q.when(result).then(function () {
          showMoving(0);
          opening = false;
        }).catch(function () {
          showMoving("hide");
        });
      });
    }

    var showMoving = function showMoving(dx) {
      if (!showMoving.element) {
        showMoving.element = element.children().eq(0);
        showMoving.element.css("display", 'block');
      }
      if (dx == "show") {
        showMoving.element.css("transition-duration", "0.5s");
        showMoving.element.css("transform", 'translateX(-' + BUTTON_WIDTH + 'px)');
        autoclose();
        opening = true;
      } else if (dx == "hide") {
        showMoving.element.css("transition-duration", "0.5s");
        showMoving.element.css("transform", 'translateX(0)');
        opening = false;
      } else {
        showMoving.element.css("transition-duration", "0s");
        showMoving.element.css("transform", 'translateX(' + dx + 'px)');
      }
    };

    function insideElement(target, ele) {
      if (!target || !ele) return false;
      if (target == ele[0] || target == ele) return true;
      return insideElement(target.parentElement, ele);
    }

    function autoclose() {
      var close = function close(event) {
        document.removeEventListener("mousedown", close, false);
        document.removeEventListener("touchstart", close, false);
        var target = event.target || event.srcElement;
        if (insideElement(target, theBtn) || insideElement(target, showMoving.element)) {
          return;
        }
        showMoving("hide");
      };
      document.addEventListener("mousedown", close, false);
      document.addEventListener("touchstart", close, false);
    }
  };
}]);