module.exports.BlindQuestionComponent = {
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

		this.barCtrl = {};

		this.setCtrl({
			ctrl: {
				play: () => {
					console.log('play !')
					
					
					if (started) { // continue
						howl.play();
						howl.fade(0, 1, 1000);
						this.barCtrl.continue();
					} else {
						this.barCtrl.reset();
						setTimeout(() => {
							howl.play();
							this.barCtrl.start();
						}, 100);
					}
					$timeout(() => {
						$scope.$digest();
					});
					
					started = true;
				},
				pause: () => {
					howl.pause();
					this.barCtrl.pause();
					$timeout(() => {
						$scope.$digest();
					});
				},
				stop: function() {
					//howl.stop();
					//howl.off('fade', onfade);
					howl.on('fade', function onfade() {
						howl.stop();
						howl.off('fade', onfade);
					});
					howl.fade(1, 0, 1000)
				},
				unload: function() {
					howl.unload();
				}
			}
		});

		// Preload mp3 file and call preloaded when it's done !
		let howl = new Howl({
			src: this.question.file,
			preload: true,
			html: 5,
			onload: () => {
				$ctrl.preloaded();
			}
		});


	}],
	template: '<div class="result">'+
		'<progress-bar controller="$ctrl.barCtrl"></progress-bar>'+
	'</div>'
}