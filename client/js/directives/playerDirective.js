(function (ng) {
    var PlayerMain = function ($rootScope, socket, deezer) {
        var self = this;
        return {
            restrict: "A",
            templateUrl: "/js/templates/player.html",
            controller: "PlayerMainCtrl",
            link: function (scope, element, attr, ngCtrl) {
                scope.tracklist = [];
                scope.comingNext = {};
                scope.volumeTool = "here will be volume ";
                deezer.initPlayer({
                    player: {
                        onload: function () {
                            DZ.player.setVolume(1);
                            DZ.Event.subscribe('current_track', function (arg) {
                                scope.$apply(function() {
                                    var tracklist = $rootScope.listeningTo && $rootScope.listeningTo.tracklist ||
                                        $rootScope.broadcasting && $rootScope.broadcasting.tracklist;
                                    scope.currentTrack = _.find(tracklist, {id: +arg.track.id});
                                    scope.currentTrack.secIn1Percent = arg.track.duration / 100;
                                    ngCtrl.emitTrackChange(arg);
                                });
                            });
                            DZ.Event.subscribe("player_position", function(arg){
                                scope.$apply(function(){
                                    if(scope.currentTrack.currentTime !== Math.ceil(arg[0])){
                                        scope.currentTrack.currentTime = Math.ceil(arg[0]);
                                        scope.currentTrack.progress = arg[0] / arg[1] * 100;
                                    }
                                });
                            });
                        }
                    }
                });
                scope.skip = function () {
                    scope.forceSkip = true;
                    DZ.player.next();
                };
            }
        }
    };
    var PlayerMainCtrl = function ($rootScope, $scope, socket, deezer) {
        var self = this;
        var lastPositions = 0;
        $scope.currentTrack = {};
        $scope.forceSkip = false;
        function formatTrack(inputTrack){
            return {
                album: _.pick(inputTrack.album, ["title", "id", "cover"]),
                artist: _.pick(inputTrack.artist, ["name", "id"]),
                title: inputTrack.title,
                duration: inputTrack.duration,
                id: inputTrack.id
            }
        }
        self.updateTracks = function (tracks) {
            $scope.tracklist.push(tracks.currentTrack);
            $scope.nextTrack = tracks.nextTrack;
        };
        $rootScope.$on("tracklistChange", function (e, tracks) {
            self.updateTracks(tracks)
        });
        socket.on("track changed", function (response) {
            if ($rootScope.listeningTo && $rootScope.listeningTo._id === response.broadcastId && $rootScope.listeningTo.synced) {
                $rootScope.listeningTo.tracklist.push(response.currentTrack.id, response.nextTrack.id)
                DZ.player.addToQueue([response.currentTrack.id, response.nextTrack.id]);
                console.log(response.forceSkip, DZ.player);
                if(response.forceSkip){
                    DZ.player.next();
                }
                self.updateTracks(response);
            }
        });
        socket.on("user join broadcast", function(response){
            if($rootScope.broadcasting && $rootScope.broadcasting._id === response.broadcastId){
                var trackIndex = DZ.player.getCurrentIndex();
                socket.emit("sync player position", {
                    broadcastId: response.broadcastId,
                    currentTrack: formatTrack($rootScope.broadcasting.tracklist[trackIndex]),
                    nextTrack:  formatTrack($rootScope.broadcasting.tracklist[trackIndex + 1]),
                    position: $scope.currentTrack.progress
                })
            }
        });
        socket.on("sync player position", function (response) {
            if ($rootScope.listeningTo && $rootScope.listeningTo._id === response.broadcastId && !$rootScope.listeningTo.synced) {
                $rootScope.listeningTo.tracklist.push(response.currentTrack.id, response.nextTrack.id);
                DZ.player.playTracks([response.currentTrack.id, response.nextTrack.id], 0, response.position);
                self.updateTracks({
                    currentTrack: response.currentTrack,
                    nextTrack: response.nextTrack
                });
                $rootScope.listeningTo.synced = true;
            }
        });
        $rootScope.$on("user left broadcast", function(){
            DZ.player.pause();
        });
        self.emitPlayerPosition = function(track, pos){
            if ($rootScope.broadcasting && (Math.ceil(pos) % 3) === 0 && lastPositions !== Math.ceil(pos)) {
                socket.emit("player position", {
                    broadcastId: $rootScope.broadcasting._id,
                    track: track,
                    position: pos
                });
                lastPositions = Math.ceil(pos);
            }
        };
        self.emitTrackChange = function (arg) {
            if ($rootScope.broadcasting) {
                var currentTrack = formatTrack($rootScope.broadcasting.tracklist[arg.index]);
                var nextTrack = {};
                if($rootScope.broadcasting.tracklist.length > 1)
                    nextTrack = formatTrack($rootScope.broadcasting.tracklist[arg.index + 1]);
                socket.emit("track changed", {
                    forceSkip: $scope.forceSkip,
                    broadcastId: $rootScope.broadcasting._id,
                    currentTrack: currentTrack,
                    nextTrack: nextTrack
                });
                self.updateTracks({
                    currentTrack: currentTrack,
                    nextTrack: nextTrack
                });
                $rootScope.broadcasting.currentIndex = arg.index;
                $scope.forceSkip = false;
            }
        }
    };
    var app = ng.module("appDbc.directives.playerMain", []);
    app.controller("PlayerMainCtrl", ["$rootScope", "$scope", "dbcSocket", "deezer", PlayerMainCtrl]);
    app.directive("playerMain", ["$rootScope", "dbcSocket", "deezer", PlayerMain]);
})(angular);
