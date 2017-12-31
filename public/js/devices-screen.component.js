module.exports.devicesScreenComponent = {
	bindings: {
		game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$scope', function(scope) {

		this.$onInit = function() {
			/*this.game.setDevices({
				game: false,
				master: false,
				buzzer: false
			})*/
		}
		
	}],
	templateUrl: 'public/template/devices-screen.html'
};