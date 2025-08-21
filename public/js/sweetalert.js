// script.js
const video = document.getElementById('qr-video');
const resultElement = document.getElementById('qr-result');

const qrScanner = new QrScanner(video, result => {
    console.log('decoded qr code:', result);
    resultElement.textContent = result;
});

qrScanner.start();
