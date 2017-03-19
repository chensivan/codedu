var tooltip = require('../tooltipMain');
var _ = require('underscore');
var RequestView = require('../../requests/requestView');
var Range = require('atom').Range;
var $ = require('jquery');
var element = require('../../utils/requestbutton-element-wrapper')();


module.exports = function(app) {

  app.controller("ResponsePanelController", ['AlertMessageHandler', '$scope', '$rootScope', '$timeout', 'QuestionManager', 'RequestReplayer', 'ResponseManager', function(AlertMessageHandler, $scope, $rootScope, $timeout, QuestionManager, RequestReplayer, ResponseManager) {

    $scope.title = "Codeon Requests";
    $scope.resList = true;
    $scope.reqSideBarButton = true;
    $scope.responseContent = false;
    $scope.activated = false;
    $rootScope.requests = [];
    $scope.inputs = {
      requestID: "",
      iterationMsg: "",
      editedRequest: "",
      editedTitle: ""
    };

    $scope.search = {
      query: { title: "" },
      active: false,
      toggle: function() {
        if (this.active) {
          this.query = { title: "" }
        };
        this.active = !this.active;
      }
    }

    baseTags = [
      { name:'All', filter: "" },
      { name:'Pending', filter: function(r) { return r.status.responses.length == 0 } }
    ]

    $scope.tags = baseTags;
    $scope.activeTag = $scope.tags[0];
    $scope.updateTag = function(tag) { $scope.activeTag = tag; }

    updateTagList = function() {
      reqTags = new Set();
      // Collect tags from requests
      $scope.$root.requests.forEach(function(request) {
        reqTags = new Set([...reqTags, ...request.tags]);
      });
      // Process tags from request
      reqTags = Array.from(reqTags).map(function(tag) {
        return {
          name: tag,
          filter: function (r) {
            return r.tags.indexOf(tag) != -1;
          }
        }
      });
      // Update tags
      $scope.tags = baseTags.concat(reqTags);
    }
    $scope.$root.$watch('requests', updateTagList);

    var parent = atom.views.getView(atom.workspace).querySelector('.vertical');
    parent.appendChild(element.el);

    // watch the gutter color to see the request
    atom.workspace.observeTextEditors(function(edi) {
      edi.observeSelections(function(sel) {

        sel.onDidChangeRange(function() {

          var EditorView = atom.views.getView(edi);

          EditorView.addEventListener('mouseup', function(event) {
            //check selection
            var row = sel.getBufferRange().start.row;
            var rowDiff = sel.getBufferRange().end.row - sel.getBufferRange().start.row;
            var colDiff = sel.getBufferRange().end.column - sel.getBufferRange().start.column;
            var isWholeLine = ((rowDiff == 1) && (colDiff == 0));
             
            //check if the whole line was selected
            if(atom.workspace.getActiveTextEditor().getMarkers().length>0){
              _.each(atom.workspace.getActiveTextEditor().getMarkers(), function(m) {
                var markerRowDiff = m.getBufferRange().start.row - m.getBufferRange().end.row;
                var markerColDiff = m.getBufferRange().end.column - m.getBufferRange().start.column;
                var isMarkerOnSelection = (row == m.getBufferRange().start.row)
                //show up alert
                if ((markerRowDiff == 0) && (markerColDiff == 0) && (isWholeLine) && (isMarkerOnSelection)) {
                  var question_id = m.getProperties().question_id;
                  var request = {};
                  //find the request that has this id
                  _.every($rootScope.requests, function(existRequest) {
                    if (existRequest.question_id == question_id) {
                      request = existRequest;
                      return false;
                    }
                    return true;
                  });

                  var sco = angular.element(document.getElementById('theList')).scope();
                  sco.$apply(function() {
                    sco.clickRequest(request);

                  });
                }

              })

            }

          });
        })
      });
    });

    // setTimeout($scope.newResponse, 2000);
    $scope.$on('codeon_response', function(response) {
      //response range
      var range = response.range;
      atom.notifications.addSuccess("You received one response for this question:\n " +
        "Can you debug this function for me. \n");
      // 	"the response is: "+response.responseContent
    });

    $scope.bgColor = 'black';

    $scope.titleClick = function(title, event) {
       ;
      $scope.title = "Codeon Requests";
      $scope.resList = true;
      $scope.reqSideBarButton = true;
      $rootScope.isRejecting = false;
      $scope.responseContent = false;
      $scope.activated = false;
    }

    $scope.inputSubmit = function() {
      // $('.chat-box-content').scrollTop($('.chat-box-content')[0].scrollHeight);
      var myDiv = $('.chat-box-content');
      myDiv.animate({
          scrollTop: myDiv[0].scrollHeight
        }, 1000);
    }

    // show the details of the clicked response
    $scope.clickRequest = function(obj) {

      if (obj.status.state == 'new' || obj.status.state == 'new_comment') {
        QuestionManager.markWaitingForAction(obj.question_id);
        // obj.notification = "Waiting for actions";
      }
      if (obj.helperIsDone || obj.helperHasMsg) {
        obj.helperIsDone = false;
        obj.helperHasMsg = false;
      }

      $scope.chatbox_open = true;
      $scope.resList = false;
      $scope.reqSideBarButton = false;
      $scope.responseContent = true;
      $scope.title = "Requests";
      $rootScope.isRejecting = false;
      $scope.selectedObj = obj;
      $scope.search.active = false;
      $scope.search.query = "";
      $scope.activeTag = $scope.tags[0];

      //call helperCode
      if (obj.status.responses.length > 0) {
        $rootScope.$emit("directlyShowHelper", obj.status.responses[obj.status.responses.length - 1].answers);
      }
    }

    $scope.newRequest = function() {
      //call codeon function
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'atom-codeon:toggle-recording')
    }

    $scope.runCode = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'script:run')
    }

    $scope.hideRequest = function(request, index) {
       ;
      console.log(((request.remove) && (request.status.state !== "resolved")))
      request.removeButton = false
      request.remove = true;
      var quo = ($rootScope.requests.length - index) % 7;
      ResponseManager.removeLineNumberMarker(quo);
    }

    $scope.changeRequest = function(input, obj) {
      obj.transcript = input;
      //send updates to the server
      QuestionManager.updateTranscript(obj.question_id, input);
      //  ;
      obj.edit = false;
      $scope.inputs.editedRequest = "";

    }

    $scope.cancelRequest = function(obj) {
      console.log(obj);
      obj.edit = false;
      $scope.inputs.editedRequest = "";
    }


    var playControls;

    $scope.playRequest = function(obj) {

      if (obj.playing) {
        obj.playing = false;
        if (playControls) {
          playControls.stop();
        }
      } else {
         
        atom.workspace.open(obj.changelog[1].path)
          .then(function(editor) {
            var location = obj.changelog[1].beginningSelection[0];

            editor.scrollToScreenPosition([location.start.row, location.start.end], {
              center: true
            });
            editor.setCursorScreenPosition([location.start.row, location.start.end]);
          });
        obj.playing = true;
        playControls = RequestReplayer.playRequest(obj, function() {
          obj.playing = false;
        });
      }
    }

    $scope.setColor = function(index) {
      var quo = ($rootScope.requests.length - index) % 7;

      if (quo == 0) {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#EC2525'
        }
      } else if (quo == 1) {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#4876FF'
        }
      } else if (quo == 2) {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#993F00'
        }
      } else if (quo == 3) {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#008000'
        }
      } else if (quo == 4) {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#FFA405'
        }
      } else if (quo == 5) {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#740AFF'
        }
      } else {
        return {
          'border-left': 'solid',
          'border-left-width': '6px',
          'border-left-color': '#E0FF66'
        }
      }
    }

  }]);
};



// $scope.comments = [];
// $scope.txtcom = '';
// $scope.commenting = false;
// $scope.addComment = function(){
//   $scope.commenting = true;
// }
//
// $scope.submit = function(){
//   $scope.commenting = !$scope.commenting;
//   if($scope.txtcom !=''){
//     var comObj = {
//       "comt": $scope.txtcom,
//       "time": new Date()
//     }
//     $scope.comments.push(comObj);
//     $scope.txtcom = '';
//     }
// 		console.log($scope.txtcom);
// }
//
// $scope.cancel = function(){
//   $scope.commenting = !$scope.commenting;
//   $scope.txtcom = '';
// }

// $scope.toggle = function(response_index){
//
// 	$scope.selectedObj.status.responses[response_index].show = !$scope.selectedObj.status.responses[response_index].show;
//
// 	//close the rest response
// 	for (var i=0; i< $scope.selectedObj.status.responses.length; i++){
// 		if(i!=response_index){
// 			$scope.selectedObj.status.responses[i].show = false;
// 		}
// 	}
// 	ResponseManager.removeRequesterCurrentCodeInSystem();
// 	// if($scope.selectedObj.activated)
// 	// 	$scope.selectedObj.status.responses[response_index].show = true;
// };
//
// $scope.hideRequest = function(request){
// 	console.log(((request.remove) && (request.status.state!=="resolved")))
// 	request.removeButton = false
// 	request.remove = true;
// }
//
//
// $scope.editTitle2 = function(){
// 	if($scope.selectedObj.title!=''){
// 		QuestionManager.updateTitle($scope.selectedObj.question_id, $scope.selectedObj.title);
// 	}
// }
//
// $scope.editTranscript2 = function(){
// 	 
// 	if($scope.selectedObj.transcript!=''){
// 		QuestionManager.updateTranscript($scope.selectedObj.question_id, $scope.selectedObj.transcript);
// 	}
// }
//
// $scope.editTitle = function(obj){
// 	obj.editTitle = true;
// }
//
// $scope.changeTitle = function(input, obj){
// 	obj.title = input;
// 	console.log(obj);
// 	//  ;
// 	QuestionManager.updateTitle(obj.question_id, input);
// 	obj.editTitle = false;
// 	$scope.inputs.editedTitle = "";
// }
//
// $scope.cancelTitle = function(obj){
// 	console.log(obj);
// 	obj.editTitle = false;
// 	$scope.inputs.editedTitle = "";
// }
//
//
// $scope.editRequest = function(obj){
// 	obj.edit = true;
// }
