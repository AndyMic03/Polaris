# Setup Instructions

These instructions will guide you through setting up your own instance of the Polaris Scavenger Hunt game.

## Game Resources

Polaris uses CSV files to store game data. You can edit these files directly or use a spreadsheet program like Excel or
Google Sheets and export them as CSV files.

Each location has a team and a milestone. Milestones track progression, for example, the hint for Team A at Milestone 1,
will point the player to the location of Team A's Milestone 2.

> **_NOTE:_** If a field doesn't require a value, use NULL to ensure proper functionality.

> **_IMPORTANT:_** All CSV files must be encoded using semicolon (;) separators. This is crucial for Polaris to
> correctly interpret the data.

### Text Hints

Create a CSV file named `textHints.csv` in the `game` folder.

This file contains textual hints for the locations. Each column represents a milestone, and each row corresponds to a
team.
The first row must contain the milestone names. The first cell of the document contains the game name.

### Image Hints

Create a CSV file named `imageHints.csv` in the `game` folder.

This file contains image hints for each location. Similar to `textHints.csv`, columns represent milestones, rows
represent teams, and the first row contains the milestone names.

#### Valid Image Sources:

- Links to images on the web: (e.g., `https://example.com/image.jpg`)
- Local file paths: (Relative to the directory containing `index.html`, e.g., assets/images/hint1.png)
- Data URLs: (Base64 encoded images, e.g., `data:image/png;base64,iVBORw0KGgo...`)

### Text Challenges

Create a CSV file named `textChallenges.csv` in the `game` folder.

This file houses the challenges that participants must complete at each location. The first row should contain the
milestone names. Each subsequent row represents a different team, containing the challenges specific to that game.

It's crucial that these names exactly match the names used in `textHints.csv` and `imageHints.csv`.

### Checklist

Create a CSV file named `checklist.csv` in the `game` folder.

This file contains a list of non-location specific challenges that participants can complete throughout the game. Each
row in the CSV represents a different challenge.

> **_NOTE:_** All the above files are optional. The game only requires one of the following files to be present:
`textHints.csv`, `imageHints.csv`, `textChallenges.csv`.

## Table Structure

| Game Name | Milestone 1 | Milestone 2 | Milestone 3 | Milestone n |
|-----------|-------------|-------------|-------------|-------------|
| Team 1    | ...         | ...         | ...         | ...         |
| Team 2    | ...         | ...         | ...         | ...         |
| Team 3    | ...         | ...         | ...         | ...         |
| Team n    | ...         | ...         | ...         | ...         |

## Images

Polaris allows you to personalize the visual appearance of your game with custom images.

### Favicon

The favicon is a small icon that represents your game in browser tabs and bookmarks.

#### Requirements

- File Format: SVG
- File Name: `favicon.svg`
- Location: `game` folder
- Recommended Dimensions: 16x16 pixels (or 32x32 for retina displays)

#### How to Use

1. Create your favicon design.
2. Export it as an SVG file.
3. Name the file `favicon.svg`.
4. Place the file in the `game` folder within the `assets` folder.

> **_NOTE:_** If no `favicon.svg` is found in the `game` folder, the default Polaris logo will be used.

### Logo

The logo is displayed on the welcome screen of your Polaris game.

#### Requirements

- File Format: SVG
- File Name: `logo.svg`
- Location: `game` folder
- Recommended Dimensions: Flexible, but a horizontal layout generally works best.

#### How to Use

1. Create your logo design.
2. Export it as an SVG file.
3. Name the file `logo.svg`.
4. Place the file in the `game` folder within the `assets` folder.

> **_NOTE:_** If no `logo.svg` is found in the `game` folder, the default Polaris logo will be used.

## Example Project Structure

A typical Polaris project directory would be structured as follows:

```
├── assets
│   ├── index.js
│   ├── index.css
│   │   ...
│   └── game
│       ├── textHints.csv
│       ├── imageHints.csv
│       ├── textChallenges.csv
│       ├── checklist.csv
│       ├── favicon.svg
│       └── logo.svg
└── index.html
```

## Hosting

Polaris is designed to be hosted on any standard web server that can serve static files (HTML, CSS, JavaScript, images).

### Steps

1. **Prepare your files:** Ensure your `assets` directory and `index.html` are correctly structured (see the example
   above).
2. **Choose a web server:** You can use platforms like:
    - **GitHub Pages:** Host directly from a GitHub repository.
    - **Netlify:** Easy deployment and continuous integration.
    - **Vercel:** Similar to Netlify, optimized for front-end projects.
    - **Amazon S3:** Scalable cloud storage that can also serve static websites.
    - **Your own server:** Apache, Nginx, etc.
3. **Upload your files:** Upload the `assets` directory and `index.html` to your web server.
4. **Configure (if needed):** Depending on your server, you might need to configure MIME types for SVG files (set to
   `image/svg+xml`).

## QR Code Generation

Polaris provides a built-in tool to generate QR codes that link participants directly to specific locations within your
game.

### How to Generate QR Codes

1. **Access the Generator:** At the bottom of the Polaris page, click the "Generate QR Codes" link.
2. **Upload Locations:**
    - Prepare a CSV file (see "Game Resources" for format) containing your location names (e.g., "National Museum", "
      City Hall"). If a location is assigned to more than one team, make sure that you put the team name in the location
      name to avoid player confusion.
    - Upload this CSV file to the QR code generator.
3. **Enter Base URL:**
    - Provide the base URL where your Polaris game is hosted. This is the URL of your index.html file.
    - Examples:
    ```
      https://polaris.esncy.org
      polaris.esncy.org/index.html
      esncy.org/polaris
    ```
   > **_IMPORTANT:_** Do not include a trailing slash (/) at the end of the base URL.
4. **Generate:** Click the "Generate" button.
5. **Download:** A PDF file containing all your QR codes will be generated and ready for download. Each QR code will be
   labeled with its corresponding location name.

### Tips for QR Codes:

- **Test your QR codes:** Before using them in your game, test each QR code with a QR code scanner to ensure it
  correctly links to the intended location within your Polaris instance.
- **Print quality:** Print the QR codes clearly on a non-reflective surface for optimal scanning.
- **Placement:** Place the QR codes prominently at each location so participants can easily find and scan them.