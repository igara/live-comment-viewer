const webpack = require("webpack");
const path = require("path");
// プラグインのインポート
const createElectronReloadWebpackPlugin = require("electron-reload-webpack-plugin");
const ChmodWebpackPlugin = require("chmod-webpack-plugin");

// プロジェクト直下のディレクトリを監視させる
const ElectronReloadWebpackPlugin = createElectronReloadWebpackPlugin({
  path: "./",
});

const { TypedCssModulesPlugin } = require("typed-css-modules-webpack-plugin");

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
        test: /.(html|vrm|png)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "pages/[folder]/[name].[ext]",
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
  entry: {
    "index/index": path.join(__dirname, "src", "pages", "index", "index.tsx"),
    "vrm/index": path.join(__dirname, "src", "pages", "vrm", "index.tsx"),
    "comment/index": path.join(__dirname, "src", "pages", "comment", "index.tsx"),
  },
  output: {
    path: path.resolve(__dirname, "dist", "pages"),
    filename: "[name].js",
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
      {
        test: /\.css$/i,
        loaders: ["style-loader", "css-loader?modules"],
      },
    ],
  },
  // プラグイン起動
  plugins: [
    ElectronReloadWebpackPlugin(),
    new webpack.ProvidePlugin({
      React: "react",
    }),
    new TypedCssModulesPlugin({
      globPattern: "src/pages/**/*.css",
    }),
  ],
  devtool: "inline-source-map",
};

module.exports = [main, renderer];
