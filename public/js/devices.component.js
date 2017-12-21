module.exports.devicesComponent = {
	bindings: {
		devices: '='
	},
	controllerAs: 'devices',
	controller: ['$scope', function(scope) {

		this.$onInit = function() {
			this.devices.game = false;
			this.devices.master = false;
			this.devices.buzzer = false;
		}
		
	}],
	templateUrl: 'public/template/devices.html'
};