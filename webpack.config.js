const CopyWebpackPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
    entry: { main: './src/main.ts', popup: './src/popup.ts', background: './src/background.ts' },
    output: {
        filename: '[name].js',
    },
    mode: isProd ? 'production' : 'development',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            isDev && {
                test: /\.js$/,
                enforce: 'pre',
                loader: 'source-map-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },

    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: 'static' }],
        }),
    ],
    devtool: isDev ? 'source-map' : undefined,
};
