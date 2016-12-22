(function(angular) {
	angular.module('master', [])
	.component('master', {
		controllerAs: 'game',
		controller: ['$scope', function(scope) {
			var game = this;

			game.actors = {
				game: false,
				buzzers: false,
				master: false
			};

			var ctrl = this;
			ctrl.step = 0;
			ctrl.answered = false;

			var websocket = new WebSocket("ws://"+window.ip+":"+window.port);
			websocket.onopen = function (event) {
				websocket.send(JSON.stringify({
					register: 'master'
				}));
			};

			websocket.onmessage = function(event) {
				var data = JSON.parse(event.data);
				console.log('master : ', data);

				if (angular.isDefined(data.set_actors)) {
					console.log('set actors')
					game.actors = data.set_actors;
				}

				if (angular.isDefined(data.set_teams)) {
					ctrl.teams = data.set_teams;
					ctrl.startTeamsActivation = true;
					ctrl.progress = 0;
					
					ctrl.secondsLeft = 8;
					var interval = setInterval(function() {
						ctrl.secondsLeft--;
						ctrl.progress = 100;//Math.floor((8-ctrl.secondsLeft)/8 * 100);
						scope.$digest();
						if (ctrl.secondsLeft <= 0) {
							clearInterval(interval);
						}
					}, 1000);
				}

				if (angular.isDefined(data.activate_team)) {
					for(var i=0; i < ctrl.teams.length; i++) {
						if (ctrl.teams[i].id == data.activate_team.id) {
							ctrl.teams[i] = data.activate_team;
							break;
						}
					}
				}

				if (angular.isDefined(data.update_team)) {
					for(var i=0; i < ctrl.teams.length; i++) {
						if (ctrl.teams[i].id == data.update_team.id) {
							ctrl.teams[i] = data.update_team;
							break;
						}
					}
				}

				if (data.set_step) {
					ctrl.step  = data.set_step;
				}

				if (angular.isDefined(data.set_question)) {
					ctrl.question = data.set_question;
					var bar = document.querySelector('.progress-bar');
					bar.style.width = '0%';

					setTimeout(function() {
						bar.classList.add('animated');
						bar.style.width = '100%';
					}, 100);
					
				}

				if (angular.isDefined(data.set_answered)) {
					ctrl.start = false;
					ctrl.answered = data.set_answered;
					var bar = document.querySelector('.progress-bar');
					var computedStyle = window.getComputedStyle(bar),
					width = computedStyle.getPropertyValue('width');
					bar.style.width = width;
					bar.classList.remove('animated');
					scope.$digest();
				}

				scope.$digest();
			};

			this.setMode = function(mode) {
				websocket.send(JSON.stringify({
					set_mode: mode
				}));
			};

			this.setPoints = function(value) {
				console.log('setPoints')
				// Make sure someone has buzzed
				if (!ctrl.answered) {
					console.log('no answer')
					return;
				}

				/*var team = ctrl.teams[ctrl.answered.controllerIndex];
				team.points += value;*/

				console.log('add points')
				websocket.send(JSON.stringify({
					add_points: value
				}));
			};
		}],
		templateUrl: 'template/teams.html'
	})
})(angular);
