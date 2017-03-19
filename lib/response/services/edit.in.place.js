module.exports = function(app) {
	app.directive( 'editInPlace', function() {
		return {
			restrict: 'E',
			scope: { value: '='
		, aftersave:'&'},
			template: function ( element, attrs ) {
				var htmltag = '<div class="' +attrs.clazz+'" ng-click="edit()">' + (attrs.label? attrs.label:'');
				htmltag += '{{value || "Click to edit the ' + attrs.name + '"}}</div>';
				htmltag += "<";
				htmltag += attrs.type || "input";
				htmltag += ' ng-model="value" class = "native-key-bindings form-control" tabIndex=-1 placeholder="'
				htmltag += attrs.placeholder;
				htmltag += '"';
				htmltag += (attrs.aftersave?' ng-blur="aftersave()"':'');
				htmltag += (attrs.type == "textarea"?' row = 5':'');
				htmltag +='></';
				htmltag += attrs.type || "input";
				htmltag += ">";
				return htmltag;
			},
			link: function ( $scope, element, attrs ) {
				// Let's get a reference to the input element, as we'll want to reference it.
				var inputElement = angular.element( element.children()[1] );

				// This directive should have a set class so we can style it.
				element.addClass( 'edit-in-place' );

				// Initially, we're not editing.
				$scope.editing = false;

				// ng-click handler to activate edit-in-place
				$scope.edit = function () {
					$scope.editing = true;

					// We control display through a class on the directive itself. See the CSS.
					element.addClass( 'active' );

					// And we must focus the element.
					// `angular.element()` provides a chainable array, like jQuery so to access a native DOM function,
					// we have to reference the first element in the array.
					inputElement[0].focus();
				};

				// When we leave the input, we're done editing.
				inputElement.prop( 'onblur', function() {
					$scope.editing = false;
					element.removeClass( 'active' );

				});

			}
		};
	});
};
