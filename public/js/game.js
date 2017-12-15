(function(angular) {
	const electron = require('electron');
	const dialog = electron.remote.dialog;
	const path = require('path');
	//const fs = require('fs');
	const fs = require('fs-extra');
	//const BuzzerNotFoundError = require('node-buzzer/build')

	function camelCase(str) {
		return str.replace(/_([a-z])/g, function (m, w) {
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

			var homeDir = electron.remote.getCurrentWindow().homeDirectory;
			var defaultQuestionsDir = homeDir+'/quizzy/questions'
			if (!fs.exists(defaultQuestionsDir)) {
				fs.mkdirs(defaultQuestionsDir)
			}

			this.screen = "starting";
			this.preferences = {
				game: {
					port: 8081,
					questions_directory: defaultQuestionsDir
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
			this.activatedTeamsCount = 0;
			this.barCtrl = null;
			this.currentQuestionIndex = -1;

			ui.sounds = new Sounds(true);
			ui.sounds.add('actors', __dirname + '/sounds/Cinema_Sins_Background_Song.mp3');
			ui.sounds.add('buzz', __dirname + '/sounds/buzz.mp3');

			var howls = [];

			this.isGame = function() {
				return this.type == 'game';
			}

			this.isMaster = function() {
				return this.type == 'master';
			}

			this.totalPoints = function() {
				var points = 0;
				angular.forEach(this.teams, function(team) {
					points += team.points;
				});
				return points;
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

			this.canBeContinued = function() {
				var file = path.join(this.preferences.game.questions_directory, 'game.json');
				return fs.existsSync(file);
			}

			this.initStartGame = function(startOrContinue) {
				try {
					if (this.isGame()) {
						start(this.preferences, startOrContinue);
					}

					this.receiveScreen('devices', false);
					//this.screen = 'devices';

					var port = this.preferences.game.port;
					if (this.isMaster()) {
						port = this.preferences.master.port;
					}
					ws = new WebSocket("ws://localhost:"+port);
					ws.onopen = () => {
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

					function showError() {
						smalltalk.alert('No game server', 'The connection to the game server was lost ')
						ui.receiveScreen('starting')
						//dialog.showErrorBox('No Game Server', '')
					}

					ws.onerror = () => {
						console.log('ws error')
						showError();
					}

					ws.onclose = () => {
						console.log('ws close')
						showError();
					}

				} catch(e) {
					if (e.name == 'BuzzerNotFoundError') {
						dialog.showErrorBox('Buzzer not found', e.message)
					}
				}
			}

			this.setMode = function(mode) {
				this.send('mode', mode)
			}

			this.startQuestions = function() {
				this.send('start_questions', null)
			}

			this.validateAnswer = function(points) {
				// Only the master is authorized to set the points
				if (!this.isMaster()) {
					return;
				}

				// Master can only set points when an answer is given
				if (!this.answered) {
					console.log('not answered')
					return;
				}

				console.log('send points')
				this.send('points', points)
			}

			this.continueQuestion = function() {
				if (!this.isMaster()) {
					return;
				}
				this.send('continue_question', this.currentQuestionIndex)
			}

			this.goNextQuestion = function() {
				if (!this.isMaster()) {
					return;
				}
				
				if (this.currentQuestionIndex+1 < this.questions.length) {
					this.send('start_question', this.currentQuestionIndex+1)
				} else {
					this.send('finish_game', null)
				}
			}

			this.initFinishGame = function() {
				alert('finished !!!')
			}

			this.send = function(key, value) {
				var data = {}
				data[key] = value
				ws.send(JSON.stringify(data))
			}

			this.turnOffSounds = function() {
				var deferred = $q.defer();
				//this.sounds.fade('actors', 1000);
				if (this.currentQuestionIndex > -1) {
					var self = this;
					howls[this.currentQuestionIndex].on('fade', function onfade() {
						howls[self.currentQuestionIndex].stop();
						howls[self.currentQuestionIndex].off('fade', onfade);
						deferred.resolve();
						scope.$digest()
					});
					howls[this.currentQuestionIndex].fade(1, 0, 1000);
				} else {
					deferred.resolve();

				}
				return deferred.promise;
			}

			this.receiveDevices = function(devices) {
				this.devices = devices
				scope.$digest();
			}

			this.receiveScreen = function(screen, digest) {
				var digest = angular.isDefined(digest) ? digest : true;

				this.screen = screen;
				if (this.screen == 'devices') {
					if (this.isGame()) {
						//console.log('ici')
						this.turnOffSounds().then(() => {
							console.log('playy!!! ')
							this.sounds.play('actors');
						});
					}
				}

				if (digest) {
					scope.$digest();
				}
				
			}

			this.receiveMode = function(mode) {
				this.mode = mode;
				setTimeout(() => {
					this.send('mode_ok', 1)
					scope.$digest();
				}, 400);
			}

			this.receiveTeams = function(teams) {
				this.teams = teams;
				this.activatedTeamsCount = this.teams.filter(function(team) {
					return team.active
				}).length;
				scope.$digest();
			}

			this.findTeamIndex = function(team) {
				for(var i=0; i < this.teams.length; i++) {
					if (this.teams[i].id ==team.id) {
						return i;
					}
				}
				return -1;
			}

			this.receiveTeam = function(team) {
				var index = this.findTeamIndex(team)
				this.teams[index] = team;
				if (this.isGame() && team.lightOn) {
					this.sounds.play('buzz')
				}

				this.activatedTeamsCount = this.teams.filter(function(_team) {
					return _team.active
				}).length;

				scope.$digest();
			}

			this.changeTeamName = function(team, index) {
				//var name = prompt('Enter team name : ');
				smalltalk.prompt('Set team name', 'Enter team name : ', team.name).then((name) => {
					this.send('team_name', {
						index: index,
						name: name
					});
				})
			}

			this.receiveQuestions = function(data) {
				this.sounds.fade('actors', 1000);
				this.questions = data.questions;
				this.currentQuestionIndex = data.startQuestionIndex;

				if (this.isGame()) {
					this.startQuestion((this.currentQuestionIndex == -1) ? 0 : this.currentQuestionIndex);
				}
			}

			this.preloadQuestion = function(index) {
				var deferred = $q.defer();

				var question = this.questions[index];
				if (question.type == 'blind') {
					howls[index] = new Howl({
						src: question.file,
						preload: true,
						html5: true,
						onload: function() {
							deferred.resolve(howls[index]);
							scope.$digest();
						}
					});
				} else { //deaf 
					howls[index] = new Howl({
						src:  __dirname + '/sounds/image_background_0'+(Math.floor(Math.random() * 5) + 1)+'.mp3',
						preload: true,
						html5: true,
						onload: () => {
							var img = new Image();
							img.onload = function() {
								deferred.resolve(this);
							}
							img.src = this.questions[index].file;
						}
					});
				}

				return deferred.promise;
			}

			this.startQuestion = function(index) {
				this.preloadQuestion(index).then(() => {
					this.send('start_question', index)
				});
			}

			this.receivePlayQuestion = function(data) {
				var index = data.questionIndex;

				console.log(index, ' vs ', this.currentQuestionIndex)
				if (index > this.currentQuestionIndex) {
					if (howls[this.currentQuestionIndex]) {
						howls[this.currentQuestionIndex].unload();
					}
				}

				switch(data.state) {
					case 'play': 
						this.answered = false;
						this.currentQuestionIndex = index;
						this.question = this.questions[index];
						this.nextQuestion = (index < this.questions.length) ? this.questions[index+1] : null;
						if (this.isGame() && this.nextQuestion) {
							this.preloadQuestion(index+1)
						}

						// Update progress bar
						this.barCtrl.reset();
						setTimeout(() => {
							if (this.isGame()) {
								howls[this.currentQuestionIndex].play();
							}
							this.barCtrl.start();
						}, 100);

						scope.$digest();
						break
					case 'continue':
						this.answered = false;
						if (this.isGame()) {
							howls[this.currentQuestionIndex].play()
							howls[this.currentQuestionIndex].fade(0, 1, 1000);
						}

						// update progress bar
						this.barCtrl.continue()

						scope.$digest();
						break;
				}
			}

			this.receiveAnswered = function(data) {
				// Only the game plays the songs
				if (this.isGame()) {
					// Pauses the music
					if (this.questions[this.currentQuestionIndex]) {
						howls[this.currentQuestionIndex].pause();
					}
				}

				// Play the buzz
				//this.sounds.play('buzz');

				this.start = false;
				this.answered = true;

				this.barCtrl.pause();
				// 
				scope.$digest();
			}



		}],
		templateUrl: 'public/template/game.html'
	})
	.component('progressBar', {
		bindings: {
			controller: '='
		},
		controller: ['$element', function($element) {
			console.log('ok... : ', $element[0].querySelector('.progress-bar'))
			var bar = $element[0].querySelector('.progress-bar');

			this.reset = function() {
				bar.style.animationName = 'none';
				bar.style.webkitAnimationName = 'none';
				setTimeout(function() {
					bar.style.animationName = '';
					bar.style.webkitAnimationName = '';
				}, 100);
			}

			this.start = function() {
				bar.style.webkitAnimationPlayState = 'running';
				bar.style.animationPlayState = 'running';
			}

			this.pause = function() {
				bar.style.webkitAnimationPlayState = 'paused';
				bar.style.animationPlayState = 'paused';
			}

			this.continue = function() {
				bar.style.webkitAnimationPlayState = 'running';
				bar.style.animationPlayState = 'running';
			}

			this.controller = {
				reset: this.reset.bind(this),
				start: this.start.bind(this),
				pause: this.pause.bind(this),
				continue: this.continue.bind(this),
			}
		}],
		template: 
			'<div class="progress">' +
				'<div class="progress-bar"></div>' +
			'</div>'
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
		templateUrl: 'public/template/preferences.html'
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
		templateUrl: 'public/template/devices.html'
	});

})(angular)
