(function (ng) {
    'use strict';

    var app = ng.module('appDbc', [
        'mm.foundation',
        'btford.socket-io',
        'skakruk.deezer',
        "appDbc.controllers",
        "appDbc.directives",
        "appDbc.services",
        'angular-lodash',
        'ui.router',
        "ngResource",
        "ngStorage",
        'ngAudio'
    ])
        .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
            $urlRouterProvider.otherwise("/broadcasts");
            //
            // Now set up the states
            $stateProvider
                .state('broadcasts', {
                    url: "/broadcasts",
                    templateUrl: "/js/templates/broadcasts.html",
                    controller: "BroadcastCtrl as bctrl"
                })
                .state('broadcast', {
                    url: "/broadcasts/:id",
                    templateUrl: "/js/templates/broadcastDetails.html",
                    controller: "BroadcastDetailsCtrl as bdet"
                })
                .state('broadcasts.create', {
                    views: {
                        modal: {
                            url: "/create",
                            templateUrl: "/js/templates/createBroadcast.html",
                            controller: "BroadcastCtrl as bctrl"
                        }
                    }
                })
                .state('login', {
                    url: "/login",
                    templateUrl: "partials/state2.html"
                })
                .state('state2.list', {
                    url: "/list",
                    templateUrl: "partials/state2.list.html",
                    controller: function ($scope) {
                        $scope.things = ["A", "Set", "Of", "Things"];
                    }
                });

            $httpProvider.interceptors.push(['$q', '$location', '$localStorage', function($q, $location, $localStorage) {
                return {
                    'request': function (config) {
                        config.headers = config.headers || {};
                        if ($localStorage.token) {
                            config.headers.Authorization = 'Bearer ' + $localStorage.token;
                        }
                        return config;
                    },
                    'responseError': function(response) {
                        if(response.status === 401 || response.status === 403) {
                            $location.path('/signin');
                        }
                        return $q.reject(response);
                    }
                };
            }]);
        })
        .config(function myAppConfig($deezerProvider) {
            // Init provider configuration
            $deezerProvider.setChannelUrl("http://deecaster.dev/channel.html");
            $deezerProvider.setAppId("156741");
        })
        .run(['deezer', '$rootScope', '$state', "UserService", "dbcSocket", "socketFactory", function run(DeezerFactory, $rootScope, $state, UserService, dbcSocket, socketFactory) {
            //Check if I'm already logged
            UserService.get(function(user){
                DZ.getLoginStatus(function(dzUser){
                    $rootScope.$apply(function(){
                        if(dzUser.status === "connected"){
                            $rootScope.user_data = {
                                "access_token": dzUser.authResponse.accessToken,
                                "user_id": parseInt(dzUser.userID)
                            };
                            $rootScope.user = user;
                            dbcSocket.emit('authenticate', {token: user.token});
                        }
                    });
                });
            });

        }])
        .factory('dbcSocket', ['$rootScope', 'socketFactory', function ($rootScope, socketFactory) {
            return socketFactory();
        }]);

})(angular);