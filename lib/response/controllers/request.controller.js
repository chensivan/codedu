var TooltipView = require('../../utils/requestbutton-view.js');
var _ = require('underscore')


module.exports = function(app) {

  app.controller("RequestController", ['$timeout', '$scope', '$rootScope', 'QuestionManager', 'ResponseManager', function($timeout, $scope, $rootScope, QuestionManager, ResponseManager) {

    $scope.iterationMsg = "";

    var editorListener = atom.workspace.getActiveTextEditor()

    $scope.button_value = "Helper Code";

    $scope.gotoAnnotation = function(answer){

      //move cursor to the middle point of the selection
      var selection_start_row = answer.location.start.row
      var selection_start_column = answer.location.start.column
      var selection_end_row = answer.location.end.row
      var selection_end_column = answer.location.end.column

      var ed = atom.workspace.getActiveTextEditor();
      var cursor = ed.getCursors()[0]
      cursor.setBufferPosition([selection_start_row, selection_start_column])
      ed.scrollToCursorPosition()
      //move the screen to the middle point of the selection

    }

    $scope.openNewTabShowCodeDiff = function(answers) {

      //if not only annotation,
      var onlyAnnotation = false;
      _.every(answers, function(val, ind) {
        if (val.type == 'inlinecode' && val.original == val.value) {
          onlyAnnotation = true;
          return false
        }
        return true;
      });

      if (!onlyAnnotation) {
        // $scope.mergedAlready = false;
        $scope.noInlineCode = false;
      } else {
        $scope.noInlineCode = true;
      }

      $scope.codeDiffLegend = false;
      ResponseManager.showCodeDiff(answers);
    }

    $scope.openNewTabShowHelperCode = function(answers){
      $scope.codeDiffLegend = true;
      ResponseManager.showHelperCode(answers);
    }

    $scope.toggleShowDiff = function(answers){

      var showdiff = $(".showdiff-checkbox")[0].checked;
      $(".showdiff-checkbox")[0].checked = !showdiff;

      if (!showdiff) {
        $scope.openNewTabShowCodeDiff(answers)
      }else{
        $scope.openNewTabShowHelperCode(answers);
      }
    }

    $rootScope.$on('directlyShowHelper', function(devent, data) {
      $scope.openNewTabShowHelperCode(data);
    })

    $scope.inlineCodeResponse = function(answer) {
      ResponseManager.viewCodeDiff(answer, answer.showMerge);
      response.showMerge = response.showMerge == "Show code difference" ? "Close it!" :
        "Show code difference";
    }

    $scope.runCurrentOpenTabCode = function() {
      var a = atom.workspace.getActiveTextEditor().getText();
      eval(a);
      // ResponseManager.runOpenTabCode();
    }

    $scope.showLocationWithinRequest = function(selectedObj) {

      atom.workspace.open(selectedObj.changelog[1].path)
        .then(function(editor) {
          _.every(selectedObj.changelog, function(obj) {
            if (obj.type == 'cursor') {
              editor.scrollToScreenPosition(obj.cursor, {
                center: true
              });
              editor.setCursorScreenPosition(obj.cursor);
              return false;
            }

            if (obj.type == 'selection_range') {
              editor.scrollToScreenPosition(obj.range[0], {
                center: true
              });
              editor.setCursorScreenPosition(obj.range[0]);
              return false;
            }
            return true;
          });
        });
    }

    $scope.comments = [];
    $scope.txtcom = '';
    $scope.commenting = false;
    $scope.addComment = function() {
      $scope.commenting = true;
    }

    $scope.submitComment = function(msg) {
      if (msg != '') {
        $scope.commenting = !$scope.commenting;
        $timeout(function() {
          $scope.selectedObj.status.discussion.push({
            sender: "Requester",
            timestamp: (new Date()).getTime(),
            value: msg
          });
          $scope.txtcom = '';
        }, 0, false).then(function() {
          $timeout(function() {
            QuestionManager.sendIterationRequest($scope.selectedObj.question_id, msg);
          }, 0, false);
        })
      }
    }

    $scope.cancelComment = function() {
      $scope.commenting = !$scope.commenting;
      $scope.txtcom = '';
    }

    // send out the iteration message
    $scope.iterate = function(msg) {
      if (msg!="") {
        $scope.selectedObj.status.discussion.push({
      		sender: "Requester",
          timestamp: (new Date()).getTime(),
          value:msg
      	})
      	console.log(msg);
      	QuestionManager.sendIterationRequest($scope.selectedObj.question_id, msg);

      	$scope.$parent.iterationMsg = "";
      }


    }

  }]);


};




//********** old code ***********


// Annotation response
// $scope.annotationResponse = function(answer, helperAnswers){
// 	 ;
//
// 	if(answer.showTip=='Close it'){
// 		ResponseManager.viewMyCurrentWorkingCode(answer);
// 		answer.showTip = 'Show me'
// 	}else{
//
// 		//loop through helperAnswers to see if there are any inline code in this editor
// 		helperAnswers.forEach(function(ans){
// 			if(ans.type=='inlinecode' && ans.editorID == answer.editorID){
// 				ResponseManager.viewHelperCode(ans);
// 			}
// 		});
//
// 		ResponseManager.viewAnnotation(answer,answer.showTip);
//
// 		answer.showTip = 'Close it'
// 	}
//
// }
//
// $scope.helperVersion = function(answer){
// 	// helperAnswers.forEach(function(ans){
// 	// 	if(ans.type=='inlinecode' && ans.editorID == answer.editorID){
// 	// 		ResponseManager.viewHelperCode(ans);
// 	// 	}
// 	// });
// 	//
// 	// ResponseManager.viewAnnotation(answer,answer.showTip);
//
// 	ResponseManager.viewHelperCode(answer);
// 	// ResponseManager.viewHelperMergeCode(answer);
// }
//
//
// 	//click 'accept answer'
// 	// $scope.merge = function(answer, request) {
// 	//
// 	// 	// answer.removeButton = true;
// 	// 	QuestionManager.markResolved(request.question_id);
// 	// 	//set text to merge version
// 	// 	ResponseManager.mergeCode();
// 	// };
//
//
//
// // send out the iteration message
// $scope.iterate = function(msg) {
// 	$scope.selectedObj.status.discussion.push({
// 		sender: "requester",
//     timestamp: (new Date()).getTime(),
//     value:msg
// 	})
// 	console.log(msg);
// 	QuestionManager.sendIterationRequest($scope.selectedObj.question_id, msg);
//
// 	$scope.iterationMsg = "";
//
// }
//
// $scope.githubVersion = function(answer){
// 	ResponseManager.viewCodeDiff(answer);
// }
//
//
// $scope.myCurrentCode = function(answer){
//
// 	ResponseManager.viewMyCurrentWorkingCode(answer);
// }
