var Quill = require('quill')
// var mediumEditor = require("medium-editor")
var trix = require('angular-trix')
var trixx = require('trix')
var _ = require('underscore');
require('qtip')
var _ = require('underscore')
module.exports = function(app) {

  app.filter('showButtonOnce', function() {

    return function(items) {
      var item = [];
      for (var i = 0; i < items.length; i++) {
        var answer = items[i];
        if (answer.type == 'inlinecode' || answer.type == 'annotation') {

          item.push(items[i]);
          break;
        }
      }
      return item;
    }

  });

  app.filter('showMergeButton', function() {
    return function(items) {
      var item = [];
      for (var i = 0; i < items.length; i++) {
        var answer = items[i];
        if (answer.type == 'inlinecode' && answer.value != answer.original) {
          item.push(items[i]);
          break;
        }
      }
      return item;
    }

  });

  app.directive('qtip', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.qtip({
                    content: attrs.qtip,
                    style: {
                        classes: 'myRequestTooltipClass'
                    },
                    hide: {
                        event: (scope.closeButton == true ? "false" : "click mouseleave"),
                        delay: 0,
                        fixed: (($(this).hover || attrs.fixed) ? true : false), //prevent the tooltip from hiding when set to true
                        leave: false
                    }

                });
            },

        };
    });

  app.controller("HelperResponse", ['$scope', '$rootScope', 'QuestionManager', 'Slider', 'RequestReplayer', 'ResponseManager', function($scope, $rootScope, QuestionManager, Slider, RequestReplayer,ResponseManager) {
    $scope.hasReplay = false;
    $scope.show = false;
    $scope.sliderInit = false;
    setTimeout($scope.updateSelectedObj,100);
    // this is to remove the new class that automatically added
    // $('.ql-clipboard').removeAttr('contenteditable')
    // document.getElementsByClassName("ql-clipboard").setAttribute('contenteditable', 'false')

    atom.workspace.onDidStopChangingActivePaneItem(function() {
      $scope.$evalAsync();
    });

    $scope.acceptAnswer = function(request) {
      // request.removeButton = true;
      request.notification = "Resolved!"
      QuestionManager.markResolved(request.question_id);
    };
    // quill.setContents(quill.getContents())
    // console.log('Test '+ quill.getContents());
  }]);
};




// var answers = $scope.request.status.latestResponse;
//$scope.response_hash_key = $scope.helper_response.$$hashKey.replace(/\D/g,'');
// create a key for slider;
//do something with response here and set $scope.hasReplay

//console.log($scope.helper_response);

// answers.forEach(function(item){
// 	if(item.type == "livewriting_logs"){
// 		$scope.hasReplay = true;
// 		//$scope.response_hash_key = answers.hash
// 	}
// });



// $scope.showSlider = function(slider_id){
// 	var editor = atom.workspace.getActiveTextEditor();
// 	if (slider_id == editor.lw_slider_suffix)
// 		return true;
// 		return false;
// }
//
//
// $scope.replay = function(obj, response_id){
//
// 	obj.answers.forEach(function(answer){
// 		if(answer.type != "livewriting_logs")
// 			return;
// 		var logs = answer.logs;
// 		atom.workspace.open("replay" + response_id + "-" + answer.name)
// 		.then(function(editor){
// 			if (editor.livewritingMessage == undefined){
// 				editor.livewritingMessage = require('../services/livewriting.js');
// 				editor.livewritingMessage("create", "atom", {}, null);
// 				editor.livewritingMessage("playJson", logs, false);
// 				editor.lw_slider_suffix = response_id;
// 			}/*
// 			if(!$scope.sliderInit){
// 				Slider.initSlider(slider_id, editor.SLIDER_UPDATE_RESOLUTION); // we need to initiate slider only one time.
// 				$scope.sliderInit = true;
// 				$scope.$evalAsync();
// 			}
// 			editor.sliderGoToBeginning();*/
// 		});
// 	});
// };
//
// $scope.playVoice = function(obj){
// 	if($scope.isVoicePlaying){
// 		RequestReplayer.stopVoice();
// 		$scope.isVoicePlaying = false ;
// 	}else{
// 		$scope.isVoicePlaying = true ;
// 		RequestReplayer.playVoice($scope.selectedObj.question_id, obj.fileName, function() {
// 				$scope.isVoicePlaying = false;
// 		});
// 	}
//
// };
//
//
// $scope.collapse = function(obj){
// 	console.log(obj);
// 	obj.collapse = !obj.collapse;
// }
//

//
// $scope.mySplit = function(response) {
// 	if(response.hasOwnProperty('name')){
// 		return response.name;
// 	}
//
// 	if(response.hasOwnProperty('path')){
// 		var array = response.path.split('/');
//     return array[array.length-1];
// 	}
//
// }
