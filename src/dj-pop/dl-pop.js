!(function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  theModule.component('djComponentHost', {
    bindings: {
      component: '@',
      param: '<',
    },
    controller: ["$scope", "$element", "$compile", function ($scope, $element, $compile) {
      $scope.ZZZ = "DJ_POP";
      this.$onChanges = (changes) => {
        if (changes.component && changes.param) {
          compile(changes.component.currentValue, changes.param.currentValue);
          return;
        }
        if (changes.component) {
          compile(changes.component.currentValue, this.param);
          return;
        }
        if (changes.param) {
          compile(this.component, changes.param.currentValue);
          return;
        }
      }
      function compile(name, param) {
        if (!name) {
          $element.html("");
          return;
        }
        var sBinds = "";
        if (param) for (var k in param) {
          $scope[k] = param[k];
          sBinds += ` ${k}="${k}"`
        }
        $element.html(`<div class="dj-pop-box"><${name} ${sBinds}></${name}></div>`);
        $compile($element.contents())($scope);
      };
    }]
  });


  /** 仅供 DjPop 调用 */
  theModule.component('djPopBox', {
    bindings: {
      component: '@'
    },
    template: `<dj-component-host param="param || options.param" component="{{$ctrl.component}}"></dj-component-host>`
  });
  theModule.component('djPopToastBox', {
    bindings: {
    },
    template: `<dj-toast delay="{{options.param.delay}}" text="{{options.param.text}}"></dj-toast>`
  });

  theModule.factory("DjPop", ["$compile", "$rootScope", "DjWaiteReady", "$animateCss", function ($compile, $rootScope, DjWaiteReady, $animateCss) {
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
      var template = options.template || `<dj-pop-box component="${component}"></dj-pop-box>`;
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
        setTimeout(() => {
          scopeDjPop.$destroy();
          dlg && dlg.remove();
          dlg = null;
        })
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
      var dlg = angular.element(`<div>${template}</div>`);
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
        setTimeout(() => {
          scopeDjPop.$destroy();
          dlg && dlg.remove();
          dlg = null;
        })
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
      for(var k in params){
        if(params.hasOwnProperty(k)){
          attr.push(`${k}="${k}"`);
          scopeDjPop[k] = params[k];
        }
      }
      var template = `<${componentName} ${attr.join(' ')}></${componentName}>`;
      var dlg = angular.element(`<div class="djui-fixed-box">${template}</div>`);
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
        setTimeout(() => {
          scopeDjPop.$destroy();
          dlg && dlg.remove();
          dlg = null;
        })
        //console.log('对话框关闭', data);
        waiteDialog.resolve(data);
      }
    }


    function gallery(params, options) {
      return showComponentAutoParams("djui-gallery", params, options);
      return show("djui-gallery", options);
    }

    function toast(text, delay) {
      var options = {};
      if (angular.isObject(text)) {
        options = text;
        delay = text.delay;
        text = text.text;
      }
      options.template = `<dj-toast text="${text}" delay="${delay}"></dj-toast>`;
      return showComponent(options);
    }

    function alert(body, title) {
      var options = { param: { body, title, backClose: 1, cancel: { hide: 1 } } };
      if (angular.isObject(body)) {
        options = body;
      }
      options.template = `<djui-dialog param="param"></djui-dialog>`;
      return showComponent(options);
    }

    function confirm(body, title) {
      var options = { param: { body, title } };
      if (angular.isObject(body)) {
        options = body;
      }
      options.template = `<djui-dialog param="param"></djui-dialog>`;
      return showComponent(options);
    }

    return {
      show,
      alert,
      confirm,
      toast,
      gallery,
    }
  }])


})(window, angular);