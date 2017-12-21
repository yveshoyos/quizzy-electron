'use strict';

import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import concat from 'gulp-concat';

gulp.task('es6', () =>
    gulp.src(['electron.js'])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['env']
        }))
        //.pipe(concat('node-buzzer.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('es5'))
);


gulp.task('watch', () => {
    gulp.watch(['*.js'], ['es6']);
});

gulp.task('default', ['es6', 'watch']);