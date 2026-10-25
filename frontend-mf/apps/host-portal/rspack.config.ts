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
    port: 3000,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  output: {
    publicPath: "auto",
  },
  plugins: [
    new rspack.DefinePlugin({
      "process.env": JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || "development",
        KEYCLOAK_URL: process.env.KEYCLOAK_URL || "http://localhost:8180",
      }),
      "process.env.KEYCLOAK_URL": JSON.stringify(process.env.KEYCLOAK_URL || "http://localhost:8180"),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    }),
    new ModuleFederationPlugin({
      name: "shellPortal",
      dts: false,
      remotes: {
        approvalApp: "approvalApp@http://localhost:3001/mf-manifest.json",
        integrationApp: "integrationApp@http://localhost:3002/mf-manifest.json",
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: "^18.3.0" },
        "react-dom": { singleton: true, eager: true, requiredVersion: "^18.3.0" },
        "@enterprise/shared-ui": { singleton: true },
      },
    }),
    new rspack.HtmlRspackPlugin({
      filename: "index.html",
      chunks: ["main"],
      templateContent: `
        <!DOCTYPE html>
        <html lang="vi">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Portal (Module Federation 2.0 Host)</title>
            <script>window.process = window.process || { env: { NODE_ENV: 'development', KEYCLOAK_URL: 'http://localhost:8180' } };</script>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div id="root"></div>
          </body>
        </html>
      `,
    }),
    new rspack.HtmlRspackPlugin({
      filename: "silent-check-sso.html",
      chunks: [],
      inject: false,
      templateContent: `<!DOCTYPE html>
<html>
  <body>
    <script>
      parent.postMessage(location.href, location.origin);
    </script>
  </body>
</html>`,
    }),
  ],
});
