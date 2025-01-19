module.exports = {
    apps: [
        {
            name: "SecretSanta-backend",
            script: "build/main.js",
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 50,
            watch: false,
            max_memory_restart: "1G",
        },
    ],
    deploy: {
        production: {
            user: "github",
            host: "ibns.tech",
            key: "deploy.key",
            ref: "origin/main",
            repo: "https://github.com/unkwntech/eve-secret-santa-backend.git",
            path: "/var/projects/secretsanta-backend-prod/",
            "post-deploy":
                "npm i && tsc -b && pm2 reload ecosystem.config.js --env production --force && pm2 save",
            env: {
                NODE_ENV: "production",
            },
        },
    },
};
