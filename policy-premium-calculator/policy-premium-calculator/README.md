# Policy Premium Calculator

A simple health insurance premium estimator (HTML, CSS, JavaScript). Illustrative rates only, not a real quote.

## Run
Open `index.html` in any browser. No build step or dependencies.

## Files
- `index.html` - page layout and form
- `style.css` - styling (light and dark mode)
- `script.js` - rating tables, `calculatePremium()`, validation and UI

## Formula
premium = (base rate x age factor x household multiplier) x region factor
          + tobacco surcharge (50%) - wellness discount (5%) + admin fee + premium tax (5%)

## Customize
Edit the rating tables at the top of `script.js` (BASE_MONTHLY, REGION_FACTOR, ageFactor, etc.).
