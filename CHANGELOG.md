# Release Notes

## Additions

- Added JSDoc to all functions in the game.js file

## Improvements

- Moved the fetching of the CSV files into the getTeamData function
- Improved error handling
- Split all calculation and rendering functions
- Merged the teamless and non-teamless onboarding functions
- Split the baseURL and quickFeatureCheck from the initialization logic into their own functions to improve clarity
- Simplified the invalid milestone check
- Improved validation in the parseCSV function
- Renamed script.js to game.js to better reflect its functionality
- Changed unnecessary let-s to const-s

## Removals

- Removed the onboardingHint function
- Removed unnecessary check from the initialization logic
- Removed the closeDialogs function
- Changed the spacing of the open-source declaration