# Accessibility Guidelines

## Overview

This document outlines the accessibility features and guidelines implemented in the Upswitch Valuation Tester application, ensuring compliance with WCAG 2.1 standards and providing an inclusive user experience.

## WCAG 2.1 Compliance

### Level AA Standards

The application follows WCAG 2.1 Level AA guidelines, focusing on:

- **Keyboard Navigation** (2.1.1) - All functionality accessible via keyboard
- **Focus Visible** (2.4.7) - Clear focus indicators for all interactive elements
- **Label in Name** (2.5.3) - Accessible names match visible labels
- **Status Messages** (4.1.3) - Screen reader announcements for dynamic content

## Keyboard Navigation

### Navigation Patterns

**Tab Order:**
- Logical tab sequence through all interactive elements
- Skip links for efficient navigation
- Focus management in modals and dropdowns

**Keyboard Shortcuts:**
- `Tab` / `Shift+Tab` - Navigate between elements
- `Enter` / `Space` - Activate buttons and links
- `Escape` - Close modals and dropdowns
- `Arrow Keys` - Navigate within dropdowns and lists

### Custom Dropdown Navigation

**Implemented Features:**
```typescript
// Arrow key navigation
case 'ArrowDown':
  setFocusedIndex(prev => (prev + 1) % options.length);
  break;
case 'ArrowUp':
  setFocusedIndex(prev => (prev - 1 + options.length) % options.length);
  break;

// Selection and activation
case 'Enter':
case ' ':
  if (focusedIndex >= 0) {
    handleOptionSelect(options[focusedIndex].value);
  }
  break;

// Navigation shortcuts
case 'Home':
  setFocusedIndex(0);
  break;
case 'End':
  setFocusedIndex(options.length - 1);
  break;
```

## Focus Management

### useFocusTrap Hook

**Purpose:** Traps focus within modals and dropdowns to prevent focus from escaping to background elements.

**Implementation:**
```typescript
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Focus management logic
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    firstElement.focus();
    
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);
  
  return containerRef;
};
```

### Skip Links

**Implementation:**
```html
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg"
>
  Skip to main content
</a>
```

## Screen Reader Support

### ARIA Labels and Descriptions

**Form Elements:**
```typescript
<textarea
  aria-label="Type your message"
  aria-describedby="chat-help-text"
  // ... other props
/>
<span id="chat-help-text" className="sr-only">
  Press Enter to send, Shift+Enter for new line
</span>
```

**Interactive Elements:**
```typescript
<button
  aria-label={isStreaming ? "Sending message..." : "Send message"}
  aria-hidden="true" // For decorative icons
>
  <Send className="w-4 h-4" aria-hidden="true" />
</button>
```

### Live Regions

**Dynamic Content Announcements:**
```typescript
// Progress announcements
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {isGenerating ? "Generating valuation report..." : "Report updated"}
</div>

// Progress bars
<div 
  role="progressbar" 
  aria-valuenow={completedCount} 
  aria-valuemin={0} 
  aria-valuemax={totalSteps}
  aria-label={`Valuation progress: ${completedCount} of ${totalSteps} steps completed`}
/>
```

## Form Accessibility

### Input Validation

**Error Announcements:**
```typescript
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? `${name}-error` : undefined}
  // ... other props
/>

{hasError && (
  <p 
    id={`${name}-error`} 
    role="alert" 
    className="mt-1 text-sm text-red-600"
  >
    {error}
  </p>
)}
```

### Form Structure

**Proper Labeling:**
```typescript
<label htmlFor="company-name" className="block text-sm font-medium">
  Company Name
  {required && <span className="text-red-500 ml-1">*</span>}
</label>
<input
  id="company-name"
  name="company-name"
  aria-required={required}
  // ... other props
/>
```

## Visual Accessibility

### Focus Indicators

**Clear Focus Styles:**
```css
.focus\:outline-none:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.focus\:ring-2:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
```

### Color Contrast

**Standards:**
- Text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum
- UI components: 3:1 contrast ratio minimum

### Responsive Design

**Mobile Accessibility:**
- Touch targets minimum 44px
- Adequate spacing between interactive elements
- Responsive text sizing
- Landscape and portrait orientation support

## Testing Accessibility

### Manual Testing

**Keyboard Testing:**
1. Navigate entire application using only keyboard
2. Test all interactive elements with Tab/Shift+Tab
3. Verify focus indicators are visible
4. Test skip links functionality

**Screen Reader Testing:**
1. Test with NVDA (Windows) or VoiceOver (macOS)
2. Verify all content is announced correctly
3. Test form validation announcements
4. Verify dynamic content updates

### Automated Testing

**Tools:**
- **axe-core**: Automated accessibility testing
- **Lighthouse**: Accessibility audits
- **WAVE**: Web accessibility evaluation
- **Pa11y**: Command-line accessibility testing

**Implementation:**
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react axe-core

# Run accessibility tests
npm run test:accessibility
```

## Accessibility Checklist

### ✅ Implemented Features

- [x] **Keyboard Navigation**: Full keyboard support for all interactive elements
- [x] **Focus Management**: Clear focus indicators and focus trapping
- [x] **Skip Links**: Navigation shortcuts for keyboard users
- [x] **ARIA Labels**: Proper labeling for screen readers
- [x] **Live Regions**: Dynamic content announcements
- [x] **Form Validation**: Accessible error messages
- [x] **Color Contrast**: WCAG 2.1 compliant contrast ratios
- [x] **Responsive Design**: Mobile accessibility support

### 🔄 Future Improvements

- [ ] **High Contrast Mode**: Support for high contrast themes
- [ ] **Reduced Motion**: Respect prefers-reduced-motion
- [ ] **Font Scaling**: Support for larger font sizes
- [ ] **Voice Navigation**: Voice control integration
- [ ] **Alternative Input**: Switch and eye-tracking support

## Best Practices

### 1. Semantic HTML

**Use proper HTML elements:**
```html
<!-- Good -->
<button type="submit">Submit Form</button>
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

<!-- Avoid -->
<div onClick={handleClick}>Submit Form</div>
<div>
  <div><a href="/home">Home</a></div>
</div>
```

### 2. ARIA Usage

**When to use ARIA:**
- When HTML semantics are insufficient
- For complex widgets (dropdowns, modals)
- For dynamic content updates
- For form validation feedback

**When NOT to use ARIA:**
- Don't override native HTML semantics
- Don't use ARIA when HTML is sufficient
- Don't use ARIA for styling purposes

### 3. Testing Strategy

**Regular Testing:**
- Test with keyboard only
- Test with screen readers
- Test with different zoom levels
- Test with high contrast mode
- Test with reduced motion

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility](https://developers.google.com/web/tools/lighthouse)

### Testing

- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver (macOS)](https://www.apple.com/accessibility/vision/)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)

## Conclusion

The accessibility improvements implemented in Week 3 provide:

- **Full keyboard navigation** for all interactive elements
- **Screen reader compatibility** with proper ARIA labels and live regions
- **Focus management** with skip links and focus trapping
- **Form accessibility** with proper validation and error handling
- **WCAG 2.1 compliance** for critical accessibility issues

These features ensure the application is accessible to users with disabilities while maintaining a high-quality user experience for all users.
