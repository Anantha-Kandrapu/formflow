const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    watch: true,
    entry: {
        popup: './src/popup/popup.js',
        background: './src/background/background.js',
        content: './src/content/content.js',
        driveService: './src/utils/driveService.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: false  // Prevents eval() usage in the output
    },
    devtool: false,  // Prevents eval() usage in source maps
    resolve: {
        extensions: ['.js']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "src/popup/popup.html", to: "popup.html" },
                { from: "src/popup/popup.css", to: "popup.css" }
            ],
        }),
    ]
};
