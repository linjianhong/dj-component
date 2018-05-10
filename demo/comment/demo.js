
var theParam = {
  api: {
    comment: { root: 'comment/' },
    user: { root: '', me: '用户/个人信息', getWxInfo: '用户/微信数据' }
  },
  form: {
    items: [
      { name: 'projname', title: 'name', type: 'input', show: { autohide: "empty" }, param: { valid: { require: true }, placeholder: "在此输入项目名称" } },
      { name: 'projplace', title: 'address', type: 'input', show: { autohide: "empty" }, param: { valid: { require: true }, placeholder: "在此输入项目地点" } },
      { name: 'doneyear', title: 'year', type: 'input', show: { autohide: "empty" }, param: { valid: { min: 1900, max: new Date().getFullYear() }, placeholder: "完成年份" } },
      { name: 'steetype', title: 'type', type: 'dropdown', show: { autohide: "zero length" }, param: { list: ["item1", "item2"] } },
      { name: 'content', title: 'content', type: 'textarea', show: { autohide: "empty" }, param: { valid: { require: true }, placeholder: "在此发表评论" } },
      { name: 'pics', title: 'imgs', type: 'imgs-uploader', show: { autohide: "zero length" } },
    ],
    css: {
      host: "flex publish",
      host2: "",
      hostEdit: "box flex flex-top",
      hostShow: "flex-1",
      hostBodyShow: "flex-1 flex-top",
    },
  },
  module: 'my module name',
  mid: 123
};

angular.module('my-app', [
  'dj-http',
  'dj-localStorage-table',
  'dj-form', 'dj-ui', 'dj-pop'
]).component('myApp', {
  template: `
    <dj-comment-list param="theParam">
      <dj-comment-content1>aa, bb</dj-comment-content1>
    </dj-comment-list>
  `,
  controller: ['$scope', '$q', 'DjPop', function ($scope, $q, DjPop) {
    $scope.theParam = theParam;

    $scope.comment = function () {
      DjPop.comment('标题', '正文');
    };

  }]
})

