module.exports = {
    proxy: "localhost:8001",
    files: [
        "*.html",
        "*.php", 
        "assets/css/*.css",
        "assets/js/*.js",
        "assets/scss/*.scss"
    ],
    watchOptions: {
        ignoreInitial: true
    },
    port: 8000,
    open: false,
    notify: false,
    logLevel: "info",
    reloadDelay: 300,
    injectChanges: true
};
