const { preferencesComponent } = require('./preferences.component');
const { progressBarComponent } = require('./progress-bar.component');
const { devicesComponent } = require('./devices.component');
const { uiComponent } = require('./ui.component');

angular.module('game', ['sounds'])
.component('ui', uiComponent)
.component('preferences', preferencesComponent)
.component('progressBar', progressBarComponent)
.component('devices', devicesComponent);
