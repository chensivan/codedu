var client = require('socket.io-client');
var prefs = require('../../utils/user_preferences');
var _ = require('underscore');
var $ = require('jquery');
var Range = require('atom').Range;
var existingRequestDecoration = [];


module.exports = function(app) {
	app.factory('QuestionManager', ['AlertMessageHandler','$http', '$q', '$rootScope', function (AlertMessageHandler,$http, $q, $rootScope) {

		var isConnected = false;

		var socket = client.connect(prefs.getServerURL(), {
	    reconnection: false
		});

		/* handle connection even handler */
		socket.on('connect_error', function(){
			console.error('CodeOn - Connection Failed :'+prefs.getServerURL());
			atom.notifications.addWarning('CodeOn - Connection Error: '+prefs.getServerURL() + " \n Check your server and restart your Atom.io");
		});

		socket.on('connect_timeout', function(){
			console.error('CodeOn - Connection Timeout :'+prefs.getServerURL());
			atom.notifications.addWarning(prefs.getServerURL());
		});

		socket.on('connect', function(){
		  //console.log('Connected');
			//alert('CodeOn - Connected with :'+prefs.getServerURL());
		});
/*
		socket.on('reconnect', function(){
		  console.log('Reconnected');
			alert('CodeOn - Reconnected with :'+prefs.getServerURL());

		});
*/
		socket.on('disconnect', function () {
			console.log('Disconnected');
			atom.notifications.addWarning('CodeOn - Disconnected with: '+prefs.getServerURL() + " \n Check your server and restart your Atom.io");

		});

		var requestPromises = {};

		var path;
    socket.on('request_uploaded', function(msg) {
      //run it when getting a new notification
      updateMyRequests();
			atom.beep();
			AlertMessageHandler.alertMessage("Title", "Request Posted!", "info", 3000);
			atom.workspace.getTopPanels()[0].hide();
    });


		//message_updated
		socket.on('message_updated', function(msg) {
			AlertMessageHandler.alertNewComment();
			//chat box auto scroll down
			var myDiv = $('.chat-box-content');
      myDiv.animate({
          scrollTop: myDiv[0].scrollHeight
        }, 1000);
			requestPromises[msg.requestID].then(function(request) {
				atom.beep();
				request.status.discussion = msg.discussion;
				request.status.state = msg.state;
				request.notification = "You received a new comment";
				request.helperCurrentWorking = false;
				request.helperIsDone  = false;
				request.helperHasMsg = true;
			});
		});

	  socket.on('status_updated', function(msg) {
			if(msg.typeOfUpdate == "responseUpdate"){

				requestPromises[msg.requestID].then(function(request) {
					request.status.state = msg.state;
					request.notification = "Waiting for actions";
					if(msg.state=='resolved'){
						request.notification = "Resolved.";
					}
				});
			}
		});

		socket.on('currentworkingrequest', function(data){
			getJSON('/editor_questions/' + prefs.getEditorID()).then(function(editor_questions) {
                _.each(editor_questions, function(updated, requestID) {
                    if(requestPromises.hasOwnProperty(requestID)) {
                        requestPromises[requestID].then(function(request) {
                            if(requestID==data.currentReq.question_id){
															request.currentHelperName = data.currentUser;
															request.helperCurrentWorking = true;
														}else{
															request.currentHelperName = "";
															request.helperCurrentWorking = false;
															request.helperIsDone  = false;
															request.helperHasMsg = false;
														}
                        });
                    }
                });

			});
		})

		socket.on('getMeCode',function(data){
			var ed = atom.workspace.getTextEditors();
			_.each(ed, function(editor){
				if(data.path == editor.getPath()){
					socket.emit('requestCurrentCode', {
						requestID: data.requestID,
						code: editor.getText()
					});
				}
			})
		});

    socket.on('new_response', function(msg) {
			AlertMessageHandler.alertNewResponse();
			requestPromises[msg.requestID].then(function(request) {
				atom.beep();
				request.status.responses = msg.responses;
				 ;
				request.status.latestResponse = msg.responses[msg.responses.length-1];
				request.status.state = msg.state;
				request.notification = "You received a new response";
				request.helperCurrentWorking = false;
				request.helperIsDone  = true;
				request.helperHasMsg = false;
				// console.log(request)
			});

    });

    function getJSON(url) {
        return $http({
            url: prefs.getServerURL() + url
        }).then(function(response) {
            return response.data;
        });
    }

		function updateRequest(request, requestID, updated) {
			fetchRequest(requestID, updated).then(function(newInfo) {
				newInfo.transcript = request.transcript;
				newInfo.title = request.title;
				_.extend(request, newInfo);

			});
		}

		function fetchRequest(requestID, updated) {
            var requestPromise = getJSON('/get_question/'+requestID),
                cwdPromise = getJSON('/get_cwd/'+requestID),
                tagsPromise = getJSON('/get_tags/'+requestID),
								// transcriptPromise = getJSON('/get_transcript/'+requestID),
                statusPromise = getJSON('/get_status/'+requestID);

            return $q.all([requestPromise, cwdPromise, tagsPromise, statusPromise]).then(function(info) {

                var request = info[0],
                    cwd = info[1],
                    tags = info[2],
										status = info[3],
										notification = status.state == "pending" ? "No response"
																	:status.state == "new" ? "Received a response."
																	:status.state == "new_comment" ? "Received a comment"
																	:status.state == "action" ? "Waiting for actions"
																	: "This request has been resolved.";

								 
                return _.extend({
                        tags: tags,
                        cwd: cwd,
                        updated: updated,
												status: status,
												hasView: false,
												notification: notification
                    						}, request);
            });
		}


		function contain(arr, ind){
			var target = arr[ind];
			for(i=ind+1;i<arr.length;i++){
				if(target==arr[i]) return false;
			};
			return true;
		}

		// function unique(input){
		// 	var promises = [];
		//
		// 	_.each(input, function(val, ind){
		// 		if(contain(input,ind)){
		// 			promises.push(atom.workspace.open(val).then(function(){
		// 				return val;
		// 			}));
		// 		}
		// 	});
		//
		// 	return $q.all(promises);
		// }

		function updateMyRequests() {
			getJSON('/editor_questions/' + prefs.getEditorID()).then(function(editor_questions) {
                _.each(editor_questions, function(updated, requestID) {
                    if(requestPromises.hasOwnProperty(requestID)) {
                        requestPromises[requestID].then(function(request) {
                            if(request.updated < updated) {
                                requestPromises[requestID] = fetchRequest(requestID, updated);
                            }
                        });
                    } else {
                        requestPromises[requestID] = fetchRequest(requestID, updated);

												// move this to after clicking done
												// var views = atom.views.getView(editor);
												// var rowGutter = views.shadowRoot.querySelector('div[data-buffer-row="'+location.start.row+'"]');
                    }
                });

                $q.all(_.values(requestPromises)).then(function(requests) {
                    $rootScope.requests = requests.sort(function(a, b) {
                        return b.updated - a.updated;
                    });

										//This is to prevent open the same file when this file is not open
										// the reason is .open is asyn. function so it won't notice that previous
										//file has the same path unless we find out the unique path first
										var pathArr = [];
										_.each($rootScope.requests,function(request){
											pathArr.push(request.changelog[1].path);
										});
										//add decoration on gutter to all the request files
										// unique(pathArr).then(function(arrs){
										// 	_.each($rootScope.requests, function(request,index){
										// 		// if(request.status.state!=="resolved"){
										// 			var hasIt = false;
										// 			var requestLocation = $rootScope.requests.length - index;
										// 			if(existingRequestDecoration.length>0){
										// 				_.every(existingRequestDecoration, function(num, ind){
										// 					if(num==requestLocation){
										// 						hasIt = true;
										// 						return false;
										// 					}
										// 					return true;
										// 				});
										// 			}
										//
										// 			if(!hasIt){
										// 				 
										// 				//add decoration on gutter to all the request files
										// 				atom.workspace.open(request.changelog[1].path).then(function(editor){
										// 					existingRequestDecoration.push(requestLocation);
										// 					var location = request.changelog[1].beginningSelection[0];
										// 					editor.scrollToScreenPosition([location.start.row, location.start.column],{center:true});
										// 					editor.setCursorScreenPosition([location.start.row, location.start.column]);
										//
										// 					var range = new Range([location.start.row, location.start.row], [location.start.row, location.start.row]);
										// 					var lineMarker = editor.markBufferRange(range,{
										// 						invalidate: 'never',
										// 						question_id: request.question_id
										// 					});
										// 					// Decorate the lineMarker.
										// 					 
										// 					var quo = ($rootScope.requests.length - index) %7;
										// 					editor.decorateMarker(lineMarker, {
										// 						type: 'line-number',
										// 						class:'request'+quo,
										// 						requestIndex: requestLocation,
										// 						lineNumber: range
										// 					});
										// 				})
										// 			}
										// 			request.removeButton = false
										// 		});
										// });
								});
			});
		}
		//when first open Atom
		updateMyRequests();

		var rv = {
			sendIterationRequest: function(requestID, message) {
				socket.emit('messageFromRequester', {
					requestID: requestID,
					value: message,
					state: 'pending'
				});
			},
			markResolved: function(requestID) {
				socket.emit('setState', {
					requestID: requestID,
					state: 'resolved'
				});
			},
			anyChanges: function(){
				socket.emit('somethingIsChangingOnRequeterSide');
			},
			markWaitingForAction: function(requestID){
				socket.emit('setState', {
					requestID: requestID,
					state: 'action'
				});
			},
			isConnected: function() {
				return socket.io.connected;
			},
			reconnect: function() {
				socket.io.reconnect();
			},
			updateTranscript: function(requestID, transcript){
				socket.emit('updateTranscript', {
					requestID: requestID,
					editedTranscript: transcript
				});
			},
			updateTitle: function(requestID, title){
				console.log(title);
				socket.emit('updateTitle', {
					requestID: requestID,
					editedTitle: title
				});
			}
		};

		socket.on('addNotification', function(notification) {
			//rv.emit('response', notification);
			$rootScope.$emit('codeon_response', notification)
		});

		return rv;
	}]);
};



//if it is marking waiting for actions
//
// console.log(msg);
// $rootScope.filePath = msg.path;
// var requestID = msg.requestID;
// var exist = false;
  // var requestArray = $rootScope.requests;
//
// //if requestID is one in scope.requesst
// for (var i=0;i<requestArray.length;i++){
// 	if(requestArray[i].question_id==requestID){
// 		 exist = true;
// 		 break;
// 	}
// }
//
// if(exist){
// 	requestPromises[requestID].then(function(request) {
// 		//
// 		// if(msg.newTranscript.length!=0)
// 		// 	request.transcript = msg.newTranscript[msg.newTranscript.length-1].transcript;
// 		// if(msg.newTitle.length!=0)
// 		// 	request.title = msg.newTitle[msg.newTitle.length-1].title;
//
// 		updateRequest(request, requestID, request.updated);
//
// 	});
// }
