# Contributing to ElasticEye

First off, thank you for considering contributing to ElasticEye! It's people like you that make ElasticEye such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [project email].

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for ElasticEye. Following these guidelines helps maintainers and the community understand your report.

Before creating bug reports, please check [this list](../issues) as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**
* **Include your environment details**:
  - OS version
  - ElasticEye version
  - Node.js version
  - Rust version
  - Elasticsearch version

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for ElasticEye.

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain the behavior you expected to see**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the coding style used throughout the project
* Include appropriate test coverage
* Update documentation for significant changes
* End all files with a newline

## Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Local Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
cargo tauri dev
```

### Code Style

* Use TypeScript for frontend code
* Follow the existing code style
* Use meaningful variable and function names
* Add comments for complex logic
* Keep functions small and focused

### Testing

* Write unit tests for new features
* Ensure all tests pass before submitting PR
* Add integration tests for complex features
* Test across different platforms if possible

### Documentation

* Update README.md if needed
* Add JSDoc comments for new functions
* Update API documentation
* Include examples for new features

## Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

## Additional Notes

### Issue and Pull Request Labels

* `bug` - Confirmed bugs or reports likely to be bugs
* `enhancement` - New feature or request
* `documentation` - Documentation only changes
* `help-wanted` - Extra attention is needed
* `good-first-issue` - Good for newcomers

## Recognition

Contributors will be recognized in our README.md and release notes.

Thank you for contributing to ElasticEye! 
