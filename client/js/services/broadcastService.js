(function (ng) {
    var broadcastSrvc = function ($resource) {
        return $resource('/api/broadcasts/:id', {id: "@_id" }, {
                query: {
                    method: 'GET',
                    isArray: true
                },
                update: {
                    method: "PUT"
                }
            });
    };
    var app = ng.module("appDbc.services.BroadcastSrvc", []);
    app.service("BroadcastSrvc", [ "$resource", broadcastSrvc]);
})
(angular);