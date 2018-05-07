!(function (window, angular, undefined) {

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
      param: '<',
    },
    template: `
      <div class="dj-comment-box publish flex-v flex-stretch">
        <div class="title flex flex-v-center flex-stretch">
          <div class="flex-cc btn" ng-click="cancel()">取消</div>
          <div class="flex-cc btn {{!valid&&'disabled'}}" ng-click="publish()">发表</div>
        </div>
        <div class="body flex-1 flex-v">
          <dj-form
            configs="param.form"
            init-values="formValue"
            on-form-values="formValueChange(value, item, valid, dirty)"
            on-form-status="formStatusChange(item, valid, dirty)"
          ></dj-form>
        </div>
      </div>
    `,
    controller: ["$scope", "$http", "$q", "$animateCss", function ($scope, $http, $q, $animateCss) {

      /** 初始化 */
      !(function () {
        this.$onChanges = (changes) => {
          if (changes.param) {
            if (!changes.param.currentValue) return;
            var param = $scope.param = changes.param.currentValue;
            $scope.me = param.em;
          }
        }
      }).call(this);

      /** 关闭 */
      $scope.cancel = () => {
        $scope.$emit("dj-pop-box-close", {});
      }
      $scope.publish = () => {
        if(!$scope.valid)return;
        $scope.$emit("dj-pop-box-close", {ac: "submit", value: $scope.value});
        $http
      }

      /** 表单事件 */
      !(function () {
        $scope.valid = false;
        $scope.value = {};
        $scope.formValueChange = (value, item, valid, dirty) => {
          $scope.value = value;
          $scope.formStatusChange(item, valid, dirty);
        }
        $scope.formStatusChange = (item, valid, dirty) => {
          $scope.valid = valid;
        }
      }).call(this);


    }]
  });



})(window, angular);