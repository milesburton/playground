const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx', // Ensure this points to your entry .tsx file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '', // Adjust if deploying under a subpath
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // Include .tsx files
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.json', // Ensure it points to your tsconfig.json
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // For CSS support
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: ['file-loader'], // For image assets
      },
    ],
  },
  devServer: {
    static: './dist', // Updated for webpack 5
    port: 8080,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
