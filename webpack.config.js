var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
     entry: {
        "/content/scripts/skye-widget": "./src/skye-widget.ts",
        "/content/scripts/skye-calc": "./src/skye-calc.ts",
        "/content/scripts/skye-landing": "./src/skye-landing.ts",
     },
     output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js"
    },
     resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.js']
     },
     module: {
        rules: [
            { 
            	test: /\.css$/,
        		use: ['style-loader', 'css-loader']
            },
            { test: /\.ts?$/, loader: 'ts-loader'}
        ]
     },
     plugins: [
        new CopyWebpackPlugin([
            {
                from : './src/fonts/',
                to : './content/fonts'
            },
            {
                from : './src/html/',
                to : './content/html'
            },
            {
                from : './src/images/',
                to : './content/images'
            },
            {
                from : './src/styles/',
                to : './content/styles'
            },
            {
                from : './src/images/',
                to : './content/images'
            }
        ]),
        new webpack.SourceMapDevToolPlugin({
            test: /\.js$/,
            filename: "[name].map.js"
        }),
        new MiniCssExtractPlugin()
    ],
    optimization: {
        minimizer: [new UglifyJsPlugin()]
  	}
}
