const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const isProd = process.env.NODE_ENV === "production";
const publicPath = isProd ? "dist/" : "/";

module.exports = {
  devtool: isProd ? "source-map" : "inline-source-map",
  mode: process.env.NODE_ENV || "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/i,
        type: "asset/resource",
      },
    ],
  },
  devServer: {
    contentBase: "./",
    publicPath: publicPath,
    host: "0.0.0.0",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  output: {
    publicPath: publicPath,
    path: path.join(__dirname, "dist"),
    filename: "[name]-[chunkhash].js",
  },
  plugins: [
    ...(isProd ? [new CleanWebpackPlugin()] : []),
    new HtmlWebpackPlugin({
      filename: isProd ? path.resolve("./index.html") : "index.html",
      template: "src/index.html",
    }),
  ],
};
