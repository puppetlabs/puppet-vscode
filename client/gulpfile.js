// Include gulp
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;

// The default task (called when you run `gulp` from cli) 
gulp.task('default', ['build']);

gulp.task('clean', function () {
  return del(['vendor'])
})

gulp.task('copy_language_server', function () {
  return gulp.src(['../server/lib/**/*',
                   '../server/vendor/**/*',
                   '../server/puppet-languageserver'
                  ], { base: '../server'})
             .pipe(gulp.dest('./vendor/languageserver'));
})

gulp.task('build_extension', function (callback) {
  exec('node ./node_modules/vsce/out/vsce package',
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      callback;
    });
})


gulp.task('build', function (callback) {
  runSequence('clean','copy_language_server','build_extension',callback);
})

