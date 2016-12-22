(function(angular) {

	angular.module('game', ['sounds'])
	.component('ui', {
		bindings: {
			type: '@'
		},
		controllerAs: 'game',
		controller: ['$scope', '$element', '$q', 'Sounds', function(scope, $element, $q, Sounds) {
			console.log('ici')
			var game = this;
			var websocket = new WebSocket("ws://localhost");
			var howls = [];
			
			// Initialisation
			game.actors = {
				game: false,
				buzzers: false,
				master: false
			};
			game.error = false;
			game.progress = 0;
			game.secondsLeft = 0;
			game.step = 0;
			game.ip = window.ip;
			game.qrCodeUrl = window.qrCodeUrl;
			game.answered = false;
			game.currentQuestionIndex = -1;
			
			this.isMaster = function() {
				return game.type == 'master';
			};

			this.isGame = function() {
				return game.type == 'game';
			}

			//
			game.sounds = new Sounds(!game.isMaster());
			game.sounds.add('actors', '/sounds/Cinema_Sins_Background_Song.mp3');
			game.sounds.add('buzz', '/sounds/buzz.mp3');


			this.setMode = function(mode) {
				game.mode = mode;
				websocket.send(JSON.stringify({
					set_mode: mode
				}));
			};

			this.validateAnswer = function(points, correct) {
				// Only the master is authorized to set the points
				if (!game.isMaster()) {
					return;
				}

				// Master can only set points when an answer is given
				if (!game.answered) {
					return;
				}

				websocket.send(JSON.stringify({
					validate_answer: {
						points: points,
						success: correct
					}
				}));
			};

			this.continueQuestion = function() {
				if (!game.isMaster()) {
					return;
				}
				broadcastContinueQuestion(game.currentQuestionIndex);
			}

			this.goNextQuestion = function() {
				if (!game.isMaster()) {
					return;
				}

				if (game.currentQuestionIndex+1 < game.questions.length) {
					beginQuestion(game.currentQuestionIndex+1);
				} else {
					initFinishGame();
				}
			}

			this.reload = function() {
				window.location.reload();
			};

			this.totalPoints = function() {
				var points = 0;
				angular.forEach(game.teams, function(team) {
					points += team.points;
				});
				return points;
			}

			this.setTeamName = function(team) {
				var name = prompt('Enter team name : ');
				websocket.send(JSON.stringify({
					set_team_name: {
						id: team.id,
						name: name
					}
				}));
			}

			this.startQuestions = function() {
				websocket.send(JSON.stringify({
					start_questions: 3
				}));
			}

			function turnOffSounds() {
				//if (game.sounds.playing('actors')) {
					game.sounds.fade('actors', 1000);
				//}

				//if (game.currentQuestionIndex >= 0) {
					howls[game.currentQuestionIndex].on('fade', function onfade() {
						howls[game.currentQuestionIndex].stop();
						howls[game.currentQuestionIndex].off('fade', onfade);
					});
					howls[game.currentQuestionIndex].fade(1, 0, 1000);
				//}
			}

			websocket.onopen = function (event) {
				console.log('open')
				game.sounds.play('actors', 500);
				
				websocket.send(JSON.stringify({
					register: game.type
				}));
			};

			websocket.onerror = function(error) {
				game.error = true;
				turnOffSounds();
				scope.$digest();
			}

			websocket.onclose = function(event) {
				game.error = true;
				turnOffSounds();
				scope.$digest();
			}

			websocket.onmessage = function(event) {
				var data = JSON.parse(event.data);
				console.log('game : ', data);

				// Actors
				if (angular.isDefined(data.set_actors)) {
					setActors(data.set_actors);
				}

				// Steps
				if (angular.isDefined(data.set_step)) {
					setStep(data.set_step);
				}

				if (angular.isDefined(data.set_teams)) {
					setTeams(data.set_teams);
				}

				if (angular.isDefined(data.team_activation_duration)) {
					game.teamActivationDuration = data.team_activation_duration;
					
					$element[0].querySelectorAll('.radial-progress .circle .mask').forEach(function(el) {
						el.style['transition-duration'] = data.team_activation_duration+'s';
						el.style['-webkit-transition-duration'] = data.team_activation_duration+'s';
					});
					$element[0].querySelectorAll('.radial-progress .circle .fill').forEach(function(el) {
						el.style['transition-duration'] = data.team_activation_duration+'s';
						el.style['-webkit-transition-duration'] = data.team_activation_duration+'s';
					});
					//$element[0].querySelector('.progress-bar').style.transitionDuration =  data.team_activation_duration+'s';
				}

				if (angular.isDefined(data.activate_team)) {
					activateTeam(data.activate_team);
				}

				if (angular.isDefined(data.update_team)) {
					updateTeam(data.update_team);
				}

				if (angular.isDefined(data.set_mode)) {
					setMode(data.set_mode);
				}

				if (angular.isDefined(data.set_answered)) {
					setAnswered(data.set_answered);
				}

				if (angular.isDefined(data.questions)) {
					setQuestions(data.questions);
				}

				if (angular.isDefined(data.start_question)) {
					startQuestion(data.start_question);
				}

				if (angular.isDefined(data.continue_question)) {
					continueQuestion(data.continue_question);
				}

				if (angular.isDefined(data.validate_answer)) {
					validateAnswer(data.validate_answer);			
				}

				if (angular.isDefined(data.finish_game)) {
					finishGame(data.finish_game);
				}

				scope.$digest();
			};

			function setStep(step) {
				game.step  = step;
			}

			function setActors(actors) {
				game.actors = actors;
			}

			function setTeams(teams) {
				// Register teams
				game.teams = teams;

				// Reset registration progress 
				game.progress = 0;
				game.secondsLeft = game.teamActivationDuration-1;

				// 
				game.startTeamsActivation = true;
				
				// At each second, update the second left and stop at 0
				var interval = setInterval(function() {
					game.progress = 100;
					game.secondsLeft--;
					scope.$digest();

					// prevent secondsLeft to be negative
					if (game.secondsLeft <= 0) {
						clearInterval(interval);
					}
				}, 1000);
			}

			function activateTeam(team) {
				var index = findTeamIndex(team.id);
				if (index == -1) {
					return;
				}

				game.sounds.play('buzz');
				game.teams[index] = team;
			}

			function updateTeam(team) {
				var index = findTeamIndex(team.id);
				game.teams[index] = team;
			}

			function findTeamIndex(id) {
				for(var i=0; i < game.teams.length; i++) {
					if (game.teams[i].id == id) {
						return i;
					}
				}
				return -1;
			}

			function setMode(mode) {
				game.mode = mode;
				setTimeout(function() {
					websocket.send(JSON.stringify({
						set_activation_step: 1
					}));
				}, 400);
			}

			function setAnswered(answered) {
				// Only the master plays the songs
				if (!game.isMaster()) {
					// Pauses the music
					if (game.questions[game.currentQuestionIndex]) {
						howls[game.currentQuestionIndex].pause();
					}
				}

				// Play the buzz
				game.sounds.play('buzz');

				game.start = false;
				game.answered = true;

				
				// Get the progress bar and pause the progress
				var bar = document.querySelector('.progress-bar');
				pauseProgress(bar);

				// 
				scope.$digest();
			}

			function preloadQuestion(index) {
				console.log('preloadQuestion : ', index, game.questions[index])
				var deferred = $q.defer();

				if (game.questions[index].type == 'blind') {
					howls[index] = new Howl({
						src: game.questions[index].file,
						preload: true,
						html5: true,
						onload: function() {
							console.log('loaded')
							deferred.resolve(howls[index]);
							scope.$digest();
						}
					});
				} else { // deaf
					howls[index] = new Howl({
						src: '/sounds/image_background_0'+(Math.floor(Math.random() * 5) + 1)+'.mp3',
						preload: true,
						html5: true,
						onload: function() {
							var img = new Image();
							img.onload = function() {
								deferred.resolve(this);
							}
							img.src = game.questions[index].file;
						}
					});
				}

				return deferred.promise;
			}

			function setQuestions(questions) {
				// turn off music of start game
				game.sounds.fade('actors', 1000);

				// Load question
				game.questions = questions;

				if (game.isGame()) {
					// Preload the first question and start when ready
					beginQuestion(0);
				}
			}

			function beginQuestion(index) {
				console.log('beginQuestion : ', index)
				//Unload previous question
				if (howls[index-1]) {
					howls[index-1].unload();
				}

				preloadQuestion(index).then(function() {
					broadcastStartQuestion(index);
				});
			}

			function continueQuestion(index) {
				game.answered = false;

				var bar = document.querySelector('.progress-bar');
				continueProgress(bar);

				if (game.isGame()) {
					//if (game.questions[index].type == 'blind') {
						howls[index].play();
						howls[index].fade(0, 1, 1000);
					//} else { //deaf 
					//}
					
				}
				
				scope.$digest();
			}

			function broadcastStartQuestion(index) {
				console.log('broadcastStartQuestion : ', index)
				websocket.send(JSON.stringify({
					start_question: index
				}));
			}

			function broadcastContinueQuestion(index) {
				websocket.send(JSON.stringify({
					continue_question: index
				}));
			}

			function startQuestion(index) {

				game.currentQuestionIndex = index;

				var question = game.questions[index];
				var nextQuestion = (index < game.questions.length) ? game.questions[index+1] : null;
				if (game.isGame() && nextQuestion) {
					preloadQuestion(index+1);
				}

				// Set the question and remove old answer
				game.question = question;
				game.nextQuestion = nextQuestion;
				game.answered = false;
				
				// Set progress bar to 0 and start loading bar
				var bar = document.querySelector('.progress-bar');
				resetProgress(bar);

				setTimeout(function() {
					if (game.isGame()) {
						//if (game.questions[game.currentQuestionIndex].type == 'blind') {
							howls[game.currentQuestionIndex].play();
						/*} else {

						}*/
					}
					
					startProgress(bar);
				}, 100);
			}

			function initFinishGame() {
				websocket.send(JSON.stringify({
					finish_game: true
				}));
			}

			function finishGame() {
				console.log('turn off sound')
				turnOffSounds();
				game.finished = true;
			}

			function validateAnswer(answer) {
				/*if (game.isGame()) {
					if (answer.success) {
						beginQuestion(game.currentQuestionIndex+1);
					} else {
						broadcastContinueQuestion(game.currentQuestionIndex);
					}
				}*/

			}

			function resetProgress(bar) {
				//bar.style.width = '0%';
				
				bar.style.animationName = 'none';
				bar.style.webkitAnimationName = 'none';
				setTimeout(function() {
					console.log('set animation');
					bar.style.animationName = '';
					bar.style.webkitAnimationName = '';
				}, 100);
			}

			function startProgress(bar) {
				/*bar.classList.add('animated');
				bar.style.width = '100%';*/
				
				bar.style.webkitAnimationPlayState = 'running';
				bar.style.animationPlayState = 'running';
			}

			function pauseProgress(bar) {
				// Get the current value in the animation and set the style
				/*var computedStyle = window.getComputedStyle(bar),
				width = computedStyle.getPropertyValue('width');
				bar.style.width = width;

				// Stop any animation
				bar.classList.remove('animated');*/

				bar.style.webkitAnimationPlayState = 'paused';
				bar.style.animationPlayState = 'paused';
			}

			function continueProgress(bar) {
				/*bar.classList.add('animated');
				bar.style.width = '100%';*/
				bar.style.webkitAnimationPlayState = 'running';
				bar.style.animationPlayState = 'running';
			}


		}],
		templateUrl: 'public/template/game.html'
	});

})(angular)
