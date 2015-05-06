(function (ng) {
    var loginCtrl = function($rootScope, DeezerFactory){
        var self = this;

    };
    var app = ng.module("appDbc.controllers.PlayerCtrl", []);
    app.controller("PlayerCtrl", ["$rootScope", "deezer", loginCtrl]);
})(angular);