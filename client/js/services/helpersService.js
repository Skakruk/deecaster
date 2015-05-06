(function (ng) {
    var secondsToTime = function () {
        return function (item) {
            var isNegative = false;
            if (isNaN(item)) {
                return item;
            } else if (item < 0) {
                isNegative = true;
                item = Math.abs(item);
            }
            var days = Math.floor(item / 86400);
            item %= 86400;
            var hours = Math.floor(item / 3600);
            item %= 3600;
            var minutes = Math.floor(item / 60);
            var seconds = (item % 60).toFixed(0);
            if (seconds < 10) {
                seconds = '0' + seconds;
            }
            var res = hours ? (hours + ':' + ('0' + minutes).slice(-2) + ':' + seconds) : (minutes + ':' + seconds);
            if (days) {
                res = days + '.' + res;
            }
            return (isNegative ? ('-' + res) : res);
        };
    };
    var app = ng.module("appDbc.services.helpers", []);
    app.filter("secondsToTime", secondsToTime);
})
(angular);
