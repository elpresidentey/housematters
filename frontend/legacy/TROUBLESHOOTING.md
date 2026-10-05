# House Matters Frontend Troubleshooting Guide

## Common Issues and Solutions

### 1. Page Appears Broken or Styles Not Loading

**Possible Causes:**
- CSS file not loading properly
- Font loading issues
- JavaScript errors preventing page functionality

**Solutions:**
1. **Check file paths**: Ensure `./styles/main.css` and `./js/main.js` are accessible
2. **Test with simple version**: Open `simple.html` to test basic functionality
3. **Check browser console**: Look for any error messages
4. **Clear browser cache**: Force refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### 2. Fonts Not Loading

**Issue**: Page uses system fonts instead of Lato
**Solution**: 
- Check internet connection for Google Fonts
- Verify font URL in HTML head section
- Fallback fonts should still work (system fonts)

### 3. JavaScript Functionality Not Working

**Symptoms**: Buttons don't respond, modals don't open, navigation doesn't work
**Solutions**:
1. Check browser console for JavaScript errors
2. Ensure `main.js` is loading properly
3. Test with `simple.html` for basic functionality

### 4. Mobile Layout Issues

**Issue**: Layout breaks on mobile devices
**Solutions**:
- Test responsive design with browser dev tools
- Check viewport meta tag is present
- Verify CSS media queries are working

### 5. Performance Issues

**Issue**: Page loads slowly or animations are choppy
**Solutions**:
- Disable parallax effects if causing issues
- Check network tab in dev tools for slow-loading resources
- Consider using `simple.html` for better performance

## Testing Steps

### Step 1: Basic HTML Test
1. Open `test.html` in browser
2. Verify basic styling and button functionality
3. If this works, the issue is with the main page complexity

### Step 2: Simple Version Test
1. Open `simple.html` in browser
2. Test navigation, buttons, and responsive design
3. If this works, the issue is with advanced features

### Step 3: Full Version Test
1. Open `index.html` in browser
2. Check browser console for errors
3. Test all functionality systematically

## Browser Compatibility

**Supported Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**Known Issues:**
- Internet Explorer: Not supported (uses modern CSS features)
- Older mobile browsers: Some animations may not work

## Development Server Setup

For best results, serve files through a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then access: `http://localhost:8000/frontend/`

## File Structure Check

Ensure your file structure looks like this:
```
frontend/
├── index.html          (Main page)
├── simple.html         (Simplified version)
├── test.html           (Basic test)
├── styles/
│   └── main.css        (All styles)
├── js/
│   └── main.js         (All JavaScript)
└── TROUBLESHOOTING.md  (This file)
```

## Quick Fixes

### Fix 1: Reset CSS Issues
Add this to the top of `main.css` if styles are conflicting:
```css
* {
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
}
```

### Fix 2: Disable Animations
Add this to `main.css` to disable all animations:
```css
*, *::before, *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
}
```

### Fix 3: Force Font Loading
Add this to HTML head if fonts aren't loading:
```html
<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}
</style>
```

## Contact for Support

If issues persist:
1. Check browser console for specific error messages
2. Test with different browsers
3. Try the simple.html version
4. Provide specific error messages and browser information