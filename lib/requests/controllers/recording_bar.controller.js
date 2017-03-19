module.exports = function(app) {
    var _ = require('underscore');

    app.controller("RecordingBarController", ['$scope', '$rootScope', '$timeout', 'Recorder', function($scope, $rootScope, $timeout, Recorder) {

        var COUNT_FROM = 59;
        var timer;
        $scope.COUNTDOWN_NUMBER = COUNT_FROM + 1;
        $scope.COUNTDOWN = false;

        $scope.record_timeout = function() {
            $timeout(function() {
                decrementCounter();
            }, 0, true);
        }

        function decrementCounter() {

            if ($scope.COUNTDOWN_NUMBER == 0) {
							//if time limit is reached
                var sendRecording = confirm("Do you want to send your request?");
                if (sendRecording) {
                    $scope.doneRecording();
                } else {
                    $scope.cancelRecording();
                }
                $scope.COUNTDOWN = false;
                $scope.COUNTDOWN_NUMBER = COUNT_FROM + 1;
            } else {
                timer = $timeout(function() {
                    $scope.COUNTDOWN_NUMBER--;
                    decrementCounter();
                }, 1000);
            }
        }

        $scope.doneRecording = function() {
            $timeout.cancel(timer);
            $scope.COUNTDOWN_NUMBER = 60;
            $scope.uploading = true;
            Recorder.stop();

        };
        $scope.cancelRecording = function() {
            $timeout.cancel(timer);
            $scope.COUNTDOWN_NUMBER = 60;
            Recorder.cancel();

        };

    }]);
};
