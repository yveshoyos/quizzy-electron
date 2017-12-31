module.exports.progressBarComponent = {
	bindings: {
		controller: '='
	},
	controller: ['$element', function($element) {
		var bar = $element[0].querySelector('.progress-bar');

		this.reset = function() {
			bar.style.animationName = 'none';
			bar.style.webkitAnimationName = 'none';
			setTimeout(function() {
				bar.style.animationName = '';
				bar.style.webkitAnimationName = '';
			}, 100);
		}

		this.start = function() {
			bar.style.webkitAnimationPlayState = 'running';
			bar.style.animationPlayState = 'running';
		}

		this.pause = function() {
			bar.style.webkitAnimationPlayState = 'paused';
			bar.style.animationPlayState = 'paused';
		}

		this.continue = function() {
			bar.style.webkitAnimationPlayState = 'running';
			bar.style.animationPlayState = 'running';
		}

		this.controller = {
			reset: this.reset.bind(this),
			start: this.start.bind(this),
			pause: this.pause.bind(this),
			continue: this.continue.bind(this),
		}
	}],
	template: 
		'<div class="progress">' +
			'<div class="progress-bar"></div>' +
		'</div>'
};