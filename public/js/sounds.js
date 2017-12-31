angular.module('sounds', [])
.service('Sounds', function() {
 	function Sounds(active) {
 		this.active = (angular.isDefined(active)) ? active : true;
 		this.sounds = {};
	}

	Sounds.prototype = {
		constructor: Sounds,
		add: function(type, mp3) {
			if (!this.active) {
				return;
			}

			this.sounds[type] = {
				howl: new Howl({
					src: [mp3],
					preload: true
				}),
				ids: {}
			};
		},
		play: function(type, delay) {
			if (!this.active) {
				return;
			}
			
			var id = new Date().valueOf();
			var delay = angular.isDefined(delay) ? delay : 0;
			var callback = angular.isDefined(callback) ? callback : function() {};

			var sound = this.sounds[type];
			if (!sound) {
				return;
			}
			
			if (delay > 0) {
				sound.ids[id] = {
					timeout: setTimeout(function() {
						sound.ids[id].howlId = sound.howl.play();
						sound.ids[id].timeout = null;
						sound.howl.volume(1, sound.howl.id);
					}, delay)
				};
			} else {
				sound.ids[id] = {
					howlId: sound.howl.play()
				};
				sound.howl.volume(1, sound.howl.id);
			}
			return id;
		},
		stop: function(type, id) {
			if (!this.active) {
				return;
			}

			var id = angular.isDefined(id) ? id : null;
			var sound = this.sounds[type];
			if (!sound) {
				return;
			}

			if (id) {
				var play = sound.ids[id];
				if (play.timeout) {
					clearTimeout(play.timeout);
				} else {
					sound.howl.stop(play.id);
				}
			} else {
				for(var id in sound.ids) {
					var play = sound.ids[id];
					if (play.timeout) {
						clearTimeout(play.timeout);
					} else {
						sound.howl.stop(play.id);
					}
				}
			}
		},
		fade: function(type, duration, id) {
			if (!this.active) {
				return;
			}

			var id = angular.isDefined(id) ? id : null;
			var duration = angular.isDefined(duration) ? duration : 0;
			var sound = this.sounds[type];
			if (!sound) {
				return;
			}

			if (id) {
				var play = sound.ids[id];
				if (play.timeout) {
					clearTimeout(play.timeout);
				} else {
					sound.howl.fade(1, 0, duration, play.id);
					setTimeout(function() {
						sound.howl.stop(play.id);
					}, duration);
				}
			} else {
				for(var id in sound.ids) {
					var play = sound.ids[id];
					if (play.timeout) {
						clearTimeout(play.timeout);
					} else {
						sound.howl.fade(1, 0, duration, play.id);
						setTimeout(function() {
							sound.howl.stop(play.id);
						}, duration);
					}
				}
			}
		},
		playing: function(type, id) {
			if (!this.active) {
				return false;
			}

			var sound = this.sounds[type];
			if (!sound) {
				return;
			}

			if (id) {
				var play = sound.ids[id];
				if (play.howlId) {
					return sound.howl.playing(play.howlId);
				}
			} else {
				return sound.howl.playing();
			}
		}
	}

	return Sounds;
})