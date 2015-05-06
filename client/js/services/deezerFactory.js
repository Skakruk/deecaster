angular.module("skakruk.deezer", [])
    .provider("$deezer", function(){
        /**
         * Application id form developers.deezer.com
         */
        var appID;

        /**
         * Channel url
         */
        var channelUrl;

        this.setAppId = function(str){
            appID = str;
        };
        this.setChannelUrl = function(url){
            channelUrl = url;
        };

        /**
         *  Init deezer sdk
         */
        this.$get = [function(){
            DZ.init({
                appId       : appID,
                channelUrl  : channelUrl
            });
        }];
    })
    .factory("deezer", ['$deezer', '$http', "$location", '$rootScope', '$q',
        function($deezer, $http, $location, $rootScope, $q){

            /**
             *  Init promise
             */
            var def = $q.defer();

            /**
             * Check login status wrap of DZ.getLoginStatus
             */
            var getLoginStatus = function(logged, unlogged){
                DZ.getLoginStatus(function(response){
                    if (response.authResponse != null) {
                        logged(response);
                    }
                    else {
                        unlogged(response);
                    }
                });
            };

            /**
             *  Init player
             */
            var initPlayer = function(obj){
                DZ.init(obj);
            };

            /**
             * Login into application
             * @var callback function
             */
            var login = function(callback){
                DZ.login(function(response){
                    if (response.authResponse != null) {
                        callback(response);
                    }
                }, {perms: 'basic_access,email'});

            };

            /**
             * Wrap of DZ.logout
             */
            var logout = function(callback){
                DZ.logout(callback);
            };

            /**
             * Wrap to DZ.api
             * @var url string
             * @return promise
             */
            var api = function(url){
                var def = $q.defer();
                DZ.api(url, function(response){
                    def.resolve(response)
                });
                return def.promise;
            };

            return {
                login: login,
                logout: logout,
                initPlayer: initPlayer,
                getLoginStatus: getLoginStatus,
                api: api
            };
        }]);
