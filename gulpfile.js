const gulp = require("gulp");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const del = require("del");
const htmlmin = require("gulp-htmlmin");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const postCssMin = require("postcss-csso");
const autoprefixer = require("autoprefixer");
const imageMin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const webp = require("gulp-webp");
const terser = require("gulp-terser");
const sync = require("browser-sync").create();

// HTML

const html = () => {
  return gulp.src("source/**/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"));
}

exports.html = html;

// Styles

const styles = () => {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer(),
      postCssMin()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}

exports.styles = styles;

// Scripts

const scripts = () => {
  return gulp.src("sources/js/script.js", { allowEmpty: true })
    .pipe(terser())
    .pipe(rename("script.min.js"))
    .pipe(gulp.dest("build.js"))
    .pipe(sync.stream());
}

exports.scripts = scripts;

// Images

const minifyImages = () => {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imageMin([
      imageMin.optipng({ optimizationLevel: 5 }),
      imageMin.mozjpeg({ progressive: true }),
      imageMin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
}

exports.minifyImages = minifyImages;

const copyImages = () => {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(gulp.dest("build/img"));
}

exports.copyImages = copyImages;

// WebP

const createWebP = () => {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({ quality: 75 }))
    .pipe(gulp.dest("build/img"));
}

exports.createWebP = createWebP;

// Sprite

const sprite = () => {
  return gulp.src("source/img/icons/*svg")
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
}

exports.sprite = sprite;

// Copy

const copy = (done) => {
  gulp.src([
    "source/fonts/**/*.{woff2,woff}",
    "source/*.ico"
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build"))
  done();
}

exports.copy = copy;

// Clean

const clean = () => {
  return del("build");
}

exports.clean = clean;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Watcher

const reload = (done) => {
  sync.reload();
  done()
}

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series(styles));
  gulp.watch("source/js/script.js", gulp.series(scripts));
  gulp.watch("source/*.html").on("change", gulp.series(html, reload));
}

// Build

const build = gulp.series(
  clean,
  copy,
  minifyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    createWebP
  ),
);

exports.build = build;

// Dev

exports.default = gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    createWebP
  ),
  gulp.series(
    server,
    watcher
  )
);
