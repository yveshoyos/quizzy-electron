module.exports.DeafQuestionComponent = {
	bindings: {
		question: '=',
		preloaded: '&',
		setCtrl: '&'
		//game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$scope', '$q', '$timeout', function($scope, $q, $timeout) {

		let $ctrl = this;
		let started = false;
		this.setCtrl({
			ctrl: {
				play: () => {
					howl.play();
					howl.fade(0, 1, 1000);
				},
				pause: () => {
					howl.pause();
				},
				stop: function() {
					howl.on('fade', function onfade() {
						howl.stop();
						howl.off('fade', onfade);
					});
					howl.fade(1, 0, 1000)
				},
				unload: function() {
					console.log('_____UNLOAD____')
					this.stop();
					howl.unload();
				}
			}
		});

		// Preload mp3 file and call preloaded when it's done !
		let i = (Math.floor(Math.random() * 12) + 1);
		console.log('i => ', i)
		let howl = new Howl({
			src: __dirname + '/../../sounds/image_background_0'+i+'.mp3',
			preload: true,
			html: 5,
			onload: () => {

				var img = new Image();
				img.onload = function() {
					$ctrl.preloaded();
				}
				img.src = this.question.file;
				
			}
		});

	}],
	template: '<div class="result">'+
		'<img class="img-responsive" ng-src="{{$ctrl.question.file}}" />'+
	'</div>'
}