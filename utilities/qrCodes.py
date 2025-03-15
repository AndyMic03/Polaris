import fpdf
import qrcode
from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont
from tqdm.auto import trange


def qr_gen(link: str, name: str):
    logo = Image.open("./assets/polaris.png")
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

    font = ImageFont.truetype("./assets/Lato.ttf", 24)
    draw = ImageDraw.Draw(qr_img)
    _, _, w, h = draw.textbbox((0, 0), name, font=font)
    draw.text(((qr_img.size[0] - w) // 2, qr_img.size[1] - qr_img.size[1] // 15), name, fill=(0, 0, 0), align="center",
              font=font)
    draw.rectangle([(0, 0), (qr_img.size[0] - 1, qr_img.size[1] - 1)], outline=(0, 0, 0), width=1)

    return qr_img


csv_location = input("Please enter the location of the CSV file containing the locations: ")
base_url = input("Please enter the base URL of the website: ")

pdf = fpdf.FPDF(orientation="landscape", format="A4")
pdf.set_margins(1, 2, 1)
pdf.add_page()

h_counter = 0
v_counter = 0


def doc_insert(image):
    global h_counter
    global v_counter
    if h_counter == 3:
        v_counter += 1
        h_counter = 0
    if v_counter == 2:
        pdf.add_page()
        v_counter = 0
    pdf.image(name=image, x=h_counter * 100, y=v_counter * 100, h=100, w=100)
    h_counter += 1


csv = open(csv_location, "r").read()

lines = csv.split("\n")
header = lines[0].split(";")

for i in trange(1, len(lines)):
    entries = lines[i].split(";")
    for j in trange(1, len(entries)):
        if j == 1:
            img = qr_gen(base_url, entries[0])
            doc_insert(img)
        else:
            url = base_url + "/?team=" + entries[0] + "&location=" + header[j]
            img = qr_gen(url, entries[j])
            doc_insert(img)

pdf.output("qrCodes.pdf")
