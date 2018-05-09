/**
 * 动态表单-所有子组件
 * ver: 0.1.0
 * build: 2018-04-26
 * power by LJH.
 */
!(function (window, angular, undefined) {
  var DJ_FORM_DEFAULT = {
    pre: "dj-form-default-item-"
  };

  var theModule = angular.module('dj-form');

  /**
   * 初始化下拉列表
   * @param {*} param 要初始化列表的参数，false 表示用已有的数据(自己都忘了什么时候用false!，看看使用者吧)
   */
  function initDropdownList(param, $http, $q) {
    console.log('获取下拉列表, param =', param);
    if (param === false && initDropdownList.result) {
      return $q.when(initDropdownList.result);
    }
    if (!param.list) return $q.when(initDropdownList.result = []);
    if (angular.isString(param.list)) {
      return $http.post('获取下拉列表/' + param.list, {}).then(json => {
        console.log('获取下拉列表, json =', json);
        return $q.when(initDropdownList.result = json.list);
      }).catch(e => {
        console.log('获取下拉列表, 失败: ', e);
        return initDropdownList.result = $q.reject([]);
      })
    }
    if (angular.isFunction(param.list)) {
      return $q.when(initDropdownList.result = param.list());
    }
    return $q.when(initDropdownList.result = param.list);
  }



  var theControlers = {
    /** 空的控制器 */
    "empty": ['$scope', function ($scope) { }],

    /** 一般的 input 绑定 */
    "input": ['$scope', function ($scope) {
      this.$onChanges = (changes) => {
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
        }
      }
      $scope.change = (value) => {
        //console.log("ng-change", value);
        this.onChange({ value });
      };
    }],

    /** 一般的显示 */
    "input-show": ['$scope', function ($scope) {
      this.$onChanges = (changes) => {
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
        }
      }
    }],

    /** 下拉框 */
    "dropdown": ["$scope", "$timeout", "$http", "$q", "DjWaiteReady", function ($scope, $timeout, $http, $q, DjWaiteReady) {
      var configReady = new DjWaiteReady();
      $scope.value = '';
      $scope.selected = '';
      $scope.onToggle = (open) => {
        $scope.focusInput = false;
        open && $timeout(() => {
          $scope.focusInput = true;
        }, 50)
      };
      $scope.click = (item) => {
        $scope.selected = item;
        this.onChange({ value: item.value || item });
      };
      $scope.filter = (searchText) => {
        if (!searchText) {
          $scope.list = $scope.list_full
        }
        else {
          var pattern = new RegExp(searchText.split('').join('\s*'), 'i');
          $scope.list = $scope.list_full.filter(item => {
            return pattern.test(item.value ? item.value + '-' + item.title : item);
          })
        }
      };

      this.$onChanges = (changes) => {
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
          initDropdownList(configs.param, $http, $q).then(list => {
            $scope.list = $scope.list_full = list;
            calcSelected();
            configReady.resolve(configs);
          }).catch(e => {
            $scope.list = $scope.list_full = [];
          });
        }
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
          configReady.ready(configs => {
            // 不重新获取（当值初始化，或被上级再改变时）
            initDropdownList(false, $http, $q).then(list => {
              $scope.list = $scope.list_full = list;
              calcSelected();
            });
          });
        }
      }

      /**
       * 根据 $scope.value 计算选中项
       * 要求：list 已初始化
       */
      var calcSelected = () => {
        if (!$scope.list) return;
        $scope.selected = $scope.list.find(item => (item.value || item) == $scope.value);
      }
    }],


    /** 下拉框 - 显示 */
    "dropdown-show": ["$scope", "$timeout", "$http", "$q", "DjWaiteReady", function ($scope, $timeout, $http, $q, DjWaiteReady) {
      this.$onChanges = (changes) => {
        if (changes.configs) $scope.configs = changes.configs.currentValue;
        if (changes.initValue) $scope.value = changes.initValue.currentValue;
        getValueText($scope.configs, $scope.value);
      }
      function getValueText(configs, value) {
        $scope.text = '';
        if (!configs || !value) return;
        initDropdownList(configs.param, $http, $q).then(list => {
          var item = list.find(item => item.value == value || item == value);
          if (item) {
            $scope.text = item.title || item;
          }
        });
      }
    }],


    /** 下拉编辑框 */
    "combobox": ["$scope", "$http", "$q", function ($scope, $http, $q) {

      this.$onChanges = (changes) => {
        if (changes.configs) {
          var configs = changes.configs.currentValue;
          if (!configs || !configs.param) return;
          /** 配置变化时，重新计算列表 */
          initDropdownList(configs.param, $http, $q).then(list => {
            $scope.list = list;
            calcSelected();
          }).catch(e => {
            $scope.list = [];
          });
        }
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
          calcSelected();
        }
      }
      /**
       * 根据 $scope.value 计算选中项
       * 要求：list 已初始化
       */
      var calcSelected = () => {
        if (!$scope.list) return;
        $scope.selected = $scope.list.find(item => (item.value || item) == $scope.value);
      }
    }],


    /** 多选标签 */
    "tags": ["$scope", "$http", "$q", function ($scope, $http, $q) {
      this.$onChanges = (changes) => {
        if (changes.configs) {
          var configs = changes.configs.currentValue;
          if (!configs || !configs.param) return;
          /** 配置变化时，重新计算列表 */
          initDropdownList(configs.param, $http, $q).then(list => {
            $scope.list = list;
          }).catch(e => {
            $scope.list = [];
          });
        }
        if (changes.initValue) {
          $scope.value = changes.initValue.currentValue;
        }
      }
    }],

    /** 下拉框 - 显示 */
    "tags-show": ["$scope", "$http", "$q", "DjWaiteReady", function ($scope, $http, $q, DjWaiteReady) {
      $scope.value = [];
      this.$onChanges = (changes) => {
        if (changes.configs) $scope.configs = changes.configs.currentValue;
        if (changes.initValue) $scope.value = changes.initValue.currentValue;
        getValueText($scope.configs, $scope.value);
      }
      function getValueText(configs, value) {
        $scope.text = '';
        if (!configs || !value) return;
        initDropdownList(configs.param, $http, $q).then(list => {
          $scope.value = value.map(v => {
            var item = list.find(item => item.value == v || item == v);
            return item && item.value || item || v;
          })
        });
      }
    }],

    /** 单选框 */
    "radio": ["$scope", function ($scope) {
    }],

    /** 复选框 */
    "check-box": ["$scope", function ($scope) {
    }],

    /** 图片上传 */
    "imgs-uploader": ["$scope", function ($scope) {
      $scope.initValue = [];
      this.$onChanges = (changes) => {
        if (changes.initValue) {
          var initValue = changes.initValue.currentValue || [];
          if (!angular.isArray(initValue)) initValue = [];
          $scope.initValue = initValue;
        }
      }
      $scope.onChange = (imgs) => {
        this.onChange({ value: imgs });
      }
    }],
  };
  var theTemplates = {

    /** 文本框 */
    "input": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <djui-input class="flex"
        param="$ctrl.configs.param"
        placeholder="{{$ctrl.configs.param.placeholder}}"
        init-value="$ctrl.initValue"
        on-change="$ctrl.onChange({value: value})"
      ></djui-input>`,
    "input-show": `
      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">
        <span>{{$ctrl.configs.title}}</span>
        <span >{{$ctrl.initValue}}</span>
      </div>`,

    /** 多行文本 */
    "textarea": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <textarea
        ng-model="value"
        ng-change="change(value)"
        placeholder="{{$ctrl.configs.param.placeholder}}"
      ></textarea>`,
    "textarea-show": `
      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">
        <span>{{$ctrl.configs.title}}</span>
        <span br-text="{{$ctrl.initValue}}"></span>
      </div>`,

    /** 下拉框 */
    "dropdown": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <select class="item-body" ng-model="value" ng-change="$ctrl.onChange({value:value})">
        <option value="">{{$ctrl.configs.param.placeholder}}</option>
        <option ng-repeat="item in list track by $index" value="{{item.value||item}}">{{item.title||item}}</option>
      </select>
      `,
    "dropdown-show": `
      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">
        <span>{{$ctrl.configs.title}}</span>
        <span>{{text}}</span>
      </div>`,



    /** 下拉编辑框 */
    "combobox": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <div class="inputs">
        <select class="item-body" ng-model="value" ng-change="$ctrl.onChange({value:value})">
          <option value="">{{$ctrl.configs.param.placeholder}}</option>
          <option ng-repeat="item in list track by $index" value="{{item.value||item}}">{{item.title||item}}</option>
        </select>
        <div class="caret-down flex flex-v-center"><div></div></div>
        <djui-input class="flex"
          param="$ctrl.configs.param"
          placeholder="{{$ctrl.configs.param.placeholder}}"
          init-value="$ctrl.initValue"
          on-change="$ctrl.onChange({value: value})"
        ></djui-input>
      </div>
      `,


    /** 多选下拉框 */
    "mulity-dropdown": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <select multiple="multiple" class="item-body multiple" ng-model="value" ng-change="$ctrl.onChange({value:value})">
        <option value="">{{$ctrl.configs.param.placeholder}}</option>
        <option ng-repeat="item in list track by $index" value="{{$index}}">{{item.title||item}}</option>
      </select>
      `,

    /** 多标签选择 */
    "tags": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <djui-tags class="item-body"
        list="list"
        init-value="value"
        on-change="$ctrl.onChange({value: value})"
      ></djui-tags>
      `,
    "tags-show": `
      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">
        <span>{{$ctrl.configs.title}}</span>
        <djui-tags-show class="item-body"
          list="value"
        ></djui-tags-show>
      </div>
      `,

    /** 单选框 */
    "radio": `
      <div class="flex prompt-top" dj-form-default-tip></div>
    `,

    /** 复选框 */
    "check-box": `
      <div class="flex prompt-top" dj-form-default-tip></div>
    `,

    /** 星星 */
    "star": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <djui-star
        init-value="$ctrl.initValue"
        on-change="$ctrl.onChange({value: value})"
      ></djui-star>
    `,
    "star-show": `
      <div flex-row="5em" class="{{$ctrl.configs.css.hostBodyShow}}">
        <span>{{$ctrl.configs.title}}</span>
        <djui-star
          init-value="$ctrl.initValue"
          on-change="$ctrl.onChange({value: value})"
          mode="show"
        ></djui-star>
      </div>
    `,

    /** 图片上传 */
    "imgs-uploader": `
      <div class="flex prompt-top" dj-form-default-tip></div>
      <imgs-uploader class="padding-v-1"
        imgs="initValue"
        update-img="onChange(imgs)"
      ></imgs-uploader>`,
    "imgs-uploader-show": `
      <imgs-uploader class="padding-v-1 {{$ctrl.configs.css.hostBodyShow}}"
        imgs="$ctrl.initValue"
        mode="show"
      ></imgs-uploader>`,
  };


  var theComponentDefines = [
    { name: "input" },
    { name: "textarea", controller: "input" },
    { name: "dropdown", showTemplate: "dropdown-show", showController: "dropdown-show" },
    { name: "combobox", showTemplate: "input-show", showController: "dropdown-show" },
    { name: "tags" },
    { name: "radio" },
    { name: "star", controller: "input" },
    { name: "check-box" },
    { name: "imgs-uploader" },
  ];
  /** 强制引用 */
  var theComponentDefineRefs = {
    select: "dropdown"
  }


  function getSafeDefine(type) {
    if(theComponentDefineRefs[type]) return getSafeDefine(theComponentDefineRefs[type]);
    var def = theComponentDefines.find(item => item.name == type);
    if (!def) def = theComponentDefines.find(item => item.name == 'input');
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
    return theTemplates["input"]
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
    return theTemplates["input-show"]
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
    return theControlers.empty;
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
    getSafeType,
    getTemplateEdit,
    getTemplateShow
  });


  /** 自动生成组件 */
  function directiveNormalize(name) {
    return name.replace(/[:\-_]+(.)/g, function (_, letter, offset) {
      return offset ? letter.toUpperCase() : letter;
    });
  }
  theComponentDefines.map(conponent => {
    /** 所有编辑组件 */
    theModule.component(directiveNormalize(`${DJ_FORM_DEFAULT.pre}${conponent.name}`), {
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
    theModule.component(directiveNormalize(`${DJ_FORM_DEFAULT.pre}${conponent.name}-show`), {
      bindings: {
        configs: '<',
        initValue: '<',
      },
      template: "",
      controller: getControllerShow(conponent.name)
    });
  });


  /** 默认的部分显示 */
  theModule
    .directive(directiveNormalize('dj-form-default-tip'), function () {
      return {
        restrict: 'A',
        template: `
        <div class="flex title" dj-form-default-tip-mini></div>
        <div class="prompt error">{{$ctrl.djValid && ' ' || $ctrl.invalidText || 'incorrect'}}</div>
      `
      }
    })
    .directive(directiveNormalize('dj-form-default-tip-mini'), function () {
      return {
        restrict: 'A',
        template: `
        <div class="require">{{$ctrl.djRequire && '*' || ''}}</div>
        <div class="prompt-text">{{$ctrl.configs.title}}</div>
      `
      }
    });


})(window, angular);