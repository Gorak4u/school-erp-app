# 🎨 Style Guide - School Management ERP

## 🎯 **Overview**

Comprehensive style guide for the School Management ERP platform, defining **visual standards**, **design principles**, and **usage guidelines** to ensure **consistency** and **professionalism** across all user interfaces.

---

## 🌈 **Color System**

### **🎨 Primary Colors**
```yaml
Primary Blue:
  50: #E3F2FD
  100: #BBDEFB
  200: #90CAF9
  300: #64B5F6
  400: #42A5F5
  500: #2196F3  # Primary
  600: #1E88E5
  700: #1976D2
  800: #1565C0
  900: #0D47A1

Usage:
  - Primary buttons
  - Links
  - Active states
  - Primary actions
  - Brand elements

Secondary Blue:
  50: #E1F5FE
  100: #B3E5FC
  200: #81D4FA
  300: #4FC3F7
  400: #29B6F6
  500: #03A9F4  # Secondary
  600: #039BE5
  700: #0288D1
  800: #0277BD
  900: #01579B

Usage:
  - Secondary buttons
  - Accent elements
  - Supporting actions
  - Visual hierarchy
```

### **🎯 Semantic Colors**
```yaml
Success Green:
  50: #E8F5E8
  100: #C8E6C9
  200: #A5D6A7
  300: #81C784
  400: #66BB6A
  500: #4CAF50  # Success
  600: #43A047
  700: #388E3C
  800: #2E7D32
  900: #1B5E20

Usage:
  - Success messages
  - Completed states
  - Positive feedback
  - Achievement indicators

Warning Orange:
  50: #FFF3E0
  100: #FFE0B2
  200: #FFCC80
  300: #FFB74D
  400: #FFA726
  500: #FF9800  # Warning
  600: #FB8C00
  700: #F57C00
  800: #EF6C00
  900: #E65100

Usage:
  - Warning messages
  - Attention states
  - Pending actions
  - Caution indicators

Error Red:
  50: #FFEBEE
  100: #FFCDD2
  200: #EF9A9A
  300: #E57373
  400: #EF5350
  500: #F44336  # Error
  600: #E53935
  700: #D32F2F
  800: #C62828
  900: #B71C1C

Usage:
  - Error messages
  - Failed states
  - Critical alerts
  - Invalid inputs

Info Blue:
  50: #E3F2FD
  100: #BBDEFB
  200: #90CAF9
  300: #64B5F6
  400: #42A5F5
  500: #2196F3  # Info
  600: #1E88E5
  700: #1976D2
  800: #1565C0
  900: #0D47A1

Usage:
  - Information messages
  - Help text
  - Tooltips
  - Guidance
```

### **⚫ Neutral Colors**
```yaml
Gray Scale:
  50: #FAFAFA   # Background
  100: #F5F5F5  # Light background
  200: #EEEEEE  # Borders
  300: #E0E0E0  # Dividers
  400: #BDBDBD  # Disabled
  500: #9E9E9E  # Placeholder
  600: #757575  # Secondary text
  700: #616161  # Primary text
  800: #424242  # Headings
  900: #212121  # Emphasis

Usage:
  50: Page backgrounds, cards
  100: Section backgrounds
  200: Borders, dividers
  300: Subtle borders
  400: Disabled elements
  500: Placeholder text
  600: Secondary text
  700: Primary text
  800: Headings
  900: Emphasis, bold text

White & Black:
  White: #FFFFFF    # Pure white
  Black: #000000    # Pure black

Usage:
  White: Backgrounds, cards
  Black: Text, borders
```

### **🎨 Extended Colors**
```yaml
Educational Colors:
  Academic Blue: #1E88E5
  Knowledge Green: #43A047
  Innovation Purple: #8E24AA
  Creativity Orange: #FB8C00
  Excellence Gold: #FDD835

Brand Colors:
  Primary: #2196F3
  Secondary: #03A9F4
  Accent: #00BCD4
  Success: #4CAF50
  Warning: #FF9800
  Error: #F44336

Usage Guidelines:
  - Use primary colors for main actions
  - Use semantic colors for status
  - Use neutral colors for structure
  - Maintain contrast ratios
  - Consider accessibility
```

---

## 📝 **Typography System**

### **🔤 Font Families**
```yaml
Primary Font:
  Family: 'Inter', sans-serif
  Weights: 300, 400, 500, 600, 700, 800
  Styles: Normal, Italic
  Usage: Headings, body text, UI elements

Secondary Font:
  Family: 'Roboto', sans-serif
  Weights: 300, 400, 500, 700, 900
  Styles: Normal, Italic
  Usage: Supporting text, labels

Monospace Font:
  Family: 'JetBrains Mono', monospace
  Weights: 400, 500, 600, 700
  Styles: Normal, Italic
  Usage: Code, data, technical content

Font Fallbacks:
  - 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif
  - 'JetBrains Mono', 'Fira Code', 'Consolas', monospace
```

### **📏 Type Scale**
```yaml
Display Scale:
  Display:
    Size: 96px
    Weight: 800
    Line height: 1.2
    Letter spacing: -0.02em
    Usage: Hero titles, main headings

Headline Scale:
  Headline 1:
    Size: 60px
    Weight: 700
    Line height: 1.2
    Letter spacing: -0.01em
    Usage: Page titles, main headings

  Headline 2:
    Size: 48px
    Weight: 600
    Line height: 1.3
    Letter spacing: 0
    Usage: Section headings

  Headline 3:
    Size: 36px
    Weight: 600
    Line height: 1.3
    Letter spacing: 0
    Usage: Subsection headings

  Headline 4:
    Size: 24px
    Weight: 500
    Line height: 1.4
    Letter spacing: 0
    Usage: Card titles, small headings

  Headline 5:
    Size: 20px
    Weight: 500
    Line height: 1.4
    Letter spacing: 0
    Usage: Component headings

  Headline 6:
    Size: 16px
    Weight: 500
    Line height: 1.5
    Letter spacing: 0
    Usage: Small headings, labels

Subtitle Scale:
  Subtitle 1:
    Size: 16px
    Weight: 500
    Line height: 1.5
    Letter spacing: 0.01em
    Usage: Subtitles, secondary headings

  Subtitle 2:
    Size: 14px
    Weight: 500
    Line height: 1.5
    Letter spacing: 0.01em
    Usage: Small subtitles, labels

Body Scale:
  Body 1:
    Size: 16px
    Weight: 400
    Line height: 1.5
    Letter spacing: 0
    Usage: Primary body text

  Body 2:
    Size: 14px
    Weight: 400
    Line height: 1.5
    Letter spacing: 0
    Usage: Secondary body text

Button Scale:
  Button:
    Size: 14px
    Weight: 500
    Line height: 1.4
    Letter spacing: 0.02em
    Usage: Button text, links

Caption Scale:
  Caption:
    Size: 12px
    Weight: 400
    Line height: 1.4
    Letter spacing: 0.02em
    Usage: Captions, footnotes

  Overline:
    Size: 10px
    Weight: 500
    Line height: 1.4
    Letter spacing: 0.1em
    Usage: Overlines, badges
```

### **🎨 Typography Usage**
```yaml
Hierarchy:
  1. Display - Hero titles
  2. Headline 1 - Page titles
  3. Headline 2 - Section headings
  4. Headline 3 - Subsection headings
  5. Headline 4 - Card titles
  6. Headline 5 - Component headings
  7. Headline 6 - Small headings
  8. Subtitle 1 - Subtitles
  9. Subtitle 2 - Small subtitles
  10. Body 1 - Primary text
  11. Body 2 - Secondary text
  12. Button - Button text
  13. Caption - Captions
  14. Overline - Overlines

Best Practices:
  - Use consistent hierarchy
  - Maintain contrast ratios
  - Consider line length
  - Use appropriate weights
  - Test readability
```

---

## 📏 **Spacing System**

### **📐 Spacing Scale**
```yaml
Base Unit: 4px

Spacing Scale:
  0: 0px      # No spacing
  1: 4px      # Micro spacing
  2: 8px      - Small spacing
  3: 12px     - Medium-small
  4: 16px     - Medium spacing
  5: 20px     - Medium-large
  6: 24px     - Large spacing
  7: 28px     - Large-medium
  8: 32px     - Extra large
  9: 36px     - Extra-large-medium
  10: 40px    - Double extra large
  12: 48px    - Triple extra large
  16: 64px    - Quadruple extra large
  20: 80px    - Five times extra large
  24: 96px    - Six times extra large
  32: 128px   - Eight times extra large
  40: 160px   - Ten times extra large
  48: 192px   - Twelve times extra large
  56: 224px   - Fourteen times extra large
  64: 256px   - Sixteen times extra large
```

### **📦 Spacing Usage**
```yaml
Component Spacing:
  - Padding: 16px (4)
  - Margin: 16px (4)
  - Gap: 16px (4)
  - Border radius: 8px (2)

Layout Spacing:
  - Section padding: 48px (12)
  - Container padding: 24px (6)
  - Card padding: 24px (6)
  - Grid gap: 16px (4)

Text Spacing:
  - Line height: 1.5
  - Letter spacing: 0
  - Word spacing: 0.05em
  - Paragraph spacing: 16px (4)

Button Spacing:
  - Padding: 12px 24px (3, 6)
  - Margin: 8px (2)
  - Gap: 8px (2)

Form Spacing:
  - Field spacing: 16px (4)
  - Label spacing: 4px (1)
  - Input padding: 12px (3)
  - Button spacing: 16px (4)
```

---

## 🖼️ **Visual Elements**

### **📐 Borders & Shadows**
```yaml
Borders:
  - Width: 1px
  - Style: Solid
  - Color: Gray 200 (#E0E0E0)
  - Radius: 8px

Border Radius:
  - Small: 4px
  - Medium: 8px
  - Large: 12px
  - Extra large: 16px
  - Round: 50%

Shadows:
  Subtle:
    - 0 1px 3px rgba(0,0,0,0.12)
    - 0 1px 2px rgba(0,0,0,0.24)
  
  Light:
    - 0 2px 4px rgba(0,0,0,0.1)
    - 0 1px 2px rgba(0,0,0,0.06)
  
  Medium:
    - 0 4px 12px rgba(0,0,0,0.15)
    - 0 2px 4px rgba(0,0,0,0.1)
  
  Strong:
    - 0 10px 25px rgba(0,0,0,0.2)
    - 0 6px 10px rgba(0,0,0,0.15)

Usage:
  - Subtle: Cards, buttons
  - Light: Hover states
  - Medium: Dropdowns, modals
  - Strong: Overlays, tooltips
```

### **🎨 Gradients**
```yaml
Primary Gradient:
  - Start: #2196F3
  - End: #03A9F4
  - Direction: 45deg
  - Usage: Headers, backgrounds

Success Gradient:
  - Start: #4CAF50
  - End: #81C784
  - Direction: 45deg
  - Usage: Success states

Warning Gradient:
  - Start: #FF9800
  - End: #FFB74D
  - Direction: 45deg
  - Usage: Warning states

Error Gradient:
  - Start: #F44336
  - End: #EF5350
  - Direction: 45deg
  - Usage: Error states

Usage Guidelines:
  - Use sparingly
  - Maintain contrast
  - Consider accessibility
  - Test with users
```

---

## 🎯 **Design Principles**

### **🌟 Core Principles**
```yaml
1. Accessibility First:
   - WCAG 2.1 AAA compliance
   - Color contrast 4.5:1 minimum
   - Keyboard navigation
   - Screen reader support

2. Consistency:
   - Unified design language
   - Reusable components
   - Standardized spacing
   - Consistent interactions

3. Simplicity:
   - Clean interfaces
   - Clear hierarchy
   - Intuitive navigation
   - Minimal complexity

4. Professionalism:
   - Educational context
   - Appropriate tone
   - Trustworthy appearance
   - Credible design

5. Performance:
   - Fast loading
   - Smooth interactions
   - Optimized assets
   - Efficient code

6. Scalability:
   - Flexible layouts
   - Responsive design
   - Component-based
   - Future-proof
```

### **🎨 Visual Hierarchy**
```yaml
Hierarchy Levels:
  1. Primary Actions:
     - Color: Primary Blue
     - Size: Large
     - Weight: Bold
     - Position: Prominent

  2. Secondary Actions:
     - Color: Secondary Blue
     - Size: Medium
     - Weight: Medium
     - Position: Secondary

  3. Tertiary Actions:
     - Color: Gray
     - Size: Small
     - Weight: Regular
     - Position: Tertiary

  4. Supporting Elements:
     - Color: Light Gray
     - Size: Small
     - Weight: Light
     - Position: Supporting

Visual Weight:
  - Color > Size > Position > Style
  - Contrast creates hierarchy
  - White space guides attention
  - Grouping creates relationships
```

---

## 🌍 **Multi-Language Support**

### **📝 Text Direction**
```yaml
LTR Languages:
  - English
  - Spanish
  - French
  - German
  - Chinese
  - Japanese
  - Korean
  - Hindi
  - Bengali
  - Tamil
  - Telugu
  - Marathi
  - Gujarati
  - Kannada
  - Malayalam
  - Punjabi
  - Thai
  - Vietnamese
  - Indonesian
  - Filipino
  - Russian
  - Portuguese

RTL Languages:
  - Arabic
  - Hebrew
  - Urdu
  - Persian
  - Kurdish

Direction Handling:
  - Automatic detection
  - Manual override
  - Mixed content support
  - UI adaptation
```

### **🔄 Internationalization**
```yaml
Text Handling:
  - Unicode support
  - Font fallbacks
  - Text expansion
  - Line breaking
  - Hyphenation

Layout Adaptation:
  - Direction switching
  - Text alignment
  - Icon positioning
  - Navigation order
  - Form layouts

Cultural Considerations:
  - Color meanings
  - Symbol interpretations
  - Reading patterns
  - User expectations
  - Local conventions
```

---

## 📱 **Responsive Design**

### **🖥️ Breakpoints**
```yaml
Breakpoint System:
  Mobile:
    - Range: 320px - 767px
    - Font size: 14px
    - Spacing: 12px
    - Touch targets: 44px

  Tablet:
    - Range: 768px - 1023px
    - Font size: 16px
    - Spacing: 16px
    - Touch targets: 40px

  Desktop:
    - Range: 1024px - 1439px
    - Font size: 16px
    - Spacing: 16px
    - Touch targets: 32px

  Large Desktop:
    - Range: 1440px+
    - Font size: 16px
    - Spacing: 16px
    - Touch targets: 32px

Responsive Principles:
  - Mobile-first approach
  - Fluid layouts
  - Flexible images
  - Touch-friendly
  - Performance optimized
```

### **📐 Grid System**
```yaml
Grid Configuration:
  - Columns: 12
  - Gutters: 16px
  - Margins: 24px
  - Max width: 1200px

Responsive Behavior:
  Mobile: 4 columns
  Tablet: 8 columns
  Desktop: 12 columns
  Large Desktop: 12 columns (centered)

Grid Features:
  - Flexbox fallback
  - Responsive utilities
  - Auto-layout
  - Gap support
  - Alignment options
```

---

## ♿ **Accessibility Standards**

### **🎯 WCAG 2.1 AAA Compliance**
```yaml
Color Contrast:
  - Normal text: 7:1
  - Large text: 4.5:1
  - UI components: 3:1
  - Graphical objects: 3:1

Focus Indicators:
  - Visible: 2px solid
  - Color: Primary Blue
  - Offset: 2px
  - High contrast: 3px

Keyboard Navigation:
  - Tab order: Logical
  - Focus trapping: Modals
  - Skip links: Available
  - Shortcuts: Documented

Screen Reader Support:
  - Semantic HTML
  - ARIA labels
  - Alt text: Descriptive
  - Headings: Hierarchical
```

### **🔧 Accessibility Features**
```yaml
Visual:
  - High contrast mode
  - Large text mode
  - Focus indicators
  - Color blind friendly

Motor:
  - Keyboard navigation
  - Touch targets (44px minimum)
  - Voice control
  - Switch navigation

Cognitive:
  - Clear language
  - Consistent layout
  - Error prevention
  - Help and support

Hearing:
  - Visual notifications
  - Captions
  - Transcripts
  - Volume control
```

---

## 📊 **Usage Guidelines**

### **✅ Do's**
```yaml
Color Usage:
  - Use primary colors for main actions
  - Use semantic colors for status
  - Maintain contrast ratios
  - Test with color blind users
  - Consider cultural meanings

Typography:
  - Follow hierarchy
  - Maintain readability
  - Use appropriate weights
  - Consider line length
  - Test with screen readers

Spacing:
  - Use scale consistently
  - Maintain visual rhythm
  - Consider touch targets
  - Test on all devices
  - Optimize for performance

Layout:
  - Use grid system
  - Maintain consistency
  - Consider responsive behavior
  - Test with users
  - Optimize for performance
```

### **❌ Don'ts**
```yaml
Color Mistakes:
  - Don't use color alone
  - Don't ignore contrast
  - Don't use too many colors
  - Don't ignore accessibility
  - Don't ignore cultural context

Typography Mistakes:
  - Don't break hierarchy
  - Don't use too many fonts
  - Don't ignore readability
  - Don't use tiny text
  - Don't ignore line height

Spacing Mistakes:
  - Don't use arbitrary values
  - Don't ignore scale
  - Don't create visual noise
  - Don't ignore touch targets
  - Don't waste space

Layout Mistakes:
  - Don't break grid
  - Don't ignore responsive
  - Don't create confusion
  - Don't ignore performance
  - Don't ignore accessibility
```

---

## 🔧 **Implementation**

### **💻 CSS Variables**
```yaml
Color Variables:
  --color-primary-50: #E3F2FD
  --color-primary-500: #2196F3
  --color-primary-900: #0D47A1
  --color-success-500: #4CAF50
  --color-warning-500: #FF9800
  --color-error-500: #F44336

Typography Variables:
  --font-family-primary: 'Inter', sans-serif
  --font-family-secondary: 'Roboto', sans-serif
  --font-family-mono: 'JetBrains Mono', monospace
  --font-size-display: 96px
  --font-size-h1: 60px
  --font-size-body: 16px

Spacing Variables:
  --spacing-0: 0px
  --spacing-1: 4px
  --spacing-2: 8px
  --spacing-4: 16px
  --spacing-6: 24px
  --spacing-8: 32px

Utility Classes:
  .text-primary { color: var(--color-primary-500); }
  .bg-primary { background: var(--color-primary-500); }
  .p-4 { padding: var(--spacing-4); }
  .m-4 { margin: var(--spacing-4); }
```

### **📚 Component Styles**
```yaml
Button Styles:
  .btn-primary:
    background: var(--color-primary-500)
    color: white
    padding: var(--spacing-3) var(--spacing-6)
    border-radius: 8px
    font-weight: 500

  .btn-secondary:
    background: transparent
    color: var(--color-primary-500)
    border: 1px solid var(--color-primary-500)
    padding: var(--spacing-3) var(--spacing-6)
    border-radius: 8px
    font-weight: 500

Card Styles:
  .card:
    background: white
    border: 1px solid var(--color-gray-200)
    border-radius: 8px
    padding: var(--spacing-6)
    box-shadow: 0 2px 4px rgba(0,0,0,0.1)
```

---

## 📈 **Performance**

### **⚡ Optimization**
```yaml
CSS Optimization:
  - Minify CSS
  - Remove unused styles
  - Use CSS variables
  - Optimize selectors
  - Reduce repaints

Font Optimization:
  - Use modern font formats
  - Subset fonts
  - Use font-display
  - Optimize loading
  - Cache fonts

Image Optimization:
  - Use modern formats
  - Optimize sizes
  - Use lazy loading
  - Use responsive images
  - Optimize delivery
```

### **📊 Metrics**
```yaml
Performance Targets:
  - First paint: < 1 second
  - First contentful paint: < 1.5 seconds
  - Largest contentful paint: < 2.5 seconds
  - First input delay: < 100ms
  - Cumulative layout shift: < 0.1

CSS Metrics:
  - CSS size: < 50KB
  - Unused CSS: < 5%
  - Render time: < 16ms
  - Repaints: < 10 per second
  - Reflows: < 5 per second
```

---

## 🚀 **Next Steps**

### **📋 Implementation Plan**
1. **Set up CSS variables**
2. **Create utility classes**
3. **Build component styles**
4. **Test accessibility**
5. **Optimize performance**
6. **Document usage**

### **🎯 Success Criteria**
- **100% color accessibility**
- **100% typography consistency**
- **100% spacing standardization**
- **100% responsive design**
- **100% performance optimization**

---

**This style guide provides the foundation for creating consistent, accessible, and professional visual designs across the entire School Management ERP platform.** 🎨
