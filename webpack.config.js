const webpack = require("webpack");
const path = require("path");
// プラグインのインポート
const createElectronReloadWebpackPlugin = require("electron-reload-webpack-plugin");
const ChmodWebpackPlugin = require("chmod-webpack-plugin");

// プロジェクト直下のディレクトリを監視させる
const ElectronReloadWebpackPlugin = createElectronReloadWebpackPlugin({
  path: "./",
});

const main = {
  mode: "development",
  target: "electron-main",
  entry: path.join(__dirname, "src", "index"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /.ts?$/,
        include: [path.resolve(__dirname, "src")],
        exclude: [path.resolve(__dirname, "node_modules")],
        loader: "ts-loader",
      },
      { test: /\.node$/, loader: "node-loader" },
      {
        test: /(chrome-cookies)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name]",
            },
          },
        ],
      },
      {
        test: /.(html)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
  // プラグイン起動
  plugins: [
    ElectronReloadWebpackPlugin(),
    new ChmodWebpackPlugin([{ path: "dist/chrome-cookies", mode: 775 }], {
      verbose: true,
      mode: 770,
    }),
  ],
  devtool: "inline-source-map",
};

const renderer = {
  mode: "development",
  target: "electron-renderer",
  entry: path.join(__dirname, "src", "renderer", "index"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist", "scripts"),
  },
  resolve: {
    extensions: [".json", ".js", ".jsx", ".css", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        use: ["ts-loader"],
        include: [path.resolve(__dirname, "src"), path.resolve(__dirname, "node_modules")],
      },
      { test: /\.node$/, loader: "node-loader" },
    ],
  },
  // プラグイン起動
  plugins: [
    ElectronReloadWebpackPlugin(),
    new webpack.ProvidePlugin({
      React: "react",
    }),
  ],
  devtool: "inline-source-map",
};

module.exports = [main, renderer];
