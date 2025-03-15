<h1 align="center">
    <img src="./assets/polaris-utilities.svg" height="200" alt=""/><br>
    Polaris Utilities
</h1>

## QR Code Generator

This script generates a PDF document containing QR codes for multiple locations and teams, based on data from a CSV file. Each QR code links to a specific URL constructed using a base URL, team name, and location.

### Features

* **QR Code Generation:** Generates QR codes with embedded logos and custom text using the `qrcode` and `PIL` libraries.
* **PDF Generation:** Creates a PDF document with multiple QR codes per page using the `fpdf2` library.
* **CSV Input:** Reads location and team data from a CSV file.
* **Customizable:** Allows you to specify the base URL, CSV file location, and logo image.
* **Progress Bar:** Displays a progress bar using `tqdm` to track QR code generation.

### Requirements

* Python 3.6 or higher
* `fpdf2`
* `qrcode`
* `Pillow` (PIL)
* `tqdm`

You can install these packages using pip:

```bash
pip install fpdf2 qrcode Pillow tqdm