

var theForm = {
  items: [
    { name: 't1', title: 'text1', type: 'input' },
    { name: 't2', title: 'text1', type: 'input', param: { valid: { require: true, minlength:2, maxlength:8 } ,placeholder: "2 ~ 8 chars"} },
    { name: 'star1', title: '评价1', type: 'star', param: { valid: { require: true } } },
    { name: 'star2', title: '评价2', type: 'star', param: { valid: { require: true } } },
    { name: 'content', title: '评论', type: 'textarea', show: { autohide: "empty" }, param: { placeholder: "在此发表评论" } },
    { name: 'pics', title: '图片', show: { autohide: "zero length" }, type: 'imgs-uploader' },
  ],
  css:{
    host2: "my-host"
  }
};

angular.module('my-app', ['dj-form', 'dj-ui', 'dj-pop']).component('myApp', {
  template: `
    <dj-form class="my-form"
      configs="configs"
      init-values="formValue"
      on-form-values="formValueChange(value, item, valid, dirty)"
      on-form-status="formStatusChange(item, valid, dirty)"
    ></dj-form>
  `,
  controller: ['$scope', function ($scope) {
    $scope.configs = theForm;
  }]
})

