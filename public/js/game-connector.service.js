function gameConnector($q) {
	
	this.ws = null;

	this.initialize(port) {
		let deferred = $q.defer();

		this.ws = new WebSocket("ws://localhost:"+port);

		this.ws.onopen = () => {
			this.deferred.resolve();
		}

		this.ws.onerror = () => {
			this.deferred.reject('Can\'t connect to game server');
		}

		return deferred.promise;
	}

	this.on = function(event) {
		
	}

}

module.exports.gameConnector = ['$q', gameConnector];