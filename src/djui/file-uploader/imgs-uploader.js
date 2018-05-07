(function () {

  angular.module('dj-ui')
    .filter('preview', function () { //可以注入依赖
      return function (url, width, height) {
        return url;
      }
    })
    .directive("multiFileUpload", function () {
      return {
        controller: ['$scope', '$element', function ($scope, $element) {
          $element.bind("change", function (e) {
            // console.log('有文件');
            $scope.change && $scope.change({ $files: e.target.files });
          });
        }],
        scope: {
          change: "&"
        }
      }
    })
    .component('imgsUploader', {
      template: `
        <div class="weui-uploader">
          <div class="weui-uploader__bd">
            <ul class="weui-uploader__files">
              <li class="weui-uploader__file preview-box" ng-click="clickImg($index)" ng-repeat='img in imgList track by $index'>
                <img ng-src="{{img|preview}}" />
              </li>
              <li class="weui-uploader__file weui-uploader__file_status" ng-repeat='file in File.uploadingFiles track by $index'>
                <div class="weui-uploader__file-content">{{file.per}}%</div>
              </li>
              <div class="imgs-uploader-box weui-uploader__input-box" ng-if="mode!='show' && imgList.length < (maxCount||9)">
                <input type="file" multiple accept="image/*,video/mp4" multi-file-upload change="File.onFile($files)">
              </div>
            </ul>
          </div>
        </div>
      `,
      bindings: {
        appData: "<",
        maxCount: "<",
        imgs: "<",
        mode: '@',
        updateImg: "&" //选择图片更新用的回调函数
      },
      controller: ["$scope", "$http", "IMG", "DjPop", "DjDialog", ctrl]
    });

  function ctrl($scope, $http, IMG, DjPop, DjDialog) {
    var imgData = this.imgData = { uploadings: [] };
    $scope.imgList = [];
    this.countError = 0;
    this.$onInit = function () {
    }
    this.$onChanges = (changes) => {
      if (changes.imgs) {
        var imgs = changes.imgs.currentValue || [];
        $scope.imgList.splice(0, $scope.imgList.length);
        imgs.map(url => $scope.imgList.push(url));
      }
      if (changes.maxCount) {
        $scope.maxCount = +changes.maxCount.currentValue || 9;
      }
      if (changes.mode) {
        $scope.mode = changes.mode.currentValue || "";
      }
    }

    this.deleteImg = (n) => {
      if (n < 0 || n >= $scope.imgList.length) return;
      return DjDialog.confirm("您确认要删除当前图片?").then(a => {
        $scope.imgList.splice(n, 1);
        //console.log("删除加图片", $scope.imgList);
        this.updateImg({ imgs: $scope.imgList });
      });
    }
    $scope.clickImg = (n) => {
      //DjPop.show("show-gallery", {imgs: this.imgs, remove: this.deleteImg})
      DjPop.gallery({
        param: {
          imgs: $scope.imgList,
          active: n,
          btns: $scope.mode=="show"? []:[{ css: "fa fa-trash-o text-visited", fn: this.deleteImg }]
        }
      }).then(data => {
        //console.log("show-gallery", data);
      }).catch(data => {
        console.log("EEE", data);
      })
    }
    this.addImg = (fn) => {
      if ($scope.imgList.length >= $scope.maxCount) return;
      $scope.imgList.push(fn);
      //console.log("添加图片", $scope.imgList);
      this.updateImg({ imgs: $scope.imgList });
    };



    /**
     * 上传模块
     **/
    var self = this;
    $scope.imgPath = "https://pgytc.oss-cn-beijing.aliyuncs.com/cmoss/upload-img/";
    var File = $scope.File = {
      subTreeId: 0,
      uploadingFiles: [],

      /**
       * 文件选择事件
       **/
      onFile: function (files) {
        //console.log(files);
        if (!files) return;
        //console.info('添加文件', files);
        File.uploadingFiles = [];
        for (var i = 0; i < files.length; i++) {
          File.uploadingFiles.push(files[i]);
        }
        $scope.$apply();
        this.upload();
      },

      /**
       * 上传
       **/
      uploadFile: function (url, file, data) {
        IMG.upload(url, file, data).then(
          json => {
            //console.info('已上传, ', file, json);
            if (json.datas) {
              self.addImg(json.datas.url);
            }
            var n = File.uploadingFiles.indexOf(file);
            //console.info('删除已上传, ', n, file);
            File.uploadingFiles.splice(n, 1);
          },
          e => {
            //console.info('上传失败, ', file, e);
          },
          process => {
            //console.info('上传进度, ', file, process);
            file.per = (process.loaded / file.size * 80).toFixed(2);
            if (file.per > 100) file.per = 100;
          }
        )
      },

      /**
       * 上传
       **/
      upload: function () {
        var prePost
        $http.post("签名", "upload/img")
          .then(json => json.datas)
          .catch(e => {
            //console.log("准备上传图片，无签名！")
            return { url: "upload/img", data: {} };
          })
          .then(signed => {
            angular.forEach(File.uploadingFiles, file => {
              File.uploadFile(signed.url, file, signed.data);
            });
          })
      }
    }
  }

})();
