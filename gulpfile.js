'use strict'
require('./build/check-versions')()

process.env.NODE_ENV = 'production'

const ora = require('ora')
const rm = require('rimraf')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const config = require('./config')
const webpackConfig = require('./build/webpack.prod.conf')
const gulp = require('gulp');

const spinner = ora('building for production...')
spinner.start()


function build (callback) {
  rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
    if (err) throw err
    webpack(webpackConfig, (err, stats) => {
      spinner.stop()
      if (err) throw err
      callback()
    })
  })
}

function clean(cb) {
  // body omitted
  cb();
}

// gulp.task('watch', function () {
//   return gulp.watch('src/**', gulp.series(clean, build))
// })

gulp.task('default', function () {
  gulp.watch('src/**', gulp.series(clean, build))
})
