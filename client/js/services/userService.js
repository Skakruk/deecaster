(function (ng) {
    var userService = function ($resource) {
        return $resource('/api/user/:id', null, {
            login: {
                method: 'POST',
                url: '/api/user/login'
            }
        });
    };
    var app = ng.module("appDbc.services.UserService", []);
    app.service("UserService", ["$resource", userService]);
})(angular);