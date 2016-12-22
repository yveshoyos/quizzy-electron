(function(angular) {
	const electron = require('electron');
	const dialog = electron.remote.dialog;
	const path = require('path');
	//const BuzzerNotFoundError = require('node-buzzer/build')

	function camelCase(str) {
		return str.replace(/-([a-z])/g, function (m, w) {
		    return w.toUpperCase();
		});
	}

	function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	angular.module('game', ['sounds'])
	.component('ui', {
		bindings: {
			type: '@'
		},
		controllerAs: 'ui',
		controller: ['$scope', '$element', '$q', 'Sounds', function(scope, $element, $q, Sounds) {
			console.log('game angular app : ', __dirname)
			console.log('this', this.type)
			var ui = this;
			var ws = null;

			this.screen = "starting";
			this.preferences = {
				game: {
					port: 8081,
					questions_directory: __dirname + '/../questions'
				},
				master: {
					port: 8082
				},
				buzzer: {
					type: 'teensy',
					port: 8083
				}
			}
			this.devices = {
				game: false,
				master: false,
				buzzer: false
			}

			ui.sounds = new Sounds(true);
			ui.sounds.add('actors', __dirname + '/../sounds/Cinema_Sins_Background_Song.mp3');
			ui.sounds.add('buzz', __dirname + '/../sounds/buzz.mp3');

			this.isGame = function() {
				return this.type == 'game';
			}

			this.isMaster = function() {
				return this.type == 'master';
			}

			/**
			 * Preferences
			 */
			this.openPreferences = function() {
				this.screen = "preferences";
			}

			this.preferencesClose = function(preferences) {
				if (preferences) {
					this.preferences = preferences;
				}
				
				this.screen = 'starting';

			}

			this.initStartGame = function() {
				try {
					if (this.isGame()) {
						start(this.preferences);
					}

					this.screen = 'devices';

					var port = this.preferences.game.port;
					if (this.isMaster()) {
						port = this.preferences.master.port;
					}
					ws = new WebSocket("ws://localhost:"+port);
					ws.onopen = () => {
						if (this.isGame()) {
							ui.sounds.play('actors', 500);
						}
						
						this.send('register', this.type)
					}

					ws.onmessage = (event) => {
						var data = JSON.parse(event.data)
						console.log(this.type,' : ', data)

						for(var property in data) {
							if (data.hasOwnProperty(property)) {
								var method = 'receive'+capitalize(camelCase(property));
								this[method].call(this, data[property])
							}
						}
					}

					ws.onerror = () => {
						console.log('ws error')
					}

					ws.onclose = () => {
						console.log('ws close')
					}

				} catch(e) {
					if (e.name == 'BuzzerNotFoundError') {
						dialog.showErrorBox('Buzzer not found', e.message)
					}
				}
			}

			this.send = function(key, value) {
				var data = {}
				data[key] = value
				ws.send(JSON.stringify(data))
			}

			this.receiveDevices = function(devices) {
				console.log('receive devices bro', devices)
				this.devices = devices
				scope.$digest();
			}
		}],
		templateUrl: '../public/template/game.html'
	})
	.component('preferences', {
		bindings: {
			appPreferences: '=preferences',
			onClose: '&',
			show: '='
		},
		controllerAs: 'preferences',	
		controller: ['$scope', function(scope) {
			

			scope.$watch(() => {
				return this.show
			}, (show) => {
				if (show) {
					this.preferences = angular.copy(this.appPreferences) || {};
				}
			});

			this.browseQuestionsDirectory = function() {
				this.preferences.game.questions_directory = dialog.showOpenDialog({properties: ['openDirectory']})[0];
			}

			this.cancel = function() {
				this.onClose(null);
			}

			this.save = function() {
				this.onClose({
					preferences: this.preferences
				});
			}
		}],
		templateUrl: '../public/template/preferences.html'
	})
	.component('devices', {
		bindings: {
			devices: '='
		},
		controllerAs: 'devices',
		controller: ['$scope', function(scope) {

			this.$onInit = function() {
				this.devices.game = false;
				this.devices.master = false;
				this.devices.buzzer = false;
			}
			
		}],
		templateUrl: '../public/template/devices.html'
	});

})(angular)
