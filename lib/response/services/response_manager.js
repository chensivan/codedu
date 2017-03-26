var TooltipView = require('../../utils/tooltip-view');
var Range = require('atom').Range;
var client = require('socket.io-client');
var prefs = require('../../utils/user_preferences');
var _ = require('underscore');
var diff = require("node-diff3").diff;
var jsdiff = require("diff");
var marker = {};
var lineMarkers = {};
var mergeVersionOfCode = {};
$ = require("jquery");
var editorNum;
var Diff = require('../../utils/diffs');

module.exports = function(app) {
	app.factory('ResponseManager', ['$http', '$q', '$rootScope','QuestionManager', function ($http, $q, $rootScope,$QuestionManager) {
    var editorViewMappings = {};
  	var editor = {};
		var tooltipMarkers = [];
		var mergeConflictCode = [];
		var firstLineOfConflict;
		var version;

		function createMarker(answer){
			debugger
			atom.workspace.open(answer.path).then(function(ed){

				editor = ed;
				marker.highlights = new Range([
					answer.location.start.row,
					answer.location.start.column
				],[
					answer.location.end.row,
					answer.location.end.column
				]);

				editor.scrollToScreenPosition(marker.highlights.start,{center:true})

				atom.workspace.observeTextEditors(function(editor){
					editorNum++;
					markerDecoration(answer,editor);
					observeCursors(answer);
				});
				editor.setCursorScreenPosition(marker.highlights.start)

			})
			// return ed;

		}

		function markerDecoration(answer, editor){
			debugger
			editorViewMappings[editor] = new TooltipView();

			// Decorate example ranges
			marker.marker = editor.markBufferRange(marker.highlights,{
				invalidate: 'never',
				markerValue: answer.value
			});

			marker.selection = editor.addSelectionForBufferRange(marker.marker.getBufferRange());
			marker.decoration = editor.decorateMarker(marker.marker, {
				class: 'test-pkg-highlight',
				type: 'highlight'
			});

			tooltipMarkers.push(marker.marker);
		}

		function removeMarker(markers){
			for(i=0;i<markers.length;i++){
				markers.forEach(function(mk){
					mk.destroy();
			  })
			}
			tooltipMarkers = [];
		}

		function destroyAllMarkers(){
			var markers = atom.workspace.getActiveTextEditor().getMarkers();
			for(i=0;i<markers.length;i++){
				markers.forEach(function(mk){
					mk.destroy();
			  })
			}
		}

		function removeMarkerForCodeDiff(markers){
			if(markers!=null){
				markers.forEach(function(mk){
					mk.destroy();
				})
			}
			lineMarkers.markers = [];
		}

		function observeCursors(answer,editor){
			// editor = atom.workspace.getActiveTextEditor();

			editor.observeCursors(function(cursor) {
				cursor.onDidChangePosition(function(e) {
					// Get cursor position.
					marker.cursor = cursor;
					var cursorPosition = e.newScreenPosition;
					var intersectionRange;
					var selectedMarker;
					var markerValue;
					// Check each marker to see if the cursor position intersects. Return first intersection.
					tooltipMarkers.some(function(testMarker){
						var markerRange = testMarker.getScreenRange();
						if(markerRange.containsPoint(cursorPosition)) {
							intersectionRange = markerRange;
							markerValue = testMarker.getProperties().markerValue;
							selectedMarker = testMarker;
							return true;
						}
					});

					if (!marker.marker.isDestroyed()){
						if(intersectionRange && selectedMarker ) {
							// Open a tooltip at the cursor if there was an intersection.
							var EditorView = atom.views.getView(editor);
							if(!EditorView) return;

							var EditorElement = EditorView.shadowRoot | EditorView;

							editorViewMappings[editor].setParams({
								text: markerValue,
								title: 'Comments from helper:',
								marker: tooltipMarkers
							});

							editorViewMappings[editor].open();

						} else {

							editorViewMappings[editor].close();
						}
					}

				});
			});

		}

		function observeTabs(answer){
			// removeMarker(tooltipMarkers);
			editorNum = 0; //reset total number of open tabs

			createMarker(answer);
		}

		function loadCodeDiff(){
			debugger;
			// run through codeDiff array and add bg color depending on the properties of each element
			var new_editor = atom.workspace.getActiveTextEditor();
			new_editor.setText("");
			var lastLine = 0;
			lineMarkers.markers = [];
			lineMarkers.deleteMarkers = [];
			var location = {};

			_.each(lineMarkers.codeDiff, function(line, index){
				debugger
				var action = line.added ? 'add' : line.removed ? 'delete' : 'nothingchanged';

				//see github version, but we want to have helper version, and requester version
				var textThatNeedsToBeInserted = line.value;

				var temp;
				if(line.value=="\n"){
					temp = [""];
				}else {
					temp = line.value.split('\n');
				}

				new_editor.insertText(textThatNeedsToBeInserted);

				// Get the new last line position, adjusted for the end of the previous line.
				var currentLastLine = new_editor.getLineCount()-1;

				if(action !== 'nothingchanged') {
	        // Create the lineMarker range.
					// add color always after \n token
					var range;
					if(temp[0]==""){
						range = new Range([lastLine, 0], [currentLastLine, 10]);
					}else{
						range = new Range([lastLine-1, 0], [currentLastLine, 10]);
					}
					if(action == 'delete'){
						lineMarkers.deleteMarkers.push(range)
					}

					location = range.start;
	        // Create the lineMarker.
	        var lineMarker = new_editor.markBufferRange(range, {
	          invalidate: 'inside',
	        });
	        // Decorate the lineMarker.
					debugger
	        new_editor.decorateMarker(lineMarker, {type: 'line', class: action});

	        // Add the lineMarker to our lineMarkers list.

	        lineMarkers.markers.push(lineMarker);

					if((temp[temp.length-1]!="")&&(index!=lineMarkers.codeDiff.length-1)&&((lineMarkers.codeDiff[index+1].value.split('\n')[0]!=""))){
						new_editor.insertText('\n')
					}

					if((temp[temp.length-1]=="")&&(temp.length==1)){
						new_editor.insertText('\n')
					}
	      }

	      // Update the last line for future diff framgments.
	      lastLine = new_editor.getLineCount();

			});

		}

		function getPathAndHelperCode(answers){
			removeMarker(tooltipMarkers);
			removeMarkerForCodeDiff(lineMarkers.markers);
			var answerInfo = {};
			_.each(answers, function(ans){
				if(ans.type=='inlinecode' || ans.type == 'annotation'){

					answerInfo.request_path = ans.path;
					var fileName = ans.path.split('/');
					answerInfo.helper_path = "helper-"+fileName[fileName.length-1];
					answerInfo.response_id = ans.question_id;
					ans.type=='inlinecode'? (answerInfo.helperCode = ans.value) : (answerInfo.helperCode = ans.helperCode);
					
				}

			});

			return answerInfo;

		}

		function checkRemovePane(){
			debugger;

			atom.workspace.onDidDestroyPane(function(){
				// var a = document.querySelector('atom-pane-axis.horizontal.pane-row');
				var a = $('atom-pane-axis')
				if(a){
					console.log('bug');
					a.hide();
				}
			})

		}

		function showMsgBox(){
			var editorViewMappings = {}
			atom.workspace.observeTextEditors(function(editor){
	      editorViewMappings[editor] = new codeContext();
	      editor.observeSelections(function(sel) {

	        sel.onDidChangeRange(function() {
	          var EditorView = atom.views.getView(editor);

	          EditorView.addEventListener('mouseup', function(event) {
	            var isTopPanelOpen = atom.workspace.getTopPanels()[0].visible;
	            var isTitlePanelOpen = atom.workspace.getModalPanels()[0].visible;
	            var isClickingOnLineNumber = (((sel.getBufferRange().end.row - sel.getBufferRange().start.row) == 1) && ((sel.getBufferRange().end.column - sel.getBufferRange().start.column) == 0))
	            if (!sel.isEmpty() && !isTopPanelOpen && !isTitlePanelOpen && !isClickingOnLineNumber) {
	              if (!EditorView) return;
	              var EditorElement = EditorView.shadowRoot | EditorView;
	              var returnText = editorViewMappings[editor].setParams({});
	              editorViewMappings[editor].open();
	            } else {
	              editorViewMappings[editor].close();

	            }
	          });
	        })

	      });
	    });
		}

    return rv = {
			removeRequesterCurrentCodeInSystem: function(){
				lineMarkers.path = {};
			},
			showHelperCode: function(answers){
				if(atom.workspace.getPanes().length>1){

					var answerInfo = getPathAndHelperCode(answers);

					//go to the splitted tab
					if(atom.workspace.getActivePane() != atom.workspace.getPanes()[0]){
						atom.workspace.activatePreviousPane();
					}
					atom.workspace.open(answerInfo.request_path).then(function(editor){
						editor.scrollToScreenPosition([0,0],{center:true});
						lineMarkers.path = {};
						lineMarkers.path[answerInfo.request_path] = editor.getText();
					}).then(function(){
						atom.workspace.activatePreviousPane();
						//open the new path and show all the code and annotation
						mergeTab = atom.workspace.getActiveTextEditor();

						// get answer content
						mergeTab.setText(answerInfo.helperCode);

						mergeTab.scrollToScreenPosition([0,0],{center:true});

						_.each(answers, function(answer){
							if(answer.type=='annotation'){
								editor = mergeTab;
								marker.highlights = new Range([
									answer.location.start.row,
									answer.location.start.column
								],[
									answer.location.end.row,
									answer.location.end.column
								]);

								// editor.scrollToScreenPosition(marker.highlights.start,{center:true})
								atom.workspace.observeTextEditors(function(editor){
									if(editor.id == mergeTab.id){
										editorNum++;
										markerDecoration(answer, editor);
										observeCursors(answer, editor);

									}
								});

							}
						});

					});


				}else{
					var answerInfo = getPathAndHelperCode(answers);
					atom.workspace.open(answerInfo.request_path).then(function(editor){
						editor.scrollToScreenPosition([0,0],{center:true});
						lineMarkers.path = {};
						lineMarkers.path[answerInfo.request_path] = editor.getText();
					}).then(function(){
						//split the tab
						var editor = atom.workspace.getActivePane();
						editor.splitRight({copyActiveItem: false});
						// checkRemovePane();
						//open the new path and show all the code and annotation
						atom.workspace.open(answerInfo.helper_path)
							.then(function(mergeTab){

								// get answer content
								mergeTab.setText(answerInfo.helperCode);

								mergeTab.scrollToScreenPosition([0,0],{center:true});

								_.each(answers, function(answer){
									if(answer.type=='annotation'){
										editor = mergeTab;
										marker.highlights = new Range([
											answer.location.start.row,
											answer.location.start.column
										],[
											answer.location.end.row,
											answer.location.end.column
										]);

										// editor.scrollToScreenPosition(marker.highlights.start,{center:true})
										atom.workspace.observeTextEditors(function(editor){
											if(editor.id == mergeTab.id){
												editorNum++;
												markerDecoration(answer, editor);
												observeCursors(answer, editor);

											}
										});

									}
								});

							});
						})
				}
			},

			showCodeDiff: function(answers){
				if(atom.workspace.getPanes().length>1){
					var answerInfo = getPathAndHelperCode(answers);
					//go to the splitted tab
					if(atom.workspace.getActivePane() != atom.workspace.getPanes()[0]){
						atom.workspace.activatePreviousPane();
					}
					debugger
					atom.workspace.open(answerInfo.request_path).then(function(editor){
						editor.scrollToScreenPosition([0,0],{center:true});
						lineMarkers.path = {};
						lineMarkers.path[answerInfo.request_path] = editor.getText();
					}).then(function(){
						//go to the splitted tab
						atom.workspace.activatePreviousPane();
						mergeTab = atom.workspace.getActiveTextEditor();

						lineMarkers.currentDev = lineMarkers.path[answerInfo.request_path];
						// get answer content
						lineMarkers.currentRes = answerInfo.helperCode;
						debugger;
						var currentDevArray = lineMarkers.currentDev.split("\n");
						var currentResArray = lineMarkers.currentRes.split("\n");

						lineMarkers.codeDiff = jsdiff.diffJson(lineMarkers.currentDev, lineMarkers.currentRes ,{newlineIsToken:true});
						loadCodeDiff();
						mergeTab.scrollToScreenPosition([0,0],{center:true});

						})

				}else{

					var answerInfo = getPathAndHelperCode(answers);
					debugger
					atom.workspace.open(answerInfo.request_path).then(function(editor){
						editor.scrollToScreenPosition([0,0],{center:true});
						lineMarkers.path = {};
						lineMarkers.path[answerInfo.request_path] = editor.getText();
					}).then(function(){
						//split the tab
						var editor = atom.workspace.getActivePane();
						editor.splitRight({copyActiveItem: false});
						// checkRemovePane();
						//open the new path and show all the code and annotation
						debugger
						atom.workspace.open(answerInfo.helper_path)
							.then(function(mergeTab){
								lineMarkers.currentDev = lineMarkers.path[answerInfo.request_path];
								// get answer content
								lineMarkers.currentRes = answerInfo.helperCode;
								var currentDevArray = lineMarkers.currentDev.split("\n");
								var currentResArray = lineMarkers.currentRes.split("\n");

								lineMarkers.codeDiff = jsdiff.diffJson(lineMarkers.currentDev, lineMarkers.currentRes ,{newlineIsToken:true});
								loadCodeDiff();
								mergeTab.scrollToScreenPosition([0,0],{center:true});

							});
						})
				}
			},
			removeLineNumberMarker: function(index){
				var editor = atom.workspace.getActiveTextEditor();
				b = editor.getLineNumberDecorations();
				var markerClass = 'request'+index;
				for(var i = 0; i<b.length;i++){
					if(b[i].getProperties().class == markerClass){
						b[i].destroy();
						break;
					}
				}
			},
			showContextInExplanation: function(codeContext, curose_location){
				debugger
				//remove all decoration
				destroyAllMarkers();

				//check if the window is splitted
				if(atom.workspace.getPanes().length>1){

					//go to the splitted tab
					if(atom.workspace.getActivePane() == atom.workspace.getPanes()[0]){
						atom.workspace.activatePreviousPane();
					}

					var len = codeContext.code.selectedrange.length
					for (var i = 0; i < len; i++) {
							// var range_start_row = $scope.markdownAnswers.text.selectedrange[i].start.row
							var range_start_col = codeContext.text.selectedrange[i].quillStart
							// var range_end_row = $scope.markdownAnswers.text.selectedrange[i].end.row
							var range_end_col = codeContext.text.selectedrange[i].quillEnd

							if (curose_location >= range_start_col && curose_location <= range_end_col) {

									var editor = atom.workspace.getActiveTextEditor()
									var highlights = new Range();
									highlights.start.row = codeContext.code.selectedrange[i].start.row
									highlights.start.column = codeContext.code.selectedrange[i].start.column
									highlights.end.row = codeContext.code.selectedrange[i].end.row
									highlights.end.column = codeContext.code.selectedrange[i].end.column

									var explanationCodeContext = editor.markBufferRange(highlights, {
					          invalidate: 'inside',
					        });
					        // Decorate the lineMarker.
									debugger
					        editor.decorateMarker(explanationCodeContext, {
										class: 'test-pkg-highlight',
										type: 'highlight'
									});


									// session.addMarker(highlights, "ace_context", "text")
									break;
							}
					}

					//
				}else{
					//do nothing if there is no splitted window
					return
				}

			}
    };

  }]);
}



// getMsgContext: function(){
// 	destroyAllMarkers()
// 	mergeTab = atom.workspace.getActiveTextEditor();
// 	var a = Math.floor(Math.random()*50)
// 	var b = Math.floor(Math.random()*10)
// 	var c = 10+Math.floor(Math.random()*10)
//
// 	mergeTab.scrollToBufferPosition([a,0],{center:true});
//
// 	marker.highlights = new Range([a,3],[a+2,10])
// 	marker.marker = mergeTab.markBufferRange(marker.highlights,{
// 		invalidate: 'never'
// 	});
// 	debugger
// 	marker.selection = mergeTab.addSelectionForBufferRange(marker.marker.getBufferRange());
// 	marker.decoration = mergeTab.decorateMarker(marker.marker, {
// 		class: 'test-pkg-highlight',
// 		type: 'highlight'
// 	});
//
//
//
// 	// editor.scrollToScreenPosition(marker.highlights.start,{center:true})
// 	// atom.workspace.observeTextEditors(function(editor){
// 	// 	if(editor.id == mergeTab.id){
// 	// 		editorNum++;
// 	// 		markerDecoration(answer, editor);
// 	// 		observeCursors(answer, editor);
// 	// 	}
// 	// });
//
//
// },

//merge function
// function demo_diff3_cooked_1(results) {
// 		var merger = results;
// 		var lines = [];
// 		for (var i = 0; i < merger.length; i++) {
// 				var item = merger[i];
// 				if (item.ok) {
// 						lines = lines.concat(item.ok);
// 				} else {
// 						lines = lines.concat(["\n<<<<<<<<<\n"], item.conflict.a,
// 																 ["\n=========\n"], item.conflict.b,
// 																 ["\n>>>>>>>>>\n"]);
// 				}
// 		}
// 		return lines.join("\n");
// }


// function setLineMarker(){
//
// 	// run through codeDiff array and add bg color depending on the properties of each element
// 	var new_editor = atom.workspace.getActiveTextEditor();
// 	new_editor.setText("");
// 	var lastLine = 0;
// 	lineMarkers.markers = [];
// 	lineMarkers.deleteMarkers = [];
// 	var location = {};
//
//
// 	if(version == 'github'){
// 		_.each(lineMarkers.codeDiff, function(line, index){
//
// 			var action = line.added ? 'add' : line.removed ? 'delete' : 'nothingchanged';
//
// 			//see github version, but we want to have helper version, and requester version
// 			var textThatNeedsToBeInserted = line.value;
//
// 			var temp;
// 			if(line.value=="\n"){
// 				temp = [""];
// 			}else {
// 				temp = line.value.split('\n');
// 			}
//
// 			if(temp.indexOf('<<<<<<<<<')>-1){
// 				if(version=='helpercode'){
// 					// temp = temp.slice(start+2, end-1);
// 					// textThatNeedsToBeInserted = temp.join('\n')
// 					textThatNeedsToBeInserted=line.helper
//
// 				}else if(version=='mycode'){
// 					// var start = temp.indexOf('=========');
// 					// var end = temp.indexOf('>>>>>>>>>');
// 					// temp = temp.slice(start+2, end-1);
// 					textThatNeedsToBeInserted = line.requester;
// 				}
// 			}
//
// 			editor.insertText(textThatNeedsToBeInserted);
//
// 			// Get the new last line position, adjusted for the end of the previous line.
// 			var currentLastLine = editor.getLineCount()-1;
//
// 			if(action !== 'nothingchanged') {
//         // Create the lineMarker range.
// 				// add color always after \n token
// 				var range;
// 				if(temp[0]==""){
// 					range = new Range([lastLine, 0], [currentLastLine, 100]);
// 				}else{
// 					range = new Range([lastLine-1, 0], [currentLastLine, 100]);
// 				}
// 				if(action == 'delete'){
// 					lineMarkers.deleteMarkers.push(range)
// 				}
//
// 				location = range.start;
//         // Create the lineMarker.
//         var lineMarker = editor.markBufferRange(range, {
//           invalidate: 'inside',
//         });
//         // Decorate the lineMarker.
// 				debugger
//         editor.decorateMarker(lineMarker, {type: 'line', class: action});
//
//         // Add the lineMarker to our lineMarkers list.
//
//         lineMarkers.markers.push(lineMarker);
//
// 				if((temp[temp.length-1]!="")&&(index!=lineMarkers.codeDiff.length-1)&&((lineMarkers.codeDiff[index+1].value.split('\n')[0]!=""))){
// 					editor.insertText('\n')
// 				}
//
// 				if((temp[temp.length-1]=="")&&(temp.length==1)){
// 					editor.insertText('\n')
// 				}
//       }
//
//       // Update the last line for future diff framgments.
//       lastLine = editor.getLineCount();
//
// 			//see github version, but we want to have helper version, and requester version
// 			// if(lastLine == firstLineOfConflict){
// 			//
// 			// 	editor.insertText(mergeConflictCode.value)
// 			// 	lastLine = lastLine + mergeConflictCode.value.split('\n').length+5;
// 			// 	firstLineOfConflict = -1;
// 			// 	mergeConflictCode = [];
// 			// }
//
// 		});
//
// 	}
//
// 	if(version == 'mycode'){
// 		editor.insertText(lineMarkers.currentDev)
// 	}
//
//
// 	//first line of difference;
// 	editor.scrollToScreenPosition(location,{center:true})
// }
//

// function addCodeDiff(answer){
//
// 	return $q(function(res, rej){
// 		debugger
// 		atom.workspace.open(answer.path).then(function(ed){
// 			editor = ed;
//
// 			if(!lineMarkers.hasOwnProperty('path')){
// 				lineMarkers.path = {};
// 			}
//
// 			//if resposne path is Not in the linemarker, set the value to be the current code
//
// 			lineMarkers.path[answer.path] = editor.getText();
//
//
// 			lineMarkers.currentDev = lineMarkers.path[answer.path];
//
// 			// get answer content
// 			lineMarkers.currentRes = answer.value;
//
// 			// get original code
// 			lineMarkers.original = answer.original;
//
// 			var currentDevArray = lineMarkers.currentDev.split("\n");
// 			var originalArray = lineMarkers.original.split("\n");
// 			var currentResArray = lineMarkers.currentRes.split("\n");
//
// 			mergeVersionOfCode = diff.merge(currentDevArray,originalArray,currentResArray);
//
// 			lineMarkers.codeDiff = jsdiff.diffJson(lineMarkers.currentDev, lineMarkers.currentRes ,{newlineIsToken:true});
//
// 			setLineMarker();
// 		});
// 	});
// }


// mergeCode: function(answer){
// 	//go to the splitted tab
// 	if(atom.workspace.getActivePane() != atom.workspace.getPanes()[0]){
// 		atom.workspace.activatePreviousPane();
// 	}
//
// 	//open the associated file tab
//
// 	//run through the current tab and remove all the deletion line
// 	removeMarker(tooltipMarkers);
// 	// removeMarkerForCodeDiff(lineMarkers.markers);
//
// 	var editor = atom.workspace.getActiveTextEditor();
// 	var b = editor.getLineNumberDecorations();
//
//
//
// 	addCodeDiff(answer).then(function(msg){
// 		var mergeString = [];
//
// 		_.each(lineMarkers.codeDiff, function(line, index){
// 			if(!line.hasOwnProperty('removed')||line.removed!=true){
// 				mergeString = mergeString.concat(line.value)
// 			}
// 		});
//
// 		mergeString = mergeString.join("\n");
// 		debugger
// 		atom.workspace.open(answer.path).then(function(editor){
// 			editor.setText(mergeString);
//
// 			//add all markers
// 			var range = [];
// 			debugger;
// 			for(var i = 0; i<b.length;i++){
// 				if(b[i].getProperties().class.substring(0,7)=='request'){
// 					range.push(b[i].getProperties())
// 					b[i].destroy();
// 				}
// 			}
//
// 			_.each(range, function(ran, ind){
//
// 				var lineMarker = editor.markBufferRange(ran.lineNumber,{
// 					invalidate: 'never'
// 				});
// 				// Decorate the lineMarker.
// 				editor.decorateMarker(lineMarker, {
// 					type: 'line-number',
// 					class: ran.class,
// 					requestIndex: ran.requestIndex,
// 					lineNumber: ran.lineNumber
// 				});
// 			})
//
// 		});
// 	})
//
//
// },


				// if there is conflicts we only print out this var
				// if(mergeVersionOfCode.conflict){
				//
				// 	// editor.setText("");
				// 	// editor.insertText(mergeVersionOfCode.result.join('\n'));
				// 	// editor.scrollToScreenPosition([0,0],{center:true});
				//
				// 	var requesterVersionStartIndex = mergeVersionOfCode.result.indexOf('\n<<<<<<<<<\n');
				// 	var twoVersionSeperationIndex = mergeVersionOfCode.result.indexOf('\n=========\n')
				// 	var helperVersionEndIndex = mergeVersionOfCode.result.indexOf('\n>>>>>>>>>\n');
				// 	//
				// 	firstLineOfConflict = requesterVersionStartIndex;
				// 	var requesterCurrentVersionConflictEndIndex   = twoVersionSeperationIndex - 1;
				// 	//
				// 	var requesterVersion = mergeVersionOfCode.result.slice(requesterVersionStartIndex+1, twoVersionSeperationIndex);
				// 	var helperVersion = mergeVersionOfCode.result.slice(twoVersionSeperationIndex+1,helperVersionEndIndex);
				//
				// 	var twoVersionObject = {
				// 	    requester: requesterVersion,
				// 	    helper: helperVersion
				// 	}
				//
				// 	var mergeContainsTwoVersion = mergeVersionOfCode.result.slice(0, requesterVersionStartIndex).concat(twoVersionObject, mergeVersionOfCode.result.slice(helperVersionEndIndex+1))
				//
				// 	var mergeVersionToShow = mergeVersionOfCode.result.slice(0, requesterVersionStartIndex).concat(requesterVersion, mergeVersionOfCode.result.slice(helperVersionEndIndex+1))
				//
				// 	var mergeHelper = mergeVersionOfCode.result.slice(0, requesterVersionStartIndex).concat(twoVersionObject.helper, mergeVersionOfCode.result.slice(helperVersionEndIndex+1))
				//
				// 	var mergeMy = mergeVersionOfCode.result.slice(0, requesterVersionStartIndex).concat(twoVersionObject.requester, mergeVersionOfCode.result.slice(helperVersionEndIndex+1))
				// 	//
				// 	// var mergeContainsTwoVersion = mergeVersionOfCode.result.slice(0, requesterVersionStartIndex).concat(twoVersionObject, mergeVersionOfCode.result.slice(helperVersionEndIndex+1))
				// 	//
				// 	// var mergeVersionToShow = mergeVersionOfCode.result.slice(0, requesterVersionStartIndex).concat(requesterVersion, mergeVersionOfCode.result.slice(helperVersionEndIndex+1))
				// 	//
				// 	var mergeFirstPart  = mergeVersionOfCode.result.slice(0,requesterVersionStartIndex).join('\n')
				// 	var mergeSecondPart = mergeVersionOfCode.result.slice(helperVersionEndIndex+1).join('\n')
				//
				// 	var currentFirstPart  = currentDevArray.slice(0,requesterVersionStartIndex).join('\n')
				// 	var currentSecondPart = currentDevArray.slice(twoVersionSeperationIndex-1).join('\n')
				//
				// 	// mergeConflictCode = mergeVersionOfCode.result.slice(requesterVersionStartIndex,helperVersionEndIndex+1)
				//
				// 	mergeConflictCode = {
				// 	    value: mergeVersionOfCode.result.slice(requesterVersionStartIndex,helperVersionEndIndex+1).join('\n'),
				// 	    helper: twoVersionObject.helper.join('\n'),
				// 	    requester: twoVersionObject.requester.join('\n')
				// 	}
				//
				// 	// lineMarkers.codeDiff = jsdiff.diffJson(currentFirstPart, mergeFirstPart,{newlineIsToken:true}).concat(jsdiff.diffJson(currentSecondPart, mergeSecondPart,{newlineIsToken:true}))
				// 	lineMarkers.codeDiff = jsdiff.diffJson(currentFirstPart, mergeFirstPart,{newlineIsToken:true})
				// 							.concat(mergeConflictCode)
				// 							.concat(jsdiff.diffJson(currentSecondPart, mergeSecondPart,{newlineIsToken:true}))
				// 	debugger;
				// 	// console.log(lineMarkers.codeDiff);
				// 	setLineMarker();
				//
				// } else{
				// 	// get this merge version up once click "merge" button
				//
				// 	lineMarkers.codeDiff = jsdiff.diffJson(lineMarkers.currentDev, mergeVersionOfCode.result.join('\n'),{newlineIsToken:true});
				// 	console.log(lineMarkers.codeDiff);
				// 	setLineMarker();
				// }








// viewHelperCode: function(answer){
// 	removeMarker(tooltipMarkers);
// 	if(!lineMarkers.hasOwnProperty('path')){
// 		lineMarkers.path = {};
// 	}
//
// 	atom.workspace.open(answer.path).then(function(mergeTab){
//
// 		//if resposne path is Not in the linemarker, set the value to be the current code
// 		if(!lineMarkers.path.hasOwnProperty(answer.path)){
// 			lineMarkers.path[answer.path] = mergeTab.getText();
// 		}
//
// 		mergeTab.setText("");
// 		mergeTab.insertText(answer.value);
// 		mergeTab.scrollToScreenPosition([0,0],{center:true})
//
// 	});
// },


// atom.workspace.open(answer.path).then(function(mergeTab){
// 	//if resposne path is Not in the linemarker, set the value to be the current code
// 	if(!lineMarkers.path.hasOwnProperty(answer.path)){
// 		lineMarkers.path[answer.path] = mergeTab.getText();
// 	}
//
// 	var currentDev = lineMarkers.path[answer.path].split('\n');
// 	var currentRes = answer.value.split('\n');
// 	var original = answer.original.split('\n');
// 	var mergeArray = Diff.diff3_merge(currentDev,original,currentRes,false);
//
//   var mergeString = demo_diff3_cooked_1(mergeArray);
//
// 	mergeTab.setText("");
// 	mergeTab.insertText(mergeString);
// 	mergeTab.scrollToScreenPosition([0,0],{center:true})
// });
//

// editor = atom.workspace.getActiveTextEditor();
// this.viewCodeDiff(answer)
// _.each(lineMarkers.deleteMarkers, function(deletion){
// 	//each eletion is a range {start: {row:.., column:..}, end: {row:..,column:..}}
// 	editor.setSelectedScreenRange(deletion);
// 	editor.deleteLine();
// })

// viewMyCurrentWorkingCode:function(answer){
// 	removeMarker(tooltipMarkers);
// 	removeMarkerForCodeDiff(lineMarkers.markers);
//
// 	if(!lineMarkers.hasOwnProperty('path')){
// 		lineMarkers.path = {};
// 	}
//
// 	if(!lineMarkers.path.hasOwnProperty(answer.path)){
// 		atom.workspace.open(answer.path).then(function(mergeTab){
// 			lineMarkers.path[answer.path] = mergeTab.getText();
// 			 mergeTab.scrollToScreenPosition([0,0],{center:true})
// 		});
// 	}else{ //if resposne path is in the linemarker path, load the value
// 		atom.workspace.open(answer.path).then(function(mergeTab){
// 			mergeTab.setText("");
// 			mergeTab.insertText(lineMarkers.path[answer.path]);
// 			mergeTab.scrollToScreenPosition([0,0],{center:true})
// 		});
// 	}
// },
