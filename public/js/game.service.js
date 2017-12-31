const { start } = require('quizzy')
const { camelCase, capitalize } = require('./string');

module.exports.Game = class Game {
	constructor(type) {
		// The screen actually displayed
		this.screen = 'starting';
		// The preferences of the game
		this.preferences = null;
		// The devices : connected or not
		this.devices = {
			game: false,
			master: false,
			buzzer: false
		};
		// The type of this instance : 'game' or 'master'
		this.type = type;
		// The number of active teams
		this.activatedTeamsCount = 0;
		// The index of the current question
		this.currentQuestionIndex = -1;

		this.eventListeners = {};

		this.teams = [];

		this.questionsCount = 0;
		this.question = null;
		this.nextQuestion = null;
	}

	getPreferences() {
		return this.preferences;
	}

	setPreferences(preferences) {
		this.preferences = preferences;
	}

	addEventListener(event, listener) {
		if (!(event in this.eventListeners)) {
			this.eventListeners[event] = [];
		}
		this.eventListeners[event].push(listener)
	}

	triggerEvent(event, parameters) {
		if (event in this.eventListeners) {
			this.eventListeners[event].map((listener) => listener.call(listener, parameters));
		}
	}

	getDevices() {
		return this.devices;
	}

	setDevices(devices) {
		this.devices = devices;
	}

	setDevice(name, connected) {
		this.devices[name] = connected;
	}

	allDevicesOn() {
		return this.devices.game && 
			this.devices.master && 
			this.devices.buzzer;
	}

	isGame() {
		return this.type == 'game';
	}

	isMaster() {
		return this.type == 'master';
	}

	getScreen() {
		return this.screen;
	}

	setScreen(screen) {
		this.screen = screen;
	}

	setMode(mode) {
		this.send('mode', mode);
	}

	start(startOrContinue, errorFn) {
		if (this.isGame()) {
			start(this.preferences, startOrContinue);
		}

		this.receive('devices', this.devices);
		
		let port = this.preferences.game.port;
		if (this.isMaster()) {
			port = this.preferences.master.port;
		}

		this.ws = new WebSocket("ws://localhost:"+port);
		this.ws.onopen = () => {
			this.send('register', this.type)
		}

		this.ws.onmessage = (event) => {
			let data = JSON.parse(event.data)
			
			for(var property in data) {
				if (data.hasOwnProperty(property)) {
					this.receive(property, data[property]);
				}
			}
		}

		this.ws.onerror = () => {
			errorFn();
		}

		this.ws.onclose = () => {
			errorFn();
		}

	}

	send(key, value) {
		let data = {}
		data[key] = value
		this.ws.send(JSON.stringify(data))
	}

	setTeamName(index, name) {
		this.send('team_name', {
			index: index,
			name: name
		});
	}

	addPoints(points) {
		this.send('points', points)
	}

	continueQuestion() {
		this.send('continue_question', this.currentQuestionIndex)
	}

	getQuestion(questionIndex)  {
		this.send('question', {
			index: questionIndex
		});
	}

	playNextQuestion() {
		//this.question = this.nextQuestion;
		//this.nextQuestion = null;
		//this.currentQuestionIndex += 1;
		this.playQuestion(this.currentQuestionIndex+1, true);
	}

	playQuestion(questionIndex) {
		this.answered = false;
		this.send('play_question', {
			index: questionIndex,
			current: true
		});
	}

	resetTeams() {
		console.log('RESET')
		this.send('reset_teams', null);
	}

	finishGame() {
		this.send('finish_game', null)
	}

	/**
	 * Receive an instruction from server. Calls the method on<InstructionName>
	 */
	receive(key, value) {
		console.log(this.type+' -- receive : '+key, value)
		var method = 'onReceive'+capitalize(camelCase(key));
		this[method].call(this, value);
		this.triggerEvent(key, value);
	}

	onReceiveDevices(devices) {
		this.devices = devices
		if (this.allDevicesOn()) {
			this.screen = 'mode-select';
		} else {
			this.screen = 'devices';
		}
	}
	
	onReceiveScreen(screen) {
		this.screen = screen;
	}

	onReceiveMode(mode) {
		this.mode = mode;
		this.screen = 'team-activation';
	}

	onReceiveTeams(teams) {
		this.teams = teams;
		this.activatedTeamsCount = this.teams.filter(function(team) {
			return team.active
		}).length;
	}

	onReceiveTeam(team) {
		var index = this.findTeamIndex(team)
		this.teams[index] = team;
		if (this.isGame() && team.lightOn) {
			//this.sounds.play('buzz')
		}
		this.activatedTeamsCount = this.teams.filter(function(_team) {
			return _team.active
		}).length;
	}

	onReceiveStart(startParams) {
		this.currentQuestionIndex = (startParams.currentQuestionIndex == -1) ? 0 : startParams.currentQuestionIndex;
		this.questionsCount = startParams.questionsCount;
		console.log(this.type+' -- start '+this.currentQuestionIndex)
		this.setScreen('question');

		if (this.isGame()) {
			this.getQuestion(this.currentQuestionIndex);
		}
	}

	setMakeQuestionComponent(makeQuestionComponent) {
		this.makeQuestionComponent = makeQuestionComponent;
	}

	onReceiveQuestion(data) {
		if (!data.question) {
			// current is last question, no next question
			return;
		}
		console.log(this.type+' -- onReceiveQuestion : ', this.currentQuestionIndex, data.index)
		var question = {
			index: data.index,
			question: data.question,
			ctrl: null,
			attachComponent: null
		};

		let startNow = false;
		if (this.currentQuestionIndex == data.index) {
			// question
			startNow = true;
			console.log(this.type+' -- Set as current question', question)
			this.question = question;
		} else {
			// next question
			console.log(this.type+' -- Set as next question : ', question)
			this.nextQuestion = question;
		}

		if (this.isGame()) {
			this.makeQuestionComponent(question.question).then((componentInfos) => {
				console.log(this.type+ ' -- makeQuestionComponent ', componentInfos)
				question.ctrl = componentInfos.ctrl;
				question.attachComponent = componentInfos.attachComponent;

				if (startNow) {
					this.playQuestion(this.currentQuestionIndex);
				}
			})
		}
	}

	onReceivePlayQuestion(data) {
		
		console.log(this.type+' : onReceivePlayQuestion ', data);
		if (this.nextQuestion && this.nextQuestion.index == data.questionIndex) {
			if (this.isGame()) {
				this.question.ctrl.unload();
			}

			this.question = this.nextQuestion;
			this.nextQuestion = null;
			this.currentQuestionIndex += 1;
		}
		

		if (this.isGame()) {
		
			this.question.attachComponent();
			this.question.ctrl.play();

			// load next...
			this.getQuestion(this.currentQuestionIndex+1);
			
		}
	}

	onReceiveAnswered(data) {
		
		if (this.isGame()) {
			console.log(this.type+ ' : onReceiveAnswered');
			this.question.ctrl.pause();
		}

		this.start = false;
		this.answered = true;

	}

	onReceiveEOG() {
		console.log('EOG !');
		this.screen = 'scores';
		if (this.isGame()) {
			this.question.ctrl.unload();
		}
	}

	totalPoints() {
		let sum = (accumulator, value) => {
			return accumulator + value.points;
		};
		return this.teams.reduce(sum, 0)
	}

	findTeamIndex(team) {
		for(var i=0; i < this.teams.length; i++) {
			if (this.teams[i].id ==team.id) {
				return i;
			}
		}
		return -1;
	}


}