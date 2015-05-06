(function(ng){
    'use strict';

    ng.module('appDbc.services', [
        'appDbc.services.helpers',
        'appDbc.services.UserService',
        'appDbc.services.BroadcastSrvc']);
}(angular));