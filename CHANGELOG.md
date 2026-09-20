# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-20

### Added
- Initial release of `frshly`
- Zero-config React wrapper with auto-reload
- Vite, Webpack, and Craco bundler plugins
- Build ID resolution from git, content hash, or timestamp
- Robust version detection with consecutive mismatch threshold
- Reload loop guard to prevent infinite reload cycles
- Multi-tab coordination via BroadcastChannel
- `FrshlyProvider` for advanced control
- `useFrshly` hook for accessing state
- `UpdateBanner` component with customizable styling
- `VersionInfo` component for debug routes
- Comprehensive test suite
- Example Vite + React demo app
