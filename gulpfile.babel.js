'use strict'

import gulp from 'gulp'
import del from 'del'
import runSequence from 'run-sequence'
import gulpLoadPlugins from 'gulp-load-plugins'
import { spawn } from "child_process"
import tildeImporter from 'node-sass-tilde-importer'
import hash from 'gulp-hash'

const $ = gulpLoadPlugins()
const browserSync = require('browser-sync').create()
const isProduction = process.env.NODE_ENV === 'production'

const onError = (err) => {
    console.log(err)
}

// --

gulp.task('server', ['build'], () => {
    gulp.start('init-watch')
    $.watch(['archetypes/**/*', 'data/**/*', 'content/**/*', 'layouts/**/*', 'static/**/*', 'config.toml'], () => gulp.start('hugo'))
});

gulp.task('server:with-drafts', ['build-preview'], () => {
    gulp.start('init-watch')
    $.watch(['archetypes/**/*', 'data/**/*', 'content/**/*', 'layouts/**/*', 'static/**/*', 'config.toml'], () => gulp.start('hugo-preview'))
});

gulp.task('init-watch', () => {
    browserSync.init({
        server: {
            baseDir: 'public'
        },
        open: false
    })
    $.watch('src/sass/**/*.scss', () => gulp.start('sass'))
    $.watch('src/js/**/*.js', () => gulp.start('js-watch'))
    $.watch('src/images/**/*', () => gulp.start('images'))
})

gulp.task('build', () => {
    runSequence(['sass', 'js', 'fonts', 'images', 'pub-delete'], 'hugo')
})

gulp.task('build-preview', () => {
    runSequence(['sass', 'js', 'fonts', 'images', 'pub-delete'], 'hugo-preview')
})

gulp.task('hugo', (cb) => {
    return spawn('hugo', { stdio: 'inherit' }).on('close', (code) => {
        browserSync.reload()
        cb()
    })
})

gulp.task('hugo-preview', (cb) => {
    return spawn('hugo', ['--buildDrafts', '--buildFuture'], { stdio: 'inherit' }).on('close', (code) => {
        browserSync.reload()
        cb()
    })
})

// --

gulp.task('sass', () => {

    del(["static/css/**/*"])

    gulp.src("src/scss/**/*.scss")
    .pipe($.plumber({ errorHandler: onError }))
    .pipe($.print())
    // .pipe($.sassLint({configFile: '.sass-lint.yml'}))
    // .pipe($.sassLint.format())
    .pipe($.sass({ precision: 5, importer: tildeImporter, outputStyle: 'compressed'}))
    .pipe($.autoprefixer(['ie >= 10', 'last 2 versions']))
    // .pipe(hash())
    // .pipe(gulp.dest("static/css"))
    .pipe($.stylelint({
        reporters: [
          {formatter: 'string', console: true, save: 'gbbns-co-errors.txt'}
        ]
      }))
    // .pipe(hash.manifest("hash.json"))
    // .pipe(gulp.dest("data/styles"))
    // .pipe($.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest('static/css'))
    .pipe(browserSync.stream())
})

gulp.task('js-watch', ['js'], (cb) => {
    browserSync.reload();
    cb();
});

gulp.task('js', () => {
    return gulp.src([
        'src/js/**/*.js'
    ])
    .pipe($.plumber({ errorHandler: onError }))
    .pipe($.print())
    .pipe($.babel())
    .pipe($.concat('app.js'))
    .pipe($.if(isProduction, $.uglify()))
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest('static/js'))
})

gulp.task('fonts', () => {
    return gulp.src('src/fonts/**/*.{woff,woff2}')
        .pipe(gulp.dest('static/fonts'));
});

gulp.task('images', () => {
    return gulp.src('src/images/**/*.{png,jpg,jpeg,gif,svg,webp,ico}')
        .pipe($.newer('static/images'))
        .pipe($.print())
        .pipe($.imagemin())
        .pipe(gulp.dest('static/images'));
});


gulp.task('pub-delete', () => {
    return del(['public/**', '!public'], {
      // dryRun: true,
      dot: true
    }).then(paths => {
      console.log('Files and folders deleted:\n', paths.join('\n'), '\nTotal Files Deleted: ' + paths.length + '\n');
    })
})
