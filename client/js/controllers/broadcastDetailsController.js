(function (ng) {
    var broadcastDetailsCtrl = function ($rootScope, BroadcastService, $stateParams, $modal, DeezerFactory, socket, ngAudio,$timeout ) {
        var self = this;
        self.bc = BroadcastService.get({id: $stateParams.id}, function () {
            self.bc.tracklist = [];
            self.isOwner = function () {
                return self.bc._creator._id === ($rootScope.user && $rootScope.user._id);
            };
        });
        socket.on("user join broadcast", function (response) {
            if (self.bc._id === response.broadcastId) {
                self.bc.listeners.push(response.listener);
            }
        });
        socket.on("user left broadcast", function (response) {
            if (self.bc._id === response.broadcastId) {
                self.bc.listeners = _.without(self.bc.listeners, response.listener);
            }
        });
        $rootScope.$watch("broadcasting.tracklist", function(){
            console.log($rootScope.broadcasting.tracklist)
        })
        self.listeningToThisBC = function () {
            return self.bc === $rootScope.listeningTo;
        };
        self.join = function () {
            socket.emit("user join broadcast", {
                broadcastId: self.bc._id,
                listener: $rootScope.user
            });
            self.bc.listeners.push($rootScope.user);
            $rootScope.listeningTo = self.bc;
            $rootScope.listeningTo.synced = false;
            DZ.player.playTracks([self.bc.currentTrack.id, self.bc.nextTrack.id]);
        };
        self.left = function () {
            self.bc.listeners = _.without(self.bc.listeners, $rootScope.user);
            socket.emit("user left broadcast", {
                broadcastId: self.bc._id,
                listener: $rootScope.user
            });
            $rootScope.$emit("user left broadcast");
            delete $rootScope.listeningTo;
        };
        self.startBC = function () {
            $rootScope.broadcasting = self.bc;
            self.bc.isActive = true;
            self.bc.$update();
            DZ.player.playTracks(_.map(self.bc.tracklist, function (track) {
                return track.id;
            }));
            $rootScope.$emit("tracklistChange", {
                currentTrack: self.bc.tracklist[0],
                nextTrack: self.bc.tracklist[1]
            });
        };
        self.openAddPlaylistModal = function () {
            var modalInstance = $modal.open({
                templateUrl: '/js/templates/addTracksFromPlaylist.html',
                controller: 'AddTracksBCModalInstanceCtrl'
            });
            modalInstance.result.then(function (selectedTracks) {
                self.bc.tracklist = self.bc.tracklist.concat(selectedTracks);
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };
        self.searchTracks = function (val) {
            self.loadingTracks = true;
            DeezerFactory.api("/search?q=" + val)
                .then(function (result) {
                    self.loadingTracks = false;
                    self.foundTracks = result.data;
                });
        };
        self.clearSearch = function(){
            self.searchTrack = '';
            self.foundTracks = [];
        };
        self.trackPreview = function (track) {
            self.foundTracks.forEach(function(ftrack){
                if(ftrack !== track)
                    ftrack.audio && ftrack.audio.pause();
            });
            if(!track.audio){
                track.audio = ngAudio.play(track.preview);
            }else{
                track.audio.paused ? track.audio.play() : track.audio.pause();
            }

        };

        self.addToQueue = function(track){
            self.bc.tracklist.push(track);
        }
    };
    var AddTracksBCModalInstanceCtrl = function ($scope, $modalInstance, deezerFactory) {
        $scope.toggleState = true;
        deezerFactory.api("user/me/playlists").then(function (dzPlaylists) {
            $scope.playlists = dzPlaylists.data;
        });
        $scope.selectPlaylist = function (playlist) {
            $scope.selectedPlaylist = playlist;
            deezerFactory.api("playlist/" + $scope.selectedPlaylist.id + "/tracks").then(function (dzTracks) {
                $scope.selectedPlaylist.tracks = dzTracks.data;
                $scope.selectedPlaylist.tracks.forEach(function (track) {
                    track.checked = $scope.toggleState;
                })
            });
        };
        $scope.$watch(function () {
            return $scope.toggleState;
        }, function () {
            if ($scope.selectedPlaylist && $scope.selectedPlaylist.tracks) {
                $scope.selectedPlaylist.tracks.forEach(function (track) {
                    track.checked = $scope.toggleState;
                })
            }

        });
        $scope.selectAnother = function () {
            delete $scope.selectedPlaylist;
        };
        $scope.addTracksToQueue = function () {
            $modalInstance.close(_.where($scope.selectedPlaylist.tracks, {checked: true}));
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    var app = ng.module("appDbc.controllers.BroadcastDetailsCtrl", []);
    app.controller("AddTracksBCModalInstanceCtrl", ["$scope", "$modalInstance", "deezer", AddTracksBCModalInstanceCtrl]);
    app.controller("BroadcastDetailsCtrl", ["$rootScope", "BroadcastSrvc", "$stateParams", "$modal", "deezer", "dbcSocket", "ngAudio", "$timeout", broadcastDetailsCtrl]);
})(angular);