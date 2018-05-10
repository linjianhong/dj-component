!(function (window, angular, undefined) {

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
      clickItem: '&',
    },
    template: `
      <div class="feedback-top" ng-if="item.praise.length || item.feedback.length">
      </div>
      <div class="praise-list" ng-if="item.praise.length">
        <span>&hearts;</span>
        <span class="" ng-repeat="uid in item.praise track by $index">{{user[uid].nickname}}</span>
      </div>
      <div class="feedback-list" ng-if="item.feedback.length">
        <div class="feedback-item" ng-mousedown="clickItem(item, feed.uid)" ng-repeat="feed in item.feedback track by $index">
          <span class="username">{{user[feed.uid].nickname}}</span>
          <span ng-if="feed.attr.fuid && feed.attr.fuid!='0'"> 回复 <span class="username">{{user[feed.attr.fuid].nickname}}</span></span>
          <span class="feedback-content">: {{feed.attr.content}}</span>
        </div>
      </div>
    `,
    controller: ["$scope", "$http", "$q", "$animateCss", function ($scope, $http, $q, $animateCss) {
      this.$onChanges = (changes) => {
        if (changes.item) {
          $scope.item = changes.item.currentValue;
        }
        if (changes.user) {
          $scope.user = changes.user.currentValue;
        }
      }

      /** 点击 */
      $scope.clickItem = (item, fuid) => {
        this.clickItem({ item, fuid });
      }


    }]
  });



})(window, angular);