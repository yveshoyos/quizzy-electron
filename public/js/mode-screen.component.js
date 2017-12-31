
module.exports.modeScreenComponent = {
	bindings: {
		game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$element', function($element) {
		this.setMode = (mode) => {
			this.game.setMode(mode);
		};
	}],
	templateUrl: 'public/template/mode-screen.component.html'
};