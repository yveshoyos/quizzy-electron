module.exports.preferencesScreenComponent = {
	bindings: {
		onClose: '&',
		show: '=',
		game: '='
	},
	controllerAs: 'preferences',	
	controller: ['$scope', function(scope) {
		
		scope.$watch(() => {
			return this.show
		}, (show) => {
			if (show) {
				this.preferences = angular.copy(this.game.getPreferences()) || {};
			}
		});

		this.browseQuestionsDirectory = function() {
			this.preferences.game.questions_directory = dialog.showOpenDialog({properties: ['openDirectory']})[0];
		}

		this.cancel = function() {
			this.onClose(null);
		}

		this.save = function() {
			this.game.setPreferences(this.preferences);
			this.onClose({
				preferences: this.preferences
			});
		}
	}],
	templateUrl: 'public/template/preferences-screen.html'
};