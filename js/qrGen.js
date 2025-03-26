import QRCodeStyling from "qr-code-styling";
import {jsPDF} from "jspdf";

const pageWidth = 1188;
const pageHeight = 840;
const codesHorizontally = 3;
const codesVertically = 2;

async function makeQR(link, text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = pageWidth / codesHorizontally;
    canvas.height = pageHeight / codesVertically;

    const qrCode = await new QRCodeStyling({
        width: Math.min(canvas.width, canvas.height),
        height: Math.min(canvas.width, canvas.height),
        type: "svg",
        data: link,
        image: "./assets/polarisLogo.svg",
        margin: Math.round(Math.min(canvas.width, canvas.height) * 0.01),
        qrOptions: {
            errorCorrectionLevel: "H"
        },
        imageOptions: {
            saveAsBlob: true,
            crossOrigin: "anonymous",
            margin: Math.round(Math.min(canvas.width, canvas.height) * 0.02)
        },
    });

    const qrData = await qrCode.getRawData("svg");
    const qrCodeImage = new Image(Math.min(canvas.width, canvas.height), Math.min(canvas.width, canvas.height));

    await new Promise((resolve, reject) => {
        qrCodeImage.onload = resolve;
        qrCodeImage.onerror = reject;

        if (qrData instanceof Blob) {
            qrCodeImage.src = URL.createObjectURL(qrData);
        } else {
            qrCodeImage.src = qrData.toString();
        }
    });

    context.drawImage(qrCodeImage, 0, 0);
    context.textAlign = "center";
    context.font = Math.min(canvas.width, canvas.height) * 0.025 + "px Lato";
    const slackHeight = canvas.height - Math.min(canvas.width, canvas.height);
    const slackWidth = canvas.width - Math.min(canvas.width, canvas.height);
    context.fillText(text, (canvas.width - slackWidth) / 2, canvas.height - slackHeight / 2, canvas.width);
    context.strokeRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
}

let hCounter = 0;
let vCounter = 0;

function addImage(doc, image) {
    if (hCounter === codesHorizontally) {
        vCounter += 1
        hCounter = 0
    }
    if (vCounter === codesVertically) {
        doc.addPage([pageHeight, pageWidth], "l");
        vCounter = 0
    }
    const width = pageWidth / codesHorizontally;
    const height = pageHeight / codesVertically;
    doc.addImage(image, "PNG", hCounter * width, vCounter * height, width, height);
    hCounter += 1
}

async function makePDF(locations, baseURL) {
    const doc = new jsPDF({
        format: [pageHeight, pageWidth],
        orientation: "landscape",
        unit: "px",
    });

    document.getElementById("progressContainer").style.display = "block";
    document.getElementById("progressBar").style.width = "0px";

    let totalCodes = 0;
    for (let i = 1; i < locations.length; i++)
        for (let j = 1; j < locations[i].length; j++)
            totalCodes++;
    let processedCodes = 0;
    for (let i = 1; i < locations.length; i++) {
        for (let j = 1; j < locations[i].length; j++) {
            if (j === 1) {
                const img = await makeQR(baseURL, locations[i][0]);
                addImage(doc, img);
            }
            const url = baseURL + "/?team=" + locations[i][0] + "&milestone=" + locations[0][j];
            const img = await makeQR(url.replaceAll(" ", "%20"), locations[i][j]);
            addImage(doc, img);
            processedCodes++;
            document.getElementById("progressBar").style.width = (processedCodes / totalCodes) * 100 + "%";
        }
    }
    document.getElementById("progressBar").style.borderRadius = "10px";
    doc.save("qrCodes.pdf");
}

export async function generateQR(csvFile) {
    if (csvFile === undefined)
        return;
    let locations = [];
    const rows = csvFile.split("\n");
    for (const row of rows)
        locations.push(row.split(";"));
    await makePDF(locations, document.getElementById("base_url").value);
}