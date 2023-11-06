const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

let publish_folder;
let output_folder;
let source_vue_folder = './';
let source_assets_folder = "../Resources/assets/";


if (mix.inProduction()) {
    /*
     |--------------------------------------------------------------------------
     | Only in Production
     |--------------------------------------------------------------------------
     */
    console.log('---------------------');
    console.log('IN PRODUCTION MODE');
    console.log('---------------------');

    publish_folder = './../Resources/assets/';
    output_folder = "./";
    mix.setPublicPath(publish_folder);

    //mix.sass(source_assets_folder+'/scss/build.scss', output_folder+'css/');
    //mix.sass(source_assets_folder+'/scss/style.scss', output_folder+'css/');

    //To js minification
    let jses = [
        './../Resources/assets/js/VueScripts.js',
    ];

    mix.js(jses,  output_folder+'/build/script.js');

    mix.js(source_vue_folder+"/app.js",  output_folder+'/build/app.js').vue();

} else {

    publish_folder = './../../../..public/vaahcms/themes/';
    mix.setPublicPath(publish_folder);

    output_folder = "./blog/assets/";

    //mix.sass(source_assets_folder+'/scss/build.scss', output_folder+'css/');
    //mix.sass(source_assets_folder+'/scss/style.scss', output_folder+'css/');

    //To js minification
    let jses = [
        './../Resources/assets/js/VueScripts.js',
    ];

    mix.js(jses,  output_folder+'/build/script.js');

    mix.js(source_vue_folder+"/app.js",  output_folder+'/build/app.js').vue();
}

mix.options({
    hmrOptions: {
        host: 'localhost',
        port: 8541,
    },
});

mix.webpackConfig({

    watchOptions: {

        aggregateTimeout: 2000,
        poll: 1000,
        ignored: [
            '**/*.php',
            '**/node_modules',
            '/Config/',
            '/Database/',
            '/Helpers/',
            '/Http/',
            '/jobs/',
            '/Libraries/',
            '/Mails/',
            '/Models/',
            '/node_modules/',
            '/Notifications/',
            '/Providers/',
            '/Resources/',
            '/Routes/',
            '/Tests/',
            '/Wiki/',
        ]
    }
});
