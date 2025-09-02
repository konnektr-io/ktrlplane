# ktrlplane Documentation

Welcome to the ktrlplane documentation. This directory contains comprehensive guides for using, deploying, and developing ktrlplane.

## Table of Contents

- [Getting Started](getting-started.md) - Quick start guide
- [Development](development.md) - Local development setup
- [API Reference](api-reference.md) - REST API documentation
- [Deployment](deployment.md) - Production deployment guide
- [Architecture](architecture.md) - System architecture overview

## Development Planning

- [Development Plan](development-plan.md) - Comprehensive 3-phase development roadmap  
- [Task Tracker (Simplified)](tasks-simplified.md) - Current actionable tasks with weekly breakdown
- [Task Tracker (Detailed)](tasks.md) - Original detailed task tracking

### 🎯 Current Focus: Enhanced Resource Management

**Key Insight**: Using [db-query-operator](https://github.com/konnektr-io/db-query-operator) greatly simplifies our approach:

1. **Store JSON schemas in UI** for dynamic form generation
2. **Store minimal settings** in existing `settings_json` column  
3. **Let operator handle** all deployment complexity
4. **No complex database changes** needed!

**Ready to start**: Week 1 tasks - frontend schema system and dynamic forms.

## Quick Links

- [Installation](deployment.md#installation)
- [Configuration](deployment.md#configuration)
- [API Documentation](api-reference.md)
- [Contributing](development.md#contributing)

## Need Help?

- Check the [FAQ](faq.md)
- Submit issues on GitHub
- See [troubleshooting guide](troubleshooting.md)
