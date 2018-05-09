
  angular.module('dj-form')
  .filter('formFormat', function() { //可以注入依赖
    return function(str, format) {
      if(!angular.isString(format))return str;
      if(!angular.isString(str))str = "";
      return format.replace(/\{1\}/g, str);
    }
  });