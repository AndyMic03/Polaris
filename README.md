<h1 align="center">
    <img src="./assets/images/polarisLogo.svg" height="200" alt=""/><br>
    Polaris
</h1>

This project implements a web-based Scavenger Hunt game designed to be played in physical locations. Players, organized into teams, scan QR codes at various locations to progress through the game. The game utilizes HTML for the user interface, JavaScript for game logic and data handling, and CSV files to store game parameters, team information, and location-based hints. The CSS file provides styling for the visual elements of the game.

Key features include QR code integration for location-based interaction, dynamic content updates based on game progress,
and the use of cookies to maintain persistent user data. The game also incorporates error handling and a "Game Override"
feature for on the field troubleshooting.

## Core Components

1. HTML (found.html)
   - Structure: The HTML file lays out the game's visual elements, including welcome screens, congratulatory messages, hint displays, and error dialogs. 
   - Dynamic Content: Key areas within the HTML are designed to be dynamically populated with content based on user interactions and game progress. 
   - Dialogs: The use of dialog elements allows for modal pop-ups to display hints, errors, and validation information.
   
2. JavaScript (script.js)
   - Logic and Control: The JavaScript file handles the game's core logic, controlling the flow of the game, validating user input, and managing the display of hints and clues.
   - Data Handling: It interacts with CSV files to retrieve game parameters, team information, location data, hints, and
     challenges.
   - Cookies: Cookies are used to store persistent data, such as the selected team and progress through locations.
   - URL Parameters: The script parses URL parameters to determine the team and current location, enabling QR code scanning for location-based clues.

3. CSV Data Files
   - gameParameters.csv: Stores the list of teams and locations in the game and the game name.
   - textHints.csv: Contains textual hints associated with each location and team.
   - imageHints.csv: Holds image-based hints corresponding to locations and teams.
   - textChallenges.csv: Contains textual challenges corresponding to locations and teams.

## Game Flow

1. Welcome Screen:
    - The game starts with a welcome screen prompting the user to enter their designated team name.

2. QR Code Scanning:
   - Players scan QR codes at each location, which encode the team and location information in the URL.

3. Location Validation:
   - The JavaScript validates the scanned location against the list of valid locations and the team's progress.

4. Hint Display:
   - If the location is valid and the team is at the correct stage, a hint is revealed based on the team and location data from the CSV files.

5. Game Completion:
   - Upon reaching the final location, players can validate their results, which checks if they have visited all required locations.

## Key Features

- **QR Code Integration**: QR codes provide a seamless way to link physical locations with in-game progress.
- **Dynamic Content**: The HTML structure is adaptable, allowing for content to be updated based on game events.
- **Data-Driven**: CSV files store game data, making it easy to modify or expand the game without altering the core code.
- **Cookies for Persistence**: Cookies maintain user data, ensuring progress is saved even if the user leaves the game and returns later.

## Example CSV Data

### Game Parameters

```
Event Name
Team 1;Team 2;Team 3;...
Location 1;Location 2;Location 3;...
```

### Hints

This section applies to both text and image hints.
```
Location 1 Hint;Location 2 Hint;... (Team 1)
Location 1 Hint;Location 2 Hint;... (Team 2)
...
```

### Challenges

```
Location 1 Challenge;Location 2 Challenge;... (Team 1)
Location 1 Challenge;Location 2 Challenge;... (Team 2)
...
```

## Further Considerations

- **Error Handling**: The JavaScript includes basic error handling for invalid URL parameters, missing cookies, and incorrect team/location combinations.
- **Styling (style.css)**: The CSS file defines the visual appearance of the game, including colors, fonts, and layout.
- **Game Override**: A "Game Override" feature allows for manual manipulation of team and location progress.
