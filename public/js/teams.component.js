let smalltalk = require('smalltalk/legacy');

module.exports.teamsComponent = {
	bindings: {
		game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$element', function($element) {
		this.changeTeamName = (team, index) => {
			//var name = prompt('Enter team name : ');
			if (this.game.isMaster()) {
				smalltalk.prompt('Set team name', 'Enter team name : ', team.name).then((name) => {
					this.game.setTeamName(index, name);
				});
			}
		}		
	}],
	templateUrl: 'public/template/teams.component.html'
};