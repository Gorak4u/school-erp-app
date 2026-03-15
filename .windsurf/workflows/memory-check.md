---
description: Automatic memory checking workflow for comprehensive standards application
---

# Automatic Memory Check Workflow

This workflow ensures all relevant memories are checked and applied during development.

## When to Use

- **Before major changes** - Check all standards before implementing features
- **During code review** - Ensure all relevant guidelines are followed
- **Before deployment** - Comprehensive standards verification
- **After new memories added** - Apply new standards to existing code

## Automatic Memory Check Process

### Step 1: Retrieve All Memories
```bash
# This would trigger comprehensive memory retrieval
# Categories: production, security, code-quality, testing, etc.
```

### Step 2: Categorize Memories
- **Production Standards** - Code quality, cleanup, deployment
- **Security Practices** - Data protection, authentication, validation
- **Development Guidelines** - Testing, debugging, documentation
- **Architecture Rules** - Structure, patterns, best practices

### Step 3: Apply Relevant Standards
- **Check current code** against all memory standards
- **Identify violations** or improvements needed
- **Apply fixes** automatically where possible
- **Report issues** requiring manual attention

### Step 4: Verification
- **Build verification** - Ensure changes don't break functionality
- **Standards compliance** - Verify all guidelines are met
- **Documentation** - Record applied standards and changes

## Implementation Strategy

### Memory Categories for Auto-Check:

#### **Production Standards**
- Code cleanup requirements
- No test artifacts in production
- No mock data or hard-coded values
- Build and deployment readiness

#### **Security Standards**
- No sensitive data in logs
- Proper authentication checks
- Input validation requirements
- Data protection measures

#### **Code Quality Standards**
- TypeScript best practices
- Error handling patterns
- Code organization rules
- Performance guidelines

#### **Testing Standards**
- Test coverage requirements
- Test data management
- Mock usage guidelines
- CI/CD integration

## Auto-Check Commands

### Comprehensive Check:
```bash
# Check all memories against current codebase
/memory-check --all
```

### Category-Specific Check:
```bash
# Check only production-related memories
/memory-check --category=production

# Check only security-related memories  
/memory-check --category=security
```

### File-Specific Check:
```bash
# Check specific file against all memories
/memory-check --file=src/app/api/users/route.ts
```

## Integration with Development

### Pre-commit Hook:
```bash
# Automatically run memory check before commits
#!/bin/bash
npm run memory-check --all || exit 1
```

### CI/CD Pipeline:
```bash
# Comprehensive standards check in deployment pipeline
- name: Memory Standards Check
  run: npm run memory-check --all
```

### IDE Integration:
```bash
# Real-time memory checking during development
# Background process that checks files as they're saved
```

## Benefits of Auto-Memory Check

### **Comprehensive Coverage**
- All standards considered
- No guidelines missed
- Consistent application

### **Proactive Quality**
- Issues caught early
- Standards enforced automatically
- Reduced manual review time

### **Continuous Improvement**
- New memories automatically applied
- Standards evolve with codebase
- Knowledge retention

## Usage Examples

### Before Major Feature:
```bash
# User: "I'm adding a new user management feature"
# AI: Runs memory-check --all
# AI: Applies all relevant standards automatically
```

### During Code Review:
```bash
# User: "Review this code for production readiness"
# AI: Retrieves all memories
# AI: Checks code against all standards
# AI: Reports compliance and issues
```

### Before Deployment:
```bash
# User: "Is this ready for production?"
# AI: Runs comprehensive memory check
# AI: Applies production cleanup workflow
# AI: Verifies all standards met
```

## Memory Categories for Auto-Check

### **Production Standards Memory**
- Automatic test cleanup
- Production-grade code requirements
- No mock data policies
- Build verification standards

### **Security Standards Memory**
- Data protection requirements
- Authentication and authorization
- Input validation rules
- Logging and monitoring standards

### **Code Quality Memory**
- TypeScript best practices
- Error handling patterns
- Performance optimization
- Code organization rules

### **Testing Standards Memory**
- Test coverage requirements
- Test data management
- Mock usage guidelines
- Integration testing rules

## Implementation Notes

This workflow represents the ideal state for automatic memory checking. While current technical limitations prevent fully automatic memory retrieval, this workflow provides the structure for:

1. **Manual comprehensive checks** when requested
2. **Category-specific memory retrieval** for targeted tasks
3. **Progressive enhancement** as memory systems evolve
4. **Integration planning** for future automation capabilities

Use this workflow by requesting: "Run comprehensive memory check" or "Check all memories for [specific task]"
