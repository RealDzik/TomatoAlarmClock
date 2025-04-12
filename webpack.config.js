const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|mp3)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        mainFields: ['main', 'module', 'browser'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/renderer'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/renderer/index.html',
            filename: 'index.html'
        }),
    ],
}; 