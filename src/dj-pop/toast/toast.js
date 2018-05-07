!(function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');

  theModule.component('djToast', {
    bindings: {
      text: '@',
      delay: '@',
    },
    transclude: true,
    template: `<span>{{$ctrl.text}}</span>`,
    controller: ["$scope", "$element", "$q", "$animateCss", function ($scope, $element, $q, $animateCss) {
      this.$onChanges = (changes) => {
        if (changes.delay) {
          var delay = +changes.delay.currentValue || 0;
          if(!angular.isNumber(delay))delay = 2000;
          if(delay > 15000) delay = 15000;
          show(delay)
        }
        if (changes.text) {
          show(this.delay)
        }
      }

      var timer;
      var toast = (delay) => {
        clearTimeout(timer);
        //console.log("重置延时", delay);
        timer = setTimeout(() => {
          //console.log("时间到");
          hide();
        }, delay);
      }

      function show(delay){
        setTimeout(()=>{
          _show().then(()=>{toast(delay)})
        })
      }

      /** 显示 toast, 每个组件只会被执行一次 */
      function _show(){
        if(show.done) return $q.when(show.done);
        //$element.css("opacity", 0)
        var animator = $animateCss($element, {
          from: { opacity: 0 },
          to: { opacity: 1 },
          easing: 'ease',
          duration: 0.5 // 秒
        });
        return show.done = animator.start().then(()=>{
          $element.css("opacity", 1);
          show.done = 1;
        }).catch(e=>{
          //console.log("动画失败, e = ", e);
        });
      }

      /** 隐藏组件，动画方式 */
      function hide(){
        var animator = $animateCss($element, {
          from: { opacity: 1 },
          to: { opacity: 0 },
          easing: 'ease',
          duration: 0.6 // 秒
        });
        animator.start().then(a => {
          $scope.$emit("dj-pop-box-close", {})
        });
      }
      
    }]
  });
})(window, angular);