# Security policy

## Supported versions

The latest minor release receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's private reporting: *Security → Report a vulnerability* on https://github.com/6t9xstar/velocita. You'll get an acknowledgement within 3 working days and a fix or mitigation plan within 14 days for confirmed issues.

## Scope notes

- `velocita dev` is a development server. It binds to `127.0.0.1` by default; `--host 0.0.0.0` exposes it to your network. Don't use it to serve production traffic.
- Content and config files are trusted input: `velocita.config.js` and layouts are executed as code at build time.
