module.exports.questionScreenComponent = {
	bindings: {
		game: '='
	},
	controllerAs: '$ctrl',
	controller: ['$scope', '$compile', '$q', '$element', function(scope, $compile, $q, $element) {

		this.game.setMakeQuestionComponent(makeQuestionComponent);

		function makeQuestionComponent(question) {
			let deferred = $q.defer();

			let subScope = scope.$new();
			let ctrl = null;
			subScope.question = question;

			subScope.preloaded = (fn) => {
				deferred.resolve({ ctrl: ctrl, attachComponent: attach});
			}
			subScope.setCtrl = (_ctrl) => {
				ctrl = _ctrl;
			}

			let componentName = question.type+'-question';
			let tpl = '<'+componentName+' question="question" preloaded="preloaded(fn)" set-ctrl="setCtrl(ctrl)"></'+componentName+'>'
			let component = $compile(tpl)(subScope);

			//console.log('component : ', component);

			//console.log('===>', $element[0].querySelector('.question .content'), $element.find('.question'))

			function attach() {
				angular.element($element[0].querySelector('.question .content'))
					.html('')
					.append(component);
			}


			return deferred.promise;
		}

		this.validateAnswer = (points) => {
			// Only the master is authorized to set the points
			if (!this.game.isMaster()) {
				return;
			}

			// Master can only set points when an answer is given
			if (!this.game.answered) {
				console.log('not answered')
				return;
			}

			console.log('send points')
			this.game.addPoints(points);
		}

		this.continueQuestion = function() {
			if (!this.game.isMaster()) {
				return;
			}
			this.game.continueQuestion();
		}

		this.goNextQuestion = function() {
			if (!this.game.isMaster()) {
				return;
			}
			
			console.log('goNextQuestion : ', this.game.currentQuestionIndex+1, this.game.questionsCount)
			//if (this.game.currentQuestionIndex+1 < this.game.questionsCount) {
				this.game.playNextQuestion();
			//} else {
				//this.game.finishGame();
			//
		}

		this.resetTeams = function() {
			if (!this.game.isMaster()) {
				return;
			}

			this.game.resetTeams();
		}



		
	}],
	templateUrl: 'public/template/question-screen.component.html'
};