module.exports = {
    apps: [
        {
            name: "care4success-api",
            script: "server/index.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env_production: {
                NODE_ENV: "production",
                API_PORT: 4000
            }
        }
    ]
};
