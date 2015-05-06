(function (ng) {
    var broadcastCtrl = function($rootScope, BroadcastService, $state, $modal){
        var self = this;
        self.bc = new BroadcastService();
        self.tracklist = [];

        BroadcastService.query(function(response) {
            self.broadcasts = response;
        });

        self.openCreateBCModal = function(){
            var modalInstance = $modal.open({
                templateUrl: '/js/templates/createBroadcast.html',
                controller: 'CreateBCModalInstanceCtrl',
                resolve: {
                    bc: function () {
                        return self.bc;
                    }
                }
            });
            modalInstance.result.then(function (bc) {
                bc.$save(function(bc){
                    $state.go("broadcast", {id: bc._id})
                });
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };




    };
    var CreateBCModalInstanceCtrl = function ($scope, $modalInstance, bc) {
        $scope.bc = bc;
        $scope.create = function () {
            $modalInstance.close($scope.bc);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };


    var app = ng.module("appDbc.controllers.BroadcastCtrl", []);
    app.controller("CreateBCModalInstanceCtrl", ["$scope", "$modalInstance", "bc", CreateBCModalInstanceCtrl]);

    app.controller("BroadcastCtrl", ["$rootScope", "BroadcastSrvc", "$state", "$modal", broadcastCtrl]);
})(angular);