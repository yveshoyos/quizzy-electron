(function(angular) {
	angular.module('buzzers', [])
	.component('buzzers', {
		controller: ['$scope', function($scope) {
			var ctrl = this;

			started = false;

			this.screen = 'starting';

			this.buzzers = [{
				color: 'red',
				on: false
			}, {
				color: 'greeen',
				on: false
			}, {
				color: 'blue',
				on: false
			}, {
				color: 'orange',
				on: false
			}];

			this.preferences = {
				port: 8083,
				server: 'localhost'
			};

			this.preferencesClose = function(preferences) {
				if (preferences) {
					this.preferences = preferences;
				}
				
				this.screen = 'starting';
			}

			this.start = function() {
				var websocket = new WebSocket("ws://"+this.preferences.server+":"+this.preferences.port);
				websocket.onopen = function (event) {

				};

				websocket.onmessage = function(event) {
					var data = JSON.parse(event.data);

					if ('lights' in data) {
						ctrl.buzzers[data.lights].on = data.on;
						$scope.$digest();
					}
				};

				websocket.onerror = function(err) {
					started = false;
				}

				this.screen = 'buzzers';
			}

			this.press = function(controllerIndex) {
				websocket.send(JSON.stringify({
					'press': controllerIndex
				}));				
			};

			this.openPreferences = function() {
				this.screen = 'preferences';
			};
		}],
		templateUrl: '../public/template/buzzers.html'
	})
	.component('preferences', {
		bindings: {
			appPreferences: '=preferences',
			onClose: '&',
			show: '='
		},
		controller: ['$scope', function(scope) {
			
			scope.$watch(() => {
				return this.show
			}, (show) => {
				if (show) {
					this.preferences = angular.copy(this.appPreferences) || {};
				}
			});

			this.cancel = function() {
				this.onClose(null);
			}

			this.save = function() {
				this.onClose({
					preferences: this.preferences
				});
			}
		}],
		templateUrl: '../public/template/buzzers-preferences.html'
	});
})(angular);
