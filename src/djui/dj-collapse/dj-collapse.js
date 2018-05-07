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
!(function (window, angular, undefined) {

  var djCollapseId = 1;

  angular.module('dj-ui').directive('djCollapse', ["$rootScope", "$parse", "$timeout", function ($rootScope, $parse, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
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
              $rootScope.$broadcast("dj-collapse-open-broadcast", { element });
            }
          })
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
          scope.$apply(function () { handle(scope, { element }) });
        }
      }
    };
  }]);
})(window, angular);