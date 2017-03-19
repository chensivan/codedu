module.exports = function(app, _parent) {
	var _ = require('underscore');

	app.controller("RequestPromptController", ['$scope','$rootScope','$timeout', function ($scope,$rootScope,$timeout) {

		var COUNT_FROM = 2;
		$scope.COUNTDOWN_NUMBER = COUNT_FROM+1;
		$scope.COUNTDOWN = false;
		$scope.isRecording = false;

		function closePrompt() {
			$timeout(function(){
				_parent.toggle($scope.requestTitle, $scope.requestTags);
			},0,false);
		}

		function decrementCounter() {
			if($scope.COUNTDOWN_NUMBER==0) {
				$scope.COUNTDOWN = false;
				$scope.COUNTDOWN_NUMBER = COUNT_FROM+1;
				$timeout(function () {
					_parent.closePrompt();
				}).then(function(){
					closePrompt();
					var sc = angular.element(document.querySelector('#recordingSpan')).scope();
					//start countdown for request
					sc.record_timeout();
				});
			} else {
				$timeout(function(){
					$scope.COUNTDOWN_NUMBER--;
					decrementCounter()
				}, 1000);
			}
		}

		$scope.tags = ["Featured", "HW 3", "Exam 1"];
		$scope.requestTags = [];

		$scope.startRecording = function() {
			$scope.COUNTDOWN = true;
			$scope.TEXTMODE = false;
			$scope.textRequestDescription = "";
			var sc = angular.element(document.querySelector('#recordingSpan')).scope();
			$timeout(function(){
				sc.$apply(function(){
					sc.uploading = false;
				})
			},0,false).then(function(){
				$timeout(function(){
					decrementCounter();
				},0,false);
			})
		};

		// triggers text request box
		$scope.textRecording = function() {
			//hide h2, hide start recording button
			// $scope.TEXTMODE = true
			$scope.textRequestDescription = ""
		};

		// submit text request
		$scope.textRequestSubmittion = function (){
			if($scope.requestTitle=='' || $scope.textRequestDescription == ""){
				alert('Please write something!')
				return
			}
			_parent.sendingTextDesc($scope.requestTitle,$scope.textRequestDescription,$scope.requestTags);
			// Show loading panel
			var recordingBarScope = angular.element(_parent.getElement()).scope();
			recordingBarScope.$apply(function() { recordingBarScope.uploading = true; });
			atom.workspace.getTopPanels()[0].show();
			//re-configure
			$scope.requestTitle = "";
			$scope.textRequestDescription = ""
			// $scope.TEXTMODE = false;
			$scope.COUNTDOWN = false;
			_parent.closePrompt();
		}

		// cancels codeon request title prompt
		$scope.cancelPrompt = function() {
			$scope.requestTitle = "";
			$scope.textRequestDescription = ""
			// $scope.TEXTMODE = false
			$scope.COUNTDOWN = false;
			var scope = angular.element(document.querySelector('#makeRequest')).scope();
			$timeout(function(){
				scope.$apply(function(){
					scope.reqSideBarButton = true;
				});
			},0,false);
			$timeout(function(){
				_parent.closePrompt();
			});
		};

		$scope.textCounter = function(field, countfield, maxlimit) {
		 if ( field.value.length > maxlimit ) {
		  field.value = field.value.substring( 0, maxlimit );
		  field.blur();
		  field.focus();
		  return false;
		 } else {
		  countfield.value = maxlimit - field.value.length;
		 }
		}



	}]);
};
