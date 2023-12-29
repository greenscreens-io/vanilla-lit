/**
 * Install tools
 * npm install rollup -g
 * npm install terser -g
 * npm install rollup-plugin-sourcemaps --save-dev
 * npm install rollup-plugin-terser --save-dev
 * 
 * then call "rollup -c" from command line
 */

import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import gsExtern from './rollup-plugin-gs-extern.js'

console.log((new Date()).toLocaleString());

const devMode = (process.env.NODE_ENV === 'development');
console.log(`${devMode ? 'development' : 'production'} mode bundle`);

const minesm = terser({
    ecma: 2022,
    keep_classnames: false,
    keep_fnames: false,
    module: true,
    toplevel: false,
    mangle: {
        toplevel: true,
        keep_classnames: true,
        keep_fnames: true
    },
    compress: {
        module: true,
        toplevel: true,
        unsafe_arrows: true,
        keep_classnames: true,
        keep_fnames: true,
        drop_console: !devMode,
        drop_debugger: !devMode
    },
    output: { quote_style: 1 }
});


const reactive = {
    input: 'modules/core/index.mjs',
    output: [
        { file: 'release/io.greenscreens.reactive.min.js', format: 'esm', sourcemap: true, plugins: [minesm, sourcemaps] }
    ],
    plugins: [

    ]
}

const all = {
    input: 'modules/index.mjs',
    output: [
        { file: 'release/io.greenscreens.reactive.all.min.js', format: 'esm', sourcemap: true, plugins: [minesm, sourcemaps] }
    ],
    plugins: [

    ]
}

const html = {
    input: 'modules/html/index.mjs',
    output: [
        { file: 'release/io.greenscreens.html.all.min.js', format: 'esm', sourcemap: true, plugins: [minesm, sourcemaps] }
    ],
    plugins: [

    ]
}

//export default [reactive, all, html]; 

const vanilla = {
    input: 'modules/index.mjs',
    output: [
        { file: 'release/vanilla-lit-all.min.js', format: 'esm', sourcemap: true, plugins: [minesm, sourcemaps] }
    ],
    plugins: [

    ]
}

export default [vanilla]; 

