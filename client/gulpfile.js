// Include gulp
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;
var bump = require('gulp-bump');
var args = require('yargs').argv;

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

gulp.task('compile_typescript', function (callback) {
  exec('tsc -p ./',
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      callback;
    });
})


gulp.task('build', function (callback) {
  runSequence('clean','copy_language_server','compile_typescript',callback);
})

gulp.task('bump', function () {
    /// <summary>
    /// It bumps revisions
    /// Usage:
    /// 1. gulp bump : bumps the package.json and bower.json to the next minor revision.
    ///   i.e. from 0.1.1 to 0.1.2
    /// 2. gulp bump --version 1.1.1 : bumps/sets the package.json and bower.json to the
    ///    specified revision.
    /// 3. gulp bump --type major       : bumps 1.0.0
    ///    gulp bump --type minor       : bumps 0.1.0
    ///    gulp bump --type patch       : bumps 0.0.2
    ///    gulp bump --type prerelease  : bumps 0.0.1-2
    /// </summary>

    var type = args.type;
    var version = args.version;
    var options = {};
    if (version) {
        options.version = version;
    } else {
        options.type = type;
    }

    return gulp
        .src(['package.json'])
        .pipe(bump(options))
        .pipe(gulp.dest('.'));
});
