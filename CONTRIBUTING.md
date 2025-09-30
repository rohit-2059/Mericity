# Contributing to MeriCity

Thank you for your interest in contributing to MeriCity! This document provides guidelines for contributing to our civic engagement platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Issue Guidelines](#issue-guidelines)
- [Feature Requests](#feature-requests)
- [Security Issues](#security-issues)

## 📜 Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Be respectful and inclusive
- Exercise empathy and kindness
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize community benefit over individual gain

### Unacceptable Behavior

- Harassment, trolling, or discriminatory language
- Publishing private information without consent
- Inappropriate sexual content or advances
- Any conduct that could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas account)
- **Git** for version control
- **Code Editor** (VS Code recommended)
- **Google Cloud Console** account for API keys

### Local Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/Civic-Sense-Crowdsourced-Issue-Reporting.git
   cd Civic-Sense-Crowdsourced-Issue-Reporting
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/rohit-2059/Civic-Sense-Crowdsourced-Issue-Reporting.git
   ```

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env` in both backend and frontend
   - Fill in your API keys and configuration
   - See main README for detailed environment setup

5. **Database Setup**
   ```bash
   cd backend
   node seedDepartments.js
   node seedRewards.js
   ```

## 🔄 Development Process

### Branch Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # OR
   git checkout -b fix/issue-description
   ```

2. **Keep Branch Updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add user notification system"
   ```

### Commit Message Format

Use conventional commits for clear history:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
- `feat(auth): add phone verification system`
- `fix(chat): resolve message ordering issue`
- `docs(api): update endpoint documentation`

### Testing

Before submitting changes:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Manual testing
npm run dev  # Test your changes thoroughly
```

### Code Quality

Ensure your code meets our standards:

```bash
# Lint check
npm run lint

# Format code
npm run format

# Type checking (if TypeScript)
npm run type-check
```

## 🔍 Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update README if needed
   - Add/update API documentation
   - Include inline code comments

2. **Test Thoroughly**
   - Test on multiple browsers
   - Verify mobile responsiveness
   - Check API functionality

3. **Check Requirements**
   - [ ] Code follows project conventions
   - [ ] All tests pass
   - [ ] Documentation updated
   - [ ] No console errors
   - [ ] Mobile-friendly changes

### Submitting PR

1. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use descriptive title
   - Reference related issues (`Fixes #123`)
   - Provide detailed description
   - Include screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement

   ## Testing
   - [ ] Manual testing completed
   - [ ] Unit tests pass
   - [ ] Integration tests pass

   ## Screenshots
   (Include for UI changes)

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### Review Process

1. **Automated Checks**
   - All CI/CD checks must pass
   - Code coverage maintained
   - No security vulnerabilities

2. **Manual Review**
   - Code quality assessment
   - Architecture review
   - User experience evaluation

3. **Feedback Integration**
   - Address reviewer comments
   - Update code as needed
   - Request re-review

## 🎨 Coding Standards

### JavaScript/React Guidelines

```javascript
// Use meaningful variable names
const userComplaintCount = getUserComplaintCount();

// Prefer const/let over var
const API_BASE_URL = process.env.VITE_API_BASE_URL;

// Use arrow functions for simple functions
const formatDate = (date) => new Date(date).toLocaleDateString();

// Component naming
const ComplaintForm = () => {
  // Component logic
};

// Props destructuring
const UserCard = ({ name, email, avatar }) => {
  return <div>...</div>;
};
```

### Backend Standards

```javascript
// Route structure
app.get('/api/complaints', authenticateUser, async (req, res) => {
  try {
    // Route logic
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Model definitions
const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
```

### CSS/Styling

```css
/* Use TailwindCSS utilities */
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

/* Custom CSS when needed */
.custom-component {
  /* Follow BEM methodology */
}
```

### File Organization

```
src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── services/           # API services
└── styles/             # Global styles
```

## 🐛 Issue Guidelines

### Bug Reports

When reporting bugs, include:

1. **Environment Details**
   - OS and version
   - Browser and version
   - Device (mobile/desktop)
   - App version/commit hash

2. **Reproduction Steps**
   ```markdown
   1. Navigate to complaint form
   2. Upload image larger than 5MB
   3. Click submit
   4. Error message appears
   ```

3. **Expected vs Actual Behavior**
   - What should happen
   - What actually happens
   - Screenshots/videos if applicable

4. **Additional Context**
   - Console errors
   - Network requests
   - Related issues

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `priority-high`: Critical issues
- `priority-low`: Nice to have

## 💡 Feature Requests

### Before Requesting

1. **Check Existing Issues**
   - Search open/closed issues
   - Check project roadmap
   - Review documentation

2. **Consider Scope**
   - Does it align with project goals?
   - Is it beneficial for most users?
   - Can it be implemented incrementally?

### Request Format

```markdown
## Problem Statement
Describe the problem this feature would solve

## Proposed Solution
Detail your suggested implementation

## Alternatives Considered
Other approaches you've thought about

## Additional Context
- User stories
- Mockups/wireframes
- Implementation ideas
```

## 🔐 Security Issues

### Reporting Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead:

1. **Email directly**: rohitkhandelwal2059@gmail.com
2. **Include details**:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. **Response timeline**:
   - Acknowledgment: 24-48 hours
   - Initial assessment: 3-5 days
   - Resolution timeline: Based on severity

### Security Best Practices

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication/authorization
- Follow OWASP security guidelines

## 🏆 Recognition

### Contributors

All contributors will be:
- Listed in our contributors section
- Acknowledged in release notes
- Invited to our community discussions

### Significant Contributions

Major contributors may receive:
- Maintainer access
- Special recognition badges
- Reference letters for job applications

## 📞 Community & Support

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: rohitkhandelwal2059@gmail.com for direct contact

### Getting Help

1. **Check Documentation**: README and inline comments
2. **Search Issues**: Look for similar problems
3. **Ask Questions**: Create discussion or issue
4. **Contact Maintainer**: For urgent matters

### Community Guidelines

- Be patient with response times
- Provide context in questions
- Help others when possible
- Share knowledge and learnings

## 📝 License

By contributing to MeriCity, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to MeriCity!** 🙏

Your efforts help build better civic engagement tools for communities everywhere.

For questions about contributing, reach out to **Rohit Khandelwal** at rohitkhandelwal2059@gmail.com