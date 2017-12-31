module.exports.scoresScreenComponent = {
	bindings: {
		game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$scope', '$compile', '$q', '$element', function(scope, $compile, $q, $element) {
		this.totalPoints = function() {
			return this.game.totalPoints();
		}
	}],
	templateUrl: 'public/template/scores-screen.component.html'
};