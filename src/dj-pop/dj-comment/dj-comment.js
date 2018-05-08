!(function (window, angular, undefined) {

  var theModule = angular.module('dj-pop');
  /** 默认 api 接口 */

  var theDefault = {
    form_css: {
      host: "flex publish",
      host2: "",
      hostEdit: "box flex flex-top",
      hostShow: "flex-1",
      hostBodyShow: "flex-1 flex-top",
    },
    form: {
      items: [
        { name: 'content', title: '评论', type: 'textarea', param: { valid: { require: true }, placeholder: "在此发表评论" } },
        { name: 'pics', title: '图片', type: 'imgs-uploader' },
        //{ name: 'star1', title: '交货期', type: 'star', param: { valid: { require: true } } },
        //{ name: 'star2', title: '质量', type: 'star', param: { valid: { require: true } } },
        //{ name: 'star3', title: '服务配合', type: 'star', param: { valid: { require: true } } },
        //{ name: 'star4', title: '安全管理', type: 'star', param: { valid: { require: true } } },
        //{ name: 'star5', title: '环保管理', type: 'star', param: { valid: { require: true } } },
      ],
      templates___: {
        "input": "<dj-comment-input></dj-comment-input>",
        "textarea": "<dj-comment-textarea></dj-comment-textarea>",
        "dropdown": "<dj-comment-dropdown></dj-comment-dropdown>",
        "imgs-uploader": "<dj-comment-imgs-uploader></dj-comment-imgs-uploader>",
      }
    },
    api: {
      comment: {
        root: "./comment/",
        li: "li",
        remove: "remove",
        add: "add",
        praise: "praise",
        unpraise: "unpraise",
        feedback: "feedback",
        removeFeedback: "removeFeedback",
      },
      user: {
        root: "./app/",
        getWxInfo: "getWxInfo",
        me: "me",
      }
    }
  };

  var template_ac_row = `
    <div class="flex info">
      <div class="flex info">
        <div class="eb-time" am-time-ago="1000*item.t_update"></div>
        <span class="eb-action"
          ng-if="item.uid==me.uid"
          ng-click="deleteComment(item)"
        >删除</span>
      </div>
      <div class="back">
        <div class="btn-feedback" ng-click="showFeedbackMenu($event, item)"></div>
        <div class="btn-feedback-menu">
          <div class="flex">
            <div ac="praise" ng-if="!item.i_praised"><i class="fa fa-heart-o"> </i> 赞</div>
            <div ac="unpraise" ng-if="item.i_praised"><i class="fa fa-heart-o"> </i> 取消</div>
            <div ac="feedback"><i class="fa fa-commenting-o"> </i> 评论</div>
          </div>
        </div>
      </div>
    </div>`;

  /**
   * @param api.comment: 评论内容api, 可选, 默认值: theDefault.api(深度默认)
   * @param api.user: 用户信息 api, 可选, 默认值: theDefault.api(深度默认)
   * @param module: 评论模块名称，各模块独立
   * @param mid: 评论项id
   * @param form: 评论内容的表单定义(编辑时使用)
   * @transclude dj-comment-header: 评论列表顶部导航条模板
   * @transclude dj-comment-content: 评论主体内容模板
   * @transclude dj-comment-footer: 评论列表脚部导航条模板
   */
  theModule.component('djCommentList', {
    bindings: {
      param: '<',
    },
    transclude: true,
    transclude_mark: {
      'header': '?djCommentHeader',
      'content': '?djCommentContent',
      'footer': '?djCommentFooter'
    },
    template: `
      <div class="dj-comment-box flex-v flex-stretch">
        <div class="header transclude-header"></div>
        <div class="list">
          <div class="item flex flex-top" ng-repeat="item in items track by $index" >
            <div class="left flex-1">
              <img ng-src="{{user[item.uid].headimgurl}}"/>
            </div>
            <div class="right flex-6">
              <div class="main">
                <dj-comment-item form="form" user="user" item="item" contentbody="contentbody"></dj-comment-item>
                ${template_ac_row}
              </div>
              <dj-comment-feedback-show item="item" user="user" click-item="openFeedback($event, item, fuid)"></dj-comment-feedback-show>
            </div>
          </div>
        </div>
        <div class="btns transclude-footer">
          <div class="box-primary btn" ng-click="openPublist()">
            发贴
          </div>
        </div>
      </div>
    `,
    controller: ["$scope", "$http", "$q", "$animateCss", "$transclude", "$element", "DjPop", function ($scope, $http, $q, $animateCss, $transclude, $element, DjPop) {

      $transclude(function (clone) {
        //$transclude中接收的函数里的参数含有指令元素的内容(指令元素的内容就是指令内部的元素，也就是应该被transclude的内容)  
        //$element包含编译后的DOM元素(也就是把指令template进行了编译)，所以就可以在控制器中同时操作DOM元素和指令内容。  
        var content_transcluded = clone.filter('dj-comment-content');
        if (content_transcluded.length > 0) {
          $scope.contentbody = content_transcluded[0].outerText;
        }
      });
      var post = (api, name, data) => {
        if (api == 'comment') {
          data = angular.extend({ module: $scope.param.module, mid: $scope.param.mid }, data);
        }
        api = post.api[api];
        return $http.post(api.root + (api[name] || name), data);
      }

      /** 初始化 */
      !(function () {
        $scope.active = 0;
        $scope.pageCount = 1;
        var old_param = {};
        this.$onChanges = (changes) => {
          if (changes.param) {
            if (!changes.param.currentValue) return;
            var param = angular.merge({}, changes.param.currentValue);
            param.api = post.api = angular.merge({}, theDefault.api, param.api)
            if (!angular.equals(old_param, param)) {
              old_param = angular.merge({}, param);
              theData.loadData($scope.param = param);
            }
          }
        }

        $scope.clickImg = (imgs, active) => {
          $http.post("翻译资源", { urls: imgs }).then(json => {
            var imgs = json.datas.urls;
            DjPop.gallery({
              param: {
                imgs,
                active,
                //btns: [{ css: "fa fa-trash-o text-visited", fn: this.deleteImg }]
              }
            });
          });
        };
      }).call(this);

      /** 数据 */
      $scope.user = {};
      var theData = $scope.theData = {
        activeItem: false,
        loadData: function (param) {

          $scope.form = param.form || theDefault.form;
          if (!$scope.form.css) $scope.form.css = theDefault.form_css;

          /** 个人信息 */
          var ajax_me = post("user", "me", {}).then(json => {
            $scope.me = json.datas;
            /** 我的头像呢称等，确保即使自己未发贴，在发贴回帖点赞之后，也有信息 */
            var my_uid = json.datas.uid;
            $scope.user = $scope.user || {};
            $scope.user[my_uid] = $scope.user[my_uid] || {};
            $scope.user[my_uid].headimgurl = json.datas.wx.headimgurl;
            $scope.user[my_uid].nickname = json.datas.wx.nickname;
          }).catch(e => {
            console.log('请求me, e=', e);
          });

          /** 主贴列表，及相关用户信息 */
          post("comment", "li", { count: 10 }).then(json => {
            var all_item = json.datas.list || [];
            // 主贴
            var publish = $scope.items = all_item.filter(item => item.type == 'publish' && item.attr && (item.attr.content || item.attr.pics));
            publish.map(publish_item => {
              // 赞列表
              publish_item.praise = all_item
                .filter(item => item.type == 'praise' && item.cid == publish_item.id)
                .map(item => item.uid);
              // 回复列表
              publish_item.feedback = all_item
                .filter(item => item.type == 'feedback' && item.cid == publish_item.id && item.attr && (item.attr.content || item.attr.pics));
            });

            // 我赞了没有
            $q.when(ajax_me).then(() => {
              publish.map(publish_item => {
                publish_item.i_praised = !!publish_item.praise.find(uid => uid == $scope.me.uid);
              });
            })

            // 用户
            var uids = [];
            all_item.map(item => {
              if (uids.indexOf(item.uid) < 0) {
                uids.push(item.uid);
              }
            });
            post("user", "getWxInfo", { uids }).then(json => {
              $scope.user = $scope.user || {};
              json.datas.list.map(user => {
                $scope.user[user.uid] = user;
              });
            }).catch(e => {
              console.log('请求用户, e=', e);
            });
          }).catch(e => {
            console.log('获取列表失败, 使用测试数据');
            $scope.items = [];
          })
        },
      };


      /** 回复菜单 */
      !(function () {
        var boxOpening = false;
        var boxOpened = false;
        var itemOpened = false;
        $scope.showFeedbackMenu = (event, item, fuid) => {
          itemOpened = item;
          var when_closed;
          /** 关闭菜单 */
          if (close.closing) {
            when_closed = $q.when(close.closing).then(() => {
              close(boxOpened);
            });
          }
          else {
            close(boxOpened);
          }
          var box = angular.element(event.target).parent()[0].querySelector(".btn-feedback-menu");
          if (box === boxOpened) return;
          open(box, when_closed);
        }
        function onClose(event) {
          /** 检查是否点击菜单 */
          if (event) {
            var btn = angular.element(event.target);
            if (!btn.attr("ac")) btn = btn.parent();
            if (!btn.attr("ac")) btn = btn.parent();
            if (btn.attr("ac") == "praise") {
              $scope.praise(event, itemOpened);
            }
            if (btn.attr("ac") == "unpraise") {
              $scope.unpraise(event, itemOpened);
            }
            if (btn.attr("ac") == "feedback") {
              $scope.openFeedback(event, itemOpened);
            }
          }

          /** 关闭菜单 */
          if (close.closing) {
            $q.when(close.closing).then(onClose);
          }
          else {
            setTimeout(() => {
              close(boxOpened);
            });
          }
        }
        /** 点击任意关闭 */
        function open(box, when_closed) {
          $q.when(when_closed).then(() => {
            document.addEventListener("mousedown", onClose);
            document.addEventListener("touchstart", onClose);
          })
          var animator = $animateCss(angular.element(box), {
            from: { width: "0" },
            to: { width: "11em" },
            easing: 'ease',
            duration: 0.3 // 秒
          });
          animator.start().then(() => {
            boxOpened = box;
            boxOpening = false;
          });
          boxOpening = box;
        }
        function close(box) {
          document.removeEventListener("mousedown", onClose);
          document.removeEventListener("touchstart", onClose);
          if (!box) return $q.when(1);
          var animator = $animateCss(angular.element(box), {
            from: { width: "11em" },
            to: { width: "0" },
            easing: 'ease',
            duration: 0.3 // 秒
          });
          var defer = $q.defer();
          close.closing = defer.promise;
          animator.start().then((e) => {
            boxOpened = false;
            if (close.closing) {
              defer.resolve("1");
              close.closing = false;
            }
          });
          setTimeout(() => {
            boxOpened = false;
            if (close.closing) {
              defer.resolve("1");
              close.closing = false;
            }
          }, 320);
        };
      }).call(this);


      /** 回贴 */
      !(function () {
        $scope.openFeedback = (event, item, fuid) => {
          function openOnMouseup() {
            document.removeEventListener("mouseup", openOnMouseup);
            document.removeEventListener("touchend", openOnMouseup);
            setTimeout(() => {
              DjPop.show("dj-comment-feedback", {
                param: {
                  param: {
                    me: $scope.me,
                    user: $scope.user,
                    item,
                    fuid,
                    post,
                  }
                }
              });
            });
          }
          document.addEventListener("mouseup", openOnMouseup);
          document.addEventListener("touchend", openOnMouseup);
        };
      }).call(this);

      /** 赞 */
      !(function () {
        function do_praise(praiseType, item) {
          post("comment", praiseType, { cid: item.id }).then(json => {
            item.praise = item.praise.filter(uid => uid != $scope.me.uid);
            item.i_praised = praiseType == "praise";
            if (praiseType == "praise") {
              item.praise.push($scope.me.uid);
              item.i_praised = true;
            }
          }).catch(e => {
            console.log('赞, e=', e);
          });
        };
        $scope.praise = (event, item) => { do_praise("praise", item); };
        $scope.unpraise = (event, item) => { do_praise("unpraise", item); };
      }).call(this);

      /** 发贴 / 删贴 */
      !(function () {

        // 删贴
        $scope.deleteComment = (item) => {
          $http.post("显示对话框/confirm", { body: "删除后，本贴及其回帖和点赞均不可恢复。确认？", title: "删除前，请确认：" }).then(json => {
            post("comment", "remove", { id: item.id }).then(json => {
              $scope.items = $scope.items.filter(row => row.id != item.id);
            })
          });
        };

        // 发贴
        $scope.openPublist = () => {
          DjPop.show("dj-comment-publish", {
            param: {
              param: {
                me: $scope.me,
                user: $scope.user,
                form: $scope.form,
                post,
              }
            }
          }).then(result => {
            if (result.ac == "submit") {
              post("comment", "add", { data: result.value }).then(json => {
                // 添加到列表
                $scope.items.push({
                  id: json.datas.id,
                  uid: $scope.me.uid,
                  t_update: json.datas.t_update || (0.001 * new Date()),
                  type: "publish", // 这个属性可以不要
                  praise: [],
                  feedback: [],
                  attr: result.value
                });
              }).catch(e => {
                console.log('发贴, e=', e);
              });
            }
            console.log("关闭", e)
          });
        }
      }).call(this);
    }]
  });


  /**
   * 评论内容组件
   *
   * @param user: 所有相关的用户信息，包括头像呢称等
   * @param item: 评论内容
   * @param contentbody: 评论模板
   */
  theModule.component('djCommentItem', {
    bindings: {
      form: '<',
      user: '<',
      item: '<',
      contentbody: '<',
    },
    template: `
    <div class="flex user-info">
      <div class="name">{{$ctrl.user[$ctrl.item.uid].nickname}}</div>
      <div class="level">{{$ctrl.user[$ctrl.item.uid].level}}</div>
    </div>
    <div class="content-box transclude-content"></div>
    `,
    controller: ["$scope", "$element", "$compile", "$timeout", function ($scope, $element, $compile, $timeout) {
      this.$onChanges = (changes) => {
        if (changes.item) $scope.item = changes.item.currentValue;
        if (changes.user) $scope.user = changes.user.currentValue;
        if (changes.contentbody) {
          //console.log("$scope.$id =", $scope.$id, "模板:", changes.contentbody.currentValue);
          compileContent(changes.contentbody.currentValue);
          //if (!changes.contentbody.currentValue) return;
        }
      };

      /** 编译内容 */
      var defaultTemplate = `
      <div class="content {{more_content&&' ' ||' more'}}" ng-click="more_content = 1">{{$ctrl.item.attr.content}}</div>
      <div class="imgs flex flex-left flex-wrap" ng-if="$ctrl.item.attr.pics.length">
        <img ng-src="{{url|assert:90}}" ng-click="clickImg($ctrl.item.attr.pics, $index)" ng-repeat="url in $ctrl.item.attr.pics track by $index">
      </div>
      `;
      var defaultTemplate = `
      <dj-form
        mode="'show'"
        configs="$ctrl.form"
        init-values="item.attr"
      ></dj-form-show>
      `;
      function compileContent(str) {
        $timeout(function () {
          //console.log("编译，$scope.$id =", $scope.$id);
          var contentbody = str || defaultTemplate;
          var ele = $compile(contentbody)($scope);
          //ele = [].filter.call(ele, a => a.tagName)
          var contentBlock = $element.find('.transclude-content');
          contentBlock.html(ele);
        });
      }
    }]
  });



})(window, angular);