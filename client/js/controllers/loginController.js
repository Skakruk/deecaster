(function (ng) {
    var loginCtrl = function($rootScope, $localStorage, DeezerFactory, UserService){
        var self = this;
        self.login = function() {
            DZ.login(function (loginResponse) {
                DeezerFactory.api('/user/me').then(function(response) {
                    $rootScope.user_data = {
                        "access_token": loginResponse.authResponse.accessToken,
                        "user_id": parseInt(loginResponse.userID)
                    };

                    UserService.login($rootScope.user_data, function (user) {
                        $localStorage.token = user.token;
                    });
                });

            });
            $rootScope.token = $localStorage.token;
        }
    };
    var app = ng.module("appDbc.controllers.LoginCtrl", []);
    app.controller("LoginCtrl", ["$rootScope", "$localStorage", "deezer", "UserService",  loginCtrl]);
})(angular);