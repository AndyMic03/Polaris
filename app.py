from flask import Flask, request, render_template, send_file
import fpdf
import qrcode
from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont
import io
import os
import tempfile
from flask import jsonify

app = Flask(__name__)

def qr_gen(link: str, name: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(base_dir, 'static', 'images', 'polaris.png')
    font_path = os.path.join(base_dir, 'static', 'fonts', 'Lato.ttf')
    logo = Image.open(logo_path)
    
    base_width = 90
    w_percent = (base_width / float(logo.size[0]))
    hsize = int((float(logo.size[1]) * float(w_percent)))
    logo = logo.resize((base_width, hsize))
    w_logo = Image.new("RGBA", logo.size, "WHITE")
    w_logo.paste(logo, (0, 0), logo)

    qr_code = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H
    )
    qr_code.add_data(link)
    qr_code.make()

    qr_img = qr_code.make_image(fill_color="black", back_color="white").convert("RGB")

    pos = ((qr_img.size[0] - w_logo.size[0]) // 2,
           (qr_img.size[1] - w_logo.size[1]) // 2)
    qr_img.paste(w_logo, pos)

    font = ImageFont.truetype(font_path, 24)
    draw = ImageDraw.Draw(qr_img)
    _, _, w, h = draw.textbbox((0, 0), name, font=font)
    draw.text(((qr_img.size[0] - w) // 2, qr_img.size[1] - qr_img.size[1] // 15), name, fill=(0, 0, 0), align="center", font=font)
    draw.rectangle([(0, 0), (qr_img.size[0] - 1, qr_img.size[1] - 1)], outline=(0, 0, 0), width=1)

    return qr_img

def generate_pdf(csv_location, base_url):
    pdf = fpdf.FPDF(orientation="landscape", format="A4")
    pdf.set_margins(1, 2, 1)
    pdf.add_page()

    h_counter = 0
    v_counter = 0

    def doc_insert(image):
        nonlocal h_counter, v_counter

        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp_file:
            image.save(tmp_file, format='PNG')
            tmp_file.close()

            if h_counter == 3:
                v_counter += 1
                h_counter = 0
            if v_counter == 2:
                pdf.add_page()
                v_counter = 0

            pdf.image(name=tmp_file.name, x=h_counter * 100, y=v_counter * 100, h=100, w=100)
            h_counter += 1

        os.remove(tmp_file.name)  # Clean up the temporary file

    with open(csv_location, "r") as csv_file:
        lines = csv_file.read().split("\n")
        header = lines[0].split(";")

        for i in range(1, len(lines)):
            entries = lines[i].split(";")
            for j in range(1, len(entries)):
                if j == 1:
                    img = qr_gen(base_url, entries[0])
                    doc_insert(img)
                else:
                    url = f"{base_url}/?team={entries[0]}&location={header[j]}"
                    img = qr_gen(url, entries[j])
                    doc_insert(img)

    pdf_output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
    pdf.output(pdf_output_path)

    with open(pdf_output_path, "rb") as pdf_file:
        pdf_data = pdf_file.read()

    os.remove(pdf_output_path)  # Clean up the temporary PDF file
    return io.BytesIO(pdf_data)

@app.route('/')
def home():
    return render_template('index.html')  # Your HTML form to upload CSV

@app.route('/admin')
def adminSetup():
    return render_template('admin.html')  # Render the admin page if authenticated


BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'game')
PREVIOUS_FILE = os.path.join(UPLOAD_FOLDER, 'locations.csv')

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf_route():
    base_url = request.form['base_url']
    use_existing = request.form.get('use_existing') == 'true'
    csv_file = request.files.get('csv_file')

    if use_existing:
        # Use the previously uploaded file
        if not os.path.exists(PREVIOUS_FILE):
            return "No previously uploaded file found.", 400
        csv_location = PREVIOUS_FILE
    elif csv_file:
        # Save the new file and update the previous file path
        csv_location = os.path.join(UPLOAD_FOLDER, 'locations.csv')
        csv_file.save(csv_location)
    else:
        return "No file uploaded or selected.", 400

    # Generate the PDF
    pdf_output = generate_pdf(csv_location, base_url)

    # Return the PDF as a downloadable file
    return send_file(pdf_output, as_attachment=True, download_name="qrCodes.pdf", mimetype='application/pdf')

@app.route('/uploads/last_uploaded')
def get_last_uploaded():
    # Serve the last uploaded file for download
    if os.path.exists(PREVIOUS_FILE):
        return send_file(PREVIOUS_FILE, as_attachment=True, download_name="last_uploaded.csv", mimetype='text/csv')
    return "No previously uploaded file found.", 404
    


@app.route('/upload_files', methods=['POST'])
def upload_files():
    try:
        # Define the directories
        backup_folder = os.path.join(UPLOAD_FOLDER, 'backup')
        os.makedirs(backup_folder, exist_ok=True)

        # List of expected files
        expected_files = ['textHints.csv', 'textChallenges.csv', 'locations.csv', 'imageHints.csv']

        # Process uploaded files
        uploaded_files = request.files.getlist('multiple_files')

        # Backup only the files that are going to be replaced
        uploaded_filenames = [file.filename for file in uploaded_files]
        for filename in expected_files:
            current_file = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(current_file) and filename in uploaded_filenames:
                # Only backup the file if it exists and is being replaced
                backup_file = os.path.join(backup_folder, filename)
                os.rename(current_file, backup_file)  # Move to backup folder

        # Save uploaded files to the target folder
        for uploaded_file in uploaded_files:
            if uploaded_file.filename in expected_files:
                save_path = os.path.join(UPLOAD_FOLDER, uploaded_file.filename)
                uploaded_file.save(save_path)

        # Return a JSON response indicating success
        return jsonify({"message": "Files uploaded and replaced successfully."}), 200

    except Exception as e:
        # If any error occurs, return a JSON response with an error message
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
