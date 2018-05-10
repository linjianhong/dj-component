!(function (window, angular, undefined) {

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
      param: '<',
    },
    template: `
      <div class="dj-comment-box dj-comment-feedback-box  flex-v flex-stretch flex-between">
        <div class="list flex-1" ng-click="closeFeedback()">
          <div class="item flex flex-top" ng-repeat="item in [param.item]" >
            <div class="left flex-1">
              <img ng-src="{{user[item.uid].headimgurl}}"/>
            </div>
            <div class="right flex-6">
              <div class="flex user-info">
                <div class="name">{{user[item.uid].nickname}}</div>
                <div class="level">{{user[item.uid].level}}</div>
              </div>
              <div class="content-box">
                <div class="content {{more_content&&' ' ||' more'}}" ng-click="more_content = !more_content">{{item.attr.content}}</div>
                <div class="imgs" ng-if="item.attr.imgs.length">
                  <img ng-src="{{url}}" ng-click="clickImg(item.attr.imgs, $index)" ng-repeate="url in item.comment.imgs track by $index">
                </div>
              </div>
              <dj-comment-feedback-show item="item" user="user"></dj-comment-feedback-show>
            </div>
          </div>
        </div>
        <div class="feedback-box flex-v">
          <div class="user" ng-if="param.fuid">回复 <span class="username">{{user[param.fuid].nickname}}</span></div>
          <div class="flex input-box">
            <input class="flex-1" ng-model="feedbackText">
            <button class="btn btn-default shrink0" ng-click="sendFeedback(feedbackText)">回复</button>
          </div>
        </div>
      </div>
    `,
    controller: ["$scope", "$http", "$q", "$animateCss", function ($scope, $http, $q, $animateCss) {

      /** 初始化 */
      !(function () {
        $scope.active = 0;
        $scope.pageCount = 1;
        $scope.pop = "";
        this.$onChanges = (changes) => {
          if (changes.param) {
            if (!changes.param.currentValue) return;
            var param = $scope.param = changes.param.currentValue;
            $scope.user = param.user;
            $scope.post = param.post;
          }
        }
      }).call(this);

      /** 关闭 */
      $scope.closeFeedback = () => {
        $scope.$emit("dj-pop-box-close", { });
      }

      /** 请求回贴：*/
      $scope.sendFeedback = ( content) => {
        var param = $scope.param
        var fuid = param.fuid;
        var item = param.item;
        var me = param.me;
        param.post("comment", "feedback", { cid: item.id, fuid, content }).then(json => {
          if (!angular.isArray(item.feedback)) {
            item.feedback = [];
          }
          item.feedback.push({ uid: me.uid, attr: { fuid, content } });
          $scope.closeFeedback();
        }).catch(e => {
        });
      }

    }]
  });



})(window, angular);