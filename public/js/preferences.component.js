module.exports.preferencesComponent = {
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
};