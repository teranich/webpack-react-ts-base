const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const port = process.env.PORT || 2021;
const paths = {
    public: path.resolve(__dirname, '../public'),
    src: path.resolve(__dirname, '../src'),
    build: path.resolve(__dirname, '../build'),
};
const { isDevBuild, devOnly, prodOnly, removeEmpty, getClientEnvironment } = require('./utils');
const env = getClientEnvironment(paths.public.slice(0, -1));

module.exports = {
    target: isDevBuild() ? 'web' : 'browserslist',
    mode: isDevBuild() ? 'development' : 'production',
    bail: !isDevBuild(), // Don't attempt to continue if there are any errors.
    devServer: devOnly({
        hot: true,
        open: false,
        port,
        // disableHostCheck: true,
        historyApiFallback: { disableDotRule: true },
        compress: true,
    }),
    devtool: 'source-map', // 'eval-cheap-module-source-map',
    entry: `${paths.src}/index.tsx`,
    output: {
        path: paths.build,
        filename: '[name].bundle.js',
        // Point sourcemap entries to original disk location (format as URL on Windows)
        devtoolModuleFilenameTemplate: (info) =>
            path.relative(paths.src, info.absoluteResourcePath).replace(/\\/g, '/'),
    },
    resolve: {
        modules: [paths.src, 'node_modules'],
        extensions: [
            '.web.ts',
            '.ts',
            '.web.tsx',
            '.tsx',
            '.web.js',
            '.js',
            '.json',
            '.web.jsx',
            '.jsx',
        ],
        alias: {
            theme: `${paths.src}/theme.ts`,
        },
    },
    module: {
        rules: removeEmpty([
            {
                test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
                type: 'asset/inline',
            },
            {
                test: /\.(scss|css)$/,
                use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
            },
            {
                test: [/\.ts$/, /\.tsx$/],
                include: paths.src,
                loader: require.resolve('ts-loader'),
                options: {
                    transpileOnly: true,
                    getCustomTransformers: () => ({
                        before: removeEmpty([devOnly(ReactRefreshTypeScript())]),
                    }),
                },
            },
        ]),
    },
    experiments: {
        asset: true,
    },
    plugins: removeEmpty([
        new webpack.DefinePlugin(env.stringified),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(`${paths.public}`, './index.html'),
            minimizer: prodOnly(
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            comparisons: false,
                            inline: 2,
                        },
                        keep_classnames: true,
                        keep_fnames: true,
                        output: {
                            ecma: 5,
                            comments: false,
                            ascii_only: true,
                        },
                    },
                }),
            ),
        }),
        new WebpackManifestPlugin({
            fileName: 'manifest.json',
        }),
        devOnly(new ReactRefreshPlugin({ overlay: false })),
    ]),
    performance: devOnly({
        hints: false,
    }),
};
