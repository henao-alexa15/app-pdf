const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const docxToPdf = require('docx-pdf');
const imageToPdf = require('image-to-pdf');

const PORT = 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile('index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url === '/convert' && req.method === 'POST') {
        let body = [];
        req.on('data', chunk => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            const { file, format } = JSON.parse(body);
            const inputPath = path.join(__dirname, 'uploads', file);
            const outputPath = path.join(__dirname, 'converted', `${file}.pdf`);

            const ext = path.extname(file).toLowerCase();
            if (ext === '.docx') {
                convertDocxToPdf(inputPath, outputPath, res);
            } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
                convertImageToPdf(inputPath, outputPath, res);
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Unsupported file type');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

function convertDocxToPdf(inputPath, outputPath, res) {
    const converter = new docxToPdf();
    converter.convert(inputPath, outputPath, function(err) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error converting DOCX to PDF');
        } else {
            res.writeHead(200, { 'Content-Type': 'application/pdf' });
            fs.createReadStream(outputPath).pipe(res);
        }
    });
}

function convertImageToPdf(inputPath, outputPath, res) {
    imageToPdf([inputPath], outputPath, function(err) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error converting image to PDF');
        } else {
            res.writeHead(200, { 'Content-Type': 'application/pdf' });
            fs.createReadStream(outputPath).pipe(res);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});