!(function (window, angular, undefined) {
  var theModule = angular.module('dj-pop');

  theModule.directive('djCommentInput', function(){
    return {
      template: `
      <div class="flex flex-top dj-comment-form-item input prompt-top">
        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>
        <input class="flex-1" ng-model="value" ng-change="change(value)" placeholder="{{$ctrl.configs.param.placeholder}}">
      </div>
      `
    }
  });

  theModule.directive('djCommentTextarea', function(){
    return {
      template: `
      <div class="flex flex-top dj-comment-form-item input prompt-top">
        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>
        <textarea class="flex-1" ng-model="value" ng-change="change(value)" placeholder="{{$ctrl.configs.param.placeholder}}">
        </textarea>
      </div>
      `
    }
  });

  theModule.directive('djCommentDropdown', function(){
    return {
      template: `
      <div class="flex flex-top dj-comment-form-item dropdown prompt-top">
        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>
        <select class="item-body" ng-model="value" ng-change="$ctrl.onChange({value:value})">
          <option value="">{{$ctrl.configs.param.placeholder}}</option>
          <option ng-repeat="item in list track by $index" value="{{$index}}">{{item.title||item}}</option>
        </select>
      </div>
      `
    }
  });

  theModule.directive('djCommentImgsUploader', function(){
    return {
      template: `
      <div class="flex dj-comment-form-item imgs-uploader prompt-top">
        <div class="flex flex-left shrink0 title" dj-form-default-tip-mini></div>
        <imgs-uploader class="padding-v-1 flex-1"
          imgs="initValue"
          update-img="onChange(imgs)"
        ></imgs-uploader>
      </div>
      `
    }
  });

  
})(window, angular);