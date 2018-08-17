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

    var startCoords, valid, theBtn, opening = false;

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
      var moved = opening ? (deltaX > MIN_HORIZONTAL_DISTANCE) : (-deltaX > MIN_HORIZONTAL_DISTANCE);
      return valid && // Short circuit for already-invalidated swipes.
        deltaY < MAX_VERTICAL_DISTANCE &&
        deltaY / Math.abs(deltaX) < MAX_VERTICAL_RATIO &&
        moved;
    }

    var pointerTypes = ['touch'];
    if (!angular.isDefined(attr['ngSwipeDisableMouse'])) {
      pointerTypes.push('mouse');
    }
    var theElement;
    setTimeout(() => {
      var theChildren = element.children();
      theElement = showMoving.element = theChildren.eq(0);
      theElement.css({
        "position": 'relative',
        "z-index": "2"
      });
      bind(theElement);
      if (theChildren.length >= 2) {
        theBtn = theChildren.eq(1);
        theBtn.addClass("left-swipe-delete-btn");
      } else {
        initButton();
      }
    });
    function bind(element) {
      $swipe.bind(element, {
        'start': function (coords, event) {
          startCoords = coords;
          valid = true;
        },
        'move': function (coords, event) {
          var dx = coords.x - startCoords.x - (opening ? BUTTON_WIDTH : 0);
          if (dx > 0) dx = 0;
          showMoving(dx);
        },
        'cancel': function (event) {
          valid = false;
          showMoving(0);
        },
        'end': function (coords, event) {
          opening = validSwipe(coords) ? !opening : opening;
          showMoving(opening ? "show" : "hide");
        }
      }, pointerTypes);
      angular.element(element).on("click", () => {
        showMoving("hide");
      });
    }

    function initButton() {
      element.css("position", 'relative');
      var template = `<div class="left-swipe-delete-btn flex-cc">${BUTTON_TEXT}</div>`
      theBtn = $compile(template)(scope);
      element.append(theBtn);
      theBtn.bind("click", event => {
        var result = swipeHandler(scope, { $event: event });
        if (result === false) {
          showMoving("hide");
          return;
        }
        $q.when(result).then(() => {
          showMoving(0);
          opening = false;
        }).catch(() => {
          showMoving("hide");
        })
      })
    }


    var showMoving = function (dx) {
      if (!showMoving.element) {
        showMoving.element = element.children().eq(0);
        showMoving.element.css("display", 'block');
      }
      if (dx == "show") {
        showMoving.element.css("transition-duration", "0.3s");
        showMoving.element.css("-webkit-transition-duration", "0.3s");
        showMoving.element.css("transform", 'translateX(-' + BUTTON_WIDTH + 'px)');
        showMoving.element.css("-webkit-transform", 'translateX(-' + BUTTON_WIDTH + 'px)');
        autoclose();
        opening = true;
      }
      else if (dx == "hide") {
        showMoving.element.css("transition-duration", "0.3s");
        showMoving.element.css("-webkit-transition-duration", "0.3s");
        showMoving.element.css("transform", 'translateX(0)');
        showMoving.element.css("-webkit-transform", 'translateX(0)');
        opening = false;
      }
      else {
        showMoving.element.css("transition-duration", "0s");
        showMoving.element.css("-webkit-transition-duration", "0s");
        showMoving.element.css("transform", 'translateX(' + dx + 'px)');
        showMoving.element.css("-webkit-transform", 'translateX(' + dx + 'px)');
      }
    }


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
        showMoving("hide")
      }
      document.addEventListener("mousedown", close, false);
      document.addEventListener("touchstart", close, false);
      var unbindHandler = scope.$on("left-swipe-delete-close", () => {
        unbindHandler();
        document.removeEventListener("mousedown", close, false);
        document.removeEventListener("touchstart", close, false);
        showMoving("hide")
      });
    }
  };
}]);