#!/bin/bash
set -e

cat << 'EOF' > /var/www/sat-and-buy-apps/SAT-AND-BUY-STORE/next.config.js
const runtimeCaching = require("next-pwa/cache");
const nextTranslate = require("next-translate");

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
  scope: "/",
  sw: "service-worker.js",
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const config = {
  reactStrictMode: true,
  transpilePackages: ["next-translate", "next-pwa"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
  },
  images: {
    domains: ["res.cloudinary.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  ...nextTranslate(),
};

const originalWebpack = config.webpack;
config.webpack = (webpackConfig, options) => {
  if (typeof originalWebpack === "function") {
    webpackConfig = originalWebpack(webpackConfig, options);
  }

  if (!options.isServer) {
    webpackConfig.resolve = webpackConfig.resolve || {};
    webpackConfig.resolve.fallback = {
      ...webpackConfig.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      net: false,
      tls: false,
      child_process: false,
    };
  }

  return webpackConfig;
};

module.exports = withPWA(config);
EOF

for lang in fr en; do
  file="/var/www/sat-and-buy-apps/SAT-AND-BUY-STORE/locales/$lang/common.json"
  if [ -f "$file" ]; then
    sed -i 's/}$/,"totalI":"Total","itemsFound":"articles trouvés","stock":"Stock","sortByPrice":"Trier par prix","search-placeholder":"Rechercher..."}/' "$file"
  fi
done

docker exec sat-and-buy-apps-mongo-1 mongosh --eval "db.getSiblingDB('satandbuy_settings').settings.updateOne({name: 'storeSetting'}, {\$set: {setting: {favicon: '/favicon.png', logo_url: '/logo.png', meta_title: 'Sat & Buy', meta_description: 'E-commerce' }}})"

cd /var/www/sat-and-buy-apps/
docker compose build store
docker compose up -d store

echo "FIX_COMPLETED"
