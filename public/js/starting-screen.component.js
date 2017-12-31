const electron = require('electron');
const fs = require('fs-extra');
const path = require('path');

let smalltalk = require('smalltalk/legacy');

module.exports.startingScreenComponent = {
	bindings: {
		ui: '=',
		preferences: '=',
		ws: '=',
		game: '='
	},
	controllerAs: 'screen',
	controller: ['$element', '$scope', function($element, $scope) {
		let homeDir = electron.remote.getCurrentWindow().homeDirectory;
		let defaultQuestionsDir = homeDir+'/quizzy/questions'
		if (!fs.exists(defaultQuestionsDir)) {
			fs.mkdirs(defaultQuestionsDir)
		}

		this.preferences = {
			game: {
				port: 8081,
				questions_directory: defaultQuestionsDir
			},
			master: {
				type: 'websocket',
				port: 8082,
				web_port: 8083
			},
			buzzer: {
				type: 'teensy',
				port: 8083
			}
		}

		this.game.setPreferences(this.preferences);
		this.openPreferences = () => {
			this.game.setScreen('preferences');
		}

		this.initStartGame = function(startOrContinue) {
			this.game.start(startOrContinue, showError);
		}

		let $ctrl = this;
		let showError = () => {
			smalltalk.alert('No game server', 'The connection to the game server was lost ')
			$ctrl.game.setScreen('starting');
			if ($ctrl.game.isGame() && $ctrl.game.question) {
				$ctrl.game.question.ctrl.unload();
			}
			$scope.$apply();
		}

		this.canBeContinued = function() {
			var file = path.join(this.game.getPreferences().game.questions_directory, 'game.json');
			return fs.existsSync(file);
		}
	}],
	templateUrl: 'public/template/starting-screen.component.html'
};