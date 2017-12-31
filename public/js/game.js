const { preferencesScreenComponent } = require('./preferences-screen.component');
const { progressBarComponent } = require('./progress-bar.component');
const { devicesScreenComponent } = require('./devices-screen.component');
const { startingScreenComponent } = require('./starting-screen.component');
const { uiComponent } = require('./ui.component');
const { modeScreenComponent } = require('./mode-screen.component');
const { teamActivationScreenComponent } = require('./team-activation-screen.component');
const { questionScreenComponent } = require('./question-screen.component');
const { scoresScreenComponent } = require('./scores-screen.component');
const { teamsComponent } = require('./teams.component');
const { BlindQuestionComponent } = require('./question_handler/blind-question.component');
const { DeafQuestionComponent } = require('./question_handler/deaf-question.component');

angular.module('game', ['sounds'])
	.component('ui', uiComponent)
	.component('preferencesScreen', preferencesScreenComponent)
	.component('devicesScreen', devicesScreenComponent)
	.component('startingScreen', startingScreenComponent)
	.component('modeScreen', modeScreenComponent)
	.component('teamActivationScreen', teamActivationScreenComponent)
	.component('questionScreen', questionScreenComponent)
	.component('scoresScreen', scoresScreenComponent)
	.component('teams', teamsComponent)
	.component('progressBar', progressBarComponent)
	.component('blindQuestion', BlindQuestionComponent)
	.component('deafQuestion', DeafQuestionComponent)
;
