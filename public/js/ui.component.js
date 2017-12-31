const electron = require('electron');
const dialog = electron.remote.dialog;
const path = require('path');
const fs = require('fs-extra');
const { camelCase, capitalize } = require('./string');

const { Game } = require('./game.service');

require('smalltalk/dist/smalltalk.min');

module.exports.uiComponent = {
	bindings: {
		type: '@'
	},
	controllerAs: 'ui',
	controller: ['$scope', '$element', '$q', '$timeout', '$compile', 'Sounds', function(scope, $element, $q, $timeout, $compile, Sounds) {
		let ui = this;

		//
		// Sounds
		//
		let howls = [];
		ui.sounds = new Sounds(true);
		ui.sounds.add('actors', __dirname + '/../sounds/Cinema_Sins_Background_Song.mp3');
		ui.sounds.add('buzz', __dirname + '/../sounds/buzz.mp3');

		this.barCtrl = null;
		this.game = new Game(this.type);



		//
		// Preferences
		//
		
		this.preferencesClose = (preferences) => {
			this.game.setScreen('starting');
		}

		let actorsPlaying = false;
		this.screen = 'starting';
		this.game.addEventListener('devices', () => {
			
			//digest = angular.isDefined(digest) ? digest : true;
			if (this.game.isGame() && !actorsPlaying) {	
				//this.sounds.stop('actors');
				actorsPlaying = true;
				this.turnOffSounds().then(() => {
					this.sounds.play('actors');
				});
			}
			this.screen = 'devices';

			$timeout(() => scope.$digest());
		});

		this.game.addEventListener('mode', () => {
			$timeout(() => scope.$digest());
		})

		this.game.addEventListener('team', () => {
			if (this.game.isGame() && this.game.getScreen() == 'team-activation') {
				this.sounds.play('buzz');
			}
			$timeout(() => scope.$digest());
		})

		this.game.addEventListener('start', () => {
			this.sounds.fade('actors', 1000);
			actorsPlaying = false;
			$timeout(() => scope.$digest());
		});

		this.game.addEventListener('question', () => {
			$timeout(() => scope.$digest());
		})

		this.game.addEventListener('answered', () => {
			this.sounds.play('buzz');
		})
		

		this.game.addEventListener('EOG', () => {
			$timeout(() => scope.$digest());
			this.turnOffSounds();
		})

		this.turnOffSounds = function() {
			var deferred = $q.defer();
			//this.sounds.fade('actors', 1000);
			if (this.game.question) {
				
				var self = this;
				if (this.game.isGame()) {
					this.game.question.ctrl.unload();
				}
				deferred.resolve();

				/*howls[this.game.currentQuestionIndex].on('fade', function onfade() {
					howls[self.currentQuestionIndex].stop();
					howls[self.currentQuestionIndex].off('fade', onfade);
					deferred.resolve();
					scope.$digest()
				});
				howls[this.currentQuestionIndex].fade(1, 0, 1000);*/
			} else {
				deferred.resolve();

			}
			return deferred.promise;
		};


		/// old


		
		this.initFinishGame = function() {
			alert('finished !!!')
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

	}],
	templateUrl: 'public/template/ui.component.html'
}