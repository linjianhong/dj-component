!(function (window, angular, undefined) {

  angular.module('dj-ui').factory("IMG", ["$q", function ($q) {

    var maxsize = 2e5; // 200K以下文件，直接上传

    /**
     * 上传二进制对象
     * 返回一个承诺，该承诺支持上传进度通知
     */
    function upload(url, file, data, key) {
      var formData = getFormData();

      if (data) {
        for (var prop in data) {
          if (data.hasOwnProperty(prop)) {
            formData.append(prop, data[prop]);
          }
        }
      }
      return getOrientation(file).then(orientation=>{
        //alert("orientation=" + orientation);
        //console.log("原图旋转:", orientation)
        return fileToBlob(file, orientation).then(function (blob) {
          formData.append(key || 'file', blob, file.name);
          return post(url, formData)
        })
      }).catch(e=>{
        console.log("getOrientation ERROR:", e)
        return $q.reject(e);
      });
    }
    return {
      upload: upload
    }
    /**
     * post提交
     * 返回一个承诺，该承诺支持上传进度通知
     */
    function post(url, formData) {
      var deferred = $q.defer();
      var xhr = new window.XMLHttpRequest();

      xhr.open('post', url);

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          var status = xhr.status;
          if (status >= 200 && status < 300) {
            var json = JSON.parse(xhr.responseText);
            deferred.resolve(json);
          } else {
            deferred.reject(xhr);
          }
        }
      };

      //数据发送进度
      xhr.upload.onprogress = function (e) {
        deferred.notify(e);
      };

      xhr.send(formData);
      return deferred.promise;
    }

    /**
     * 将图片文件转换为 blob
     * 当文件较小时，就是文件本身，较大时，为压缩过的数据
     * @return 承诺，兑现内容为可上传的数据
     */
    function fileToBlob(file, orientation) {
      if (!/\/(?:jpeg|png|gif|bmp)/i.test(file.type)) return $q.reject('不支持的图片格式');

      var deferred = $q.defer();
      var reader = new FileReader();

      reader.onload = function (event) {
        var result = this.result;
        //console.log('图片大小', result.length);

        //如果图片大小小于200kb，则直接上传
        if (result.length <= maxsize) {
          //console.log('不压缩', result.length);
          deferred.resolve(file);
          return;
        }

        var img = new Image();
        img.src = result;

        //图片加载完毕之后进行压缩，然后上传
        if (img.complete) {
          callback();
        } else {
          img.onload = callback;
        }

        function callback() {
          var data = compressImgToDataURL(img, orientation);
          var blob = dataURItoBlob(data);
          //console.log("压缩后：blob = ", blob);

          img = null;
          deferred.resolve(blob);
        }
      };

      reader.readAsDataURL(file);
      return deferred.promise;
    }
    /**
     * 压缩图片, 返回 toDataURL 数据
     */
    function compressImgToDataURL(img, orientation) {
      var initSize = img.src.length;
      var width = img.width;
      var height = img.height;

      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");

      //如果图片大于三百万像素, 计算压缩比并将大小压至400万以下
      var ratio = width * height / 3e6;
      if (ratio > 1) {
        ratio = Math.sqrt(ratio);
        width /= ratio;
        height /= ratio;
      } else {
        ratio = 1;
      }

      canvas.width = width;
      canvas.height = height;

      // 铺底色
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 如果图片像素大于100万则使用瓦片绘制
      var count = width * height / 1e6;
      if (count > 1) {
        count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片

        // 计算每块瓦片的宽和高
        var nw = ~~(width / count);
        var nh = ~~(height / count);

        var tCanvas = document.createElement("canvas");
        var tctx = tCanvas.getContext("2d");

        tCanvas.width = nw;
        tCanvas.height = nh;

        for (var i = 0; i < count; i++) {
          for (var j = 0; j < count; j++) {
            tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);

            ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
          }
        }
        tCanvas.width = tCanvas.height = 0;
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }


      //旋转 镜像
      var ndata = getGoodOrientationDataURL(orientation, canvas, width, height);
      canvas.width = canvas.height = 0;

      //console.log("压缩前：" + initSize);
      //console.log("压缩后：", ndata.length, "尺寸：", width, height);
      //console.log("压缩率：" + ~~(100 * (initSize - ndata.length) / initSize) + "%");

      return ndata;
    }

    /** 获取图像正确旋转图像后的数据 */
    function getGoodOrientationDataURL(orientation, canvas, width, height){
      if (orientation < 1 || orientation > 8){
        return canvas.toDataURL("image/jpeg", 0.2);
      }
      //旋转 镜像
      var canvas3 = document.createElement("canvas");
      var ctx3 = canvas3.getContext("2d");
      execOrientation(orientation, canvas3, ctx3, canvas, width, height);

      //进行压缩
      var ndata = canvas3.toDataURL("image/jpeg", 0.2);
      canvas3.width = canvas3.height = 0;

      return ndata;
    }
    function execOrientation(orientation, canvas3, ctx3, source, width, height) {
      if (orientation < 1 || orientation > 8) return;
      var x, y, n = orientation, rotate = orientation > 4;
      if (rotate) n = 9 - n;
      n = n - 1;
      var scalex = [1, -1, -1, 1][n];
      var scaley = [1, 1, -1, -1][n];
      //console.log("变换", scalex, scaley);
      x = -width / 2;
      y = -height / 2;

      if (rotate) {
        //console.log("要旋转");
        canvas3.width = height;
        canvas3.height = width;
        ctx3.translate(-y, -x);
        ctx3.rotate(Math.PI * 1.5);
      } else {
        canvas3.width = width;
        canvas3.height = height;
        ctx3.translate(-x, -y);
      }
      ctx3.scale(scalex, scaley);
      ctx3.drawImage(source, 0, 0, width, height, x, y, width, height);
    }

    /**
     * 将 toDataURL 数据转换为二进制数据，以便上传
     * 该返回值可以塞进表单中，进行post提交，后端处理同普通的文件上传:
          var formdata = getFormData();
          formdata.append('imagefile', blob);
     */
    function dataURItoBlob(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      var subDataURI = dataURI.split(',');
      if (subDataURI[0].indexOf('base64') >= 0)
        byteString = atob(subDataURI[1]);
      else
        byteString = unescape(subDataURI[1]);

      // separate out the mime component
      var mimeString = subDataURI[0].split(':')[1].split(';')[0];

      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // return new Blob([ia], { type: mimeString }); // 未兼容的写法
      return new getBlob([ia], mimeString);
    }

    /**
     * 获取 blob 对象的兼容性写法
     */
    function getBlob(buffer, format) {
      try {
        return new Blob(buffer, { type: format });
      } catch (e) {
        var bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder);
        buffer.forEach(function (buf) {
          bb.append(buf);
        });
        return bb.getBlob(format);
      }
    }

    /**
     * 获取 formdata 的兼容性写法
     */
    function getFormData() {
      var isNeedShim = ~navigator.userAgent.indexOf('Android')
        && ~navigator.vendor.indexOf('Google')
        && !~navigator.userAgent.indexOf('Chrome')
        && navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 534;

      return isNeedShim ? new FormDataShim() : new FormData()
    }

    /**
     * 获取图像旋转
     * @returns
     * -2: not jpeg
     * -1: not defined
     *
     * 1: 正常
     * 2: 原图是(左右镜像)
     * 3: 原图是(左右镜像, 上下镜像)
     * 4: 原图是(上下镜像)
     * 5: 原图是(上下镜像, 90)
     * 6: 原图是(左右镜像, 上下镜像, 90)
     * 7: 原图是(左右镜像, 90)
     * 8: 原图是(90)
     */
    function getOrientation(file) {
      var deferred = $q.defer();
      var reader = new FileReader();
      reader.onload = function (e) {
        var view = new DataView(this.result);
        if (view.getUint16(0, false) != 0xFFD8) return deferred.resolve(-2);
        var length = view.byteLength, offset = 2;
        while (offset < length) {
          var marker = view.getUint16(offset, false);
          offset += 2;
          if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) return deferred.resolve(-1);
            var little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            var tags = view.getUint16(offset, little);
            offset += 2;
            for (var i = 0; i < tags; i++)
              if (view.getUint16(offset + (i * 12), little) == 0x0112)
                return deferred.resolve(view.getUint16(offset + (i * 12) + 8, little));
          }
          else if ((marker & 0xFF00) != 0xFF00) break;
          else offset += view.getUint16(offset, false);
        }
        return deferred.resolve(-1);
      };
      reader.readAsArrayBuffer(file);
      return deferred.promise;
    }


  }]);



})(window, angular);