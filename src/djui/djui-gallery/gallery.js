!(function (window, angular, undefined) {

  var theModule = angular.module('dj-ui');

  theModule.component('djuiGallery', {
    bindings: {
      imgs: '<',
      active: '<',
      nav: '@',
      pageCount: '@',
      onPage: '&',
      btns: '<',
    },
    transclude: true,
    replace: true,
    template: `
      <div class="djui-gallery-box">
        <div class="djui-gallery-list" ng-transclude>
          <div class="djui-gallery-item item-{{$index+1-active}}" ng-repeat="img in imgs track by $index" >
            <img class="" ng-src="{{img}}"/>
          </div>
        </div>
        <div class="djui-gallery-debug" ng-if="debug">
          {{debug}}
        </div>
        <div class="djui-gallery-top" ng-if="isMoving">
        </div>
      </div>
      <div class="djui-gallery-nav flex flex-between">
        <div class="dots flex flex-1 flex-center" ng-if="1">
          <div ng-click="scrollTo($index)" ng-repeat="img in imgs track by $index">{{$index==active&&'●'||'○'}}</div>
        </div>
        <div class="btns flex flex-center" ng-if="$ctrl.btns.length">
          <div ng-click="clickButton(btn)" ng-repeat="btn in $ctrl.btns track by $index">
            <div class="{{btn.css}}">{{btn.text||''}}</div>
          </div>
        </div>
      </div>
    `,
    controller: ["$scope", "$window", "$element", "$q", "$animateCss", function ($scope, $window, $element, $q, $animateCss) {
      $scope.active = 0;
      $scope.pageCount = 1;
      $scope.imgs = [];
      this.$onChanges = (changes) => {
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
      }

      this.$onInit = () => {
        setHandleMouse(".djui-gallery-box");
      }
      function setHandleMouse(selector) {
        setTimeout(() => {
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
        init: function () {
          Move.box = $element[0].querySelector(".djui-gallery-box");
          angular.element(Move.box)
            //.css("height", $element[0].clientHeight)
            .css("width", $element[0].clientWidth);
          var w = Move.box.clientWidth;
          //console.log("初始化, w=", w);
          Move.list = $element[0].querySelector(".djui-gallery-list");
          angular.element(Move.list).css("width", (w * $scope.pageCount) + "px");
          angular.element(Move.list).children().css("width", w + "px");
          //setTimeout(() => { angular.element(Move.list).addClass("flex"); }, 200);
        },
        checkFast: function (timeStamp) {
          // 计算是否快速滑动
          var dt = timeStamp - Move.fast.t;
          var dx = Math.abs(Move.x1 - Move.fast.x);
          if (dx * Move.fastPx < dt) {
            //console.log("不够快！", dx, dt);
            // 不够快，数据复原
            Move.fast = { x: Move.x1, t: timeStamp };
            return false;
          }
          else {
            //console.log("快！", dx, dt);
            return true;
          }
        },
        minMove: function (timeStamp) {
          if (Move.checkFast(timeStamp)) {
            //console.log("快！");
            return Move.box.clientWidth * Move.slowTurn * 0.3;
          }
          return Move.box.clientWidth * Move.slowTurn;
        },
        setMoving: function (isMoving) {
          $scope.isMoving = isMoving;
          //if(isMoving)setHandleMouse("djui-gallery-top");
          $scope.$apply();
          //setTimeout(() => { angular.element(Move.list).addClass("flex"); });
        },

        /** 事件监听 */
        onTouchstart: function (event) {
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
        onTouchmove: function (event) {
          if (!Move.begin) return;
          if (Move.canceled) return;
          Move.touchstart = true;
          Move.x1 = (event.touches && event.touches[0] || event).clientX;
          Move.y1 = (event.touches && event.touches[0] || event).clientY;
          Move.list.style.left = (Move.offsetLeft + Move.x1 - Move.x0) + 'px';
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
        onTouchend: function (event) {
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
          }
          else if (dMove > minMove) {
            scrollTo($scope.active + 1);
          }
          else if (dMove < -minMove) {
            scrollTo($scope.active - 1);
          }
          else {
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
      var scrollTo = $scope.scrollTo = (nth) => {
        Move.init();
        if (nth < 0) nth = 0;
        if (nth >= $scope.pageCount) nth = $scope.pageCount - 1;
        $scope.active = nth;

        var animator = $animateCss(angular.element(Move.list), {
          from: { left: Move.list.style.left },
          to: { left: (-nth * Move.box.clientWidth) + 'px' },
          easing: 'ease',
          duration: 0.2 // 0.2秒
        });
        animator.start().then(a => {
          //console.log("动画结束, a = ", a);
          $scope.active = nth;
          this.onPage({ page: nth });
        }).catch(e => {
          console.log("动画结束, e = ", e);
        });
      }

      /** 功能按钮 */
      $scope.clickButton = function (btn) {
        var result = btn.fn && btn.fn($scope.active, $scope.imgs);
        // console.log("点击, result = ", result);
        if (result) $q.when(result).then(r => {
          $scope.pageCount = $scope.imgs.length;
          if ($scope.pageCount < 1) {
            $scope.$emit("dj-pop-box-close", { active: $scope.active });
          }
          scrollTo($scope.active);
        }).catch(e => {
          console.log("点击, e = ", e);
        })
      };

    }]
  });

})(window, angular);