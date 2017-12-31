
module.exports.teamActivationScreenComponent = {
	bindings: {
		game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$element', function($element) {
		this.startQuestions = function() {
			this.game.send('start', null);
		}
	}],
	templateUrl: 'public/template/team-activation-screen.component.html'
};