const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  devtool: process.env.NODE_ENV === "production" ? "source-map" : "inline-source-map",
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
    ],
  },
  devServer: {
    contentBase: "./",
    host: "0.0.0.0",
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name]-[chunkhash].js",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: path.resolve("./index.html"),
      template: "src/index.html",
    }),
  ],
};
