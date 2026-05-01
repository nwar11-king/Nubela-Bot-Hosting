{
  "channel": "stable",
  "packages": [
    "nodejs_20"
  ],
  "idx": {
    "extensions": [],
    "workspace": {
      "onCreate": {
        "npm-install": "npm install"
      },
      "onStart": {
        "dev": "npm run dev"
      }
    },
    "previews": {
      "enable": true,
      "previews": {
        "web": {
          "command": [
            "npm",
            "run",
            "dev",
            "--",
            "--port",
            "$PORT",
            "--host",
            "0.0.0.0"
          ],
          "manager": "web"
        }
      }
    }
  }
}
