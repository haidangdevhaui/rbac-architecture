import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

export default defineConfig({
  entry: "./src/index.ts",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                },
              },
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    port: 3002,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
    },
  },
  output: {
    publicPath: "auto",
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "integrationApp",
      filename: "remoteEntry.js",
      manifest: true,
      dts: false,
      exposes: {
        "./IntegrationApp": "./src/IntegrationApp.tsx",
        "./LegacySyncWidget": "./src/LegacySyncWidget.tsx",
      },
      shared: {
        react: { singleton: true, eager: false, requiredVersion: "^18.3.0" },
        "react-dom": { singleton: true, eager: false, requiredVersion: "^18.3.0" },
        "@enterprise/shared-ui": { singleton: true },
      },
    }),
    new rspack.HtmlRspackPlugin({
      templateContent: `
        <!DOCTYPE html>
        <html lang="vi">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Team 2: Integration Remote (Standalone Dev)</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div id="root"></div>
          </body>
        </html>
      `,
    }),
  ],
});
