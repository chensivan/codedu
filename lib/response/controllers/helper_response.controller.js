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

    var quill = new Quill('#editor-container', {
      modules: {toolbar: false},
      theme: 'bubble',
      readOnly: true
    });
    var answerLength = $scope.selectedObj.status.responses.length
    var lastAnswerArray = $scope.selectedObj.status.responses[answerLength-1].answers
    var needToUnderLine = [];
    console.log(lastAnswerArray);
    _.each(lastAnswerArray, function(obj){
      debugger
      if(obj.hasOwnProperty('type') && obj.type == 'explanation'){
        var lines = obj.value.split("\n");
        quill.insertText(0, obj.value, {//explanation content
           'color': 'rgb(0, 0, 0)',
           'underline': false
        });
        quill.setText(obj.value);
        console.log(quill.getContents());
        //need to extract context location etc .
        if(obj.hasOwnProperty('markdownAnswers') && obj.markdownAnswers){
          _.each(obj.markdownAnswers.text.selectedrange, function(context, index){
            var start = 0, end = 0;
            for (var i=0; i< lines.length;i++){
              if(context.start.row > i){
                start += lines[i].length+1;
              }else if (context.start.row == i){
                start += context.start.column;
              }
              if(context.end.row > i){
                end += lines[i].length+1;
              }else if (context.end.row == i){
                end += context.end.column;
              }
              else{
                break;
              }
            }
            obj.markdownAnswers.text.selectedrange[index].quillStart = start;
            obj.markdownAnswers.text.selectedrange[index].quillEnd = end;


            quill.formatText(start, end-start, {
              'color': 'rgb(0, 0, 255)',
              'underline': true
            });
          })
          // add listen to explanation
          quill.on('selection-change', function(range) {
            console.log('ok');
            if (range) {
              if (range.length == 0) {
                console.log('User cursor is on', range.index);
                ResponseManager.showContextInExplanation(obj.markdownAnswers,range.index);

              }
            }
          })
        }
      }
    })
    // this is to remove the new class that automatically added
    $('.ql-clipboard').removeAttr('contenteditable')
    // document.getElementsByClassName("ql-clipboard").setAttribute('contenteditable', 'false')

    atom.workspace.onDidStopChangingActivePaneItem(function() {
      $scope.$evalAsync();
    });

    $scope.acceptAnswer = function(request) {
      // request.removeButton = true;
      request.notification = "Resolved!"
      QuestionManager.markResolved(request.question_id);
    };

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
