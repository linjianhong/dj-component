/**
 * 数据等待类

   var dataNeedReady = new DjWaiteReaddy();

   ...

   dataNeedReady.ready(data =>{
     // this will run after dataNeedReady.resolve fun called.
     // data ready now!
   })

   ...

   dataNeedReady.resolve('这是备妥的数据！'); //

 */
!(function (window, angular, undefined) {

  var serviceModule = angular.module('dj-ui');

  serviceModule.factory('DjWaiteReady', ['$q', function ($q) {

    function DjWaiteReady(){
      this._isReady = false;
      this.deferred = $q.defer();
      this.promise = this.deferred.promise;
    }

    DjWaiteReady.prototype = {
      /**
       * 数据是否已备妥
       */
      get isReady(){
        return this._isReady;
      },
      /**
       * 通知数据已备妥。 首次调用时通知，以后，只更新数据
       * @param data 已备妥的数据
       */
      resolve: function(data){
        if(!this.isReady){
          this.deferred.resolve(data);
          this._isReady = true;
        }
        this.promise = data;
      },

      /**
       * 通知数据已备妥(拒绝)。 首次调用时通知，以后，只更新数据
       * @param data 已拒绝的原因
       */
      reject: function(reason){
        if(!this.isReady){
          this.deferred.reject(reason);
        }
        this._isReady = 'reject';
        this.promise = reason;
      },

      /**
       * 等待数据备妥承诺
       * @param func 兑现回调函数。承诺兑现时，调用本函数，并传递备妥的数据
       */
      ready: function(fn){
        if(this._isReady == 'reject'){
          return $q.reject(this.promise);
        }
        fn && $q.when(this.promise).then(fn);
        return $q.when(this.promise);
      }
    }

    return DjWaiteReady;
  }]);

})(window, angular);