document.getElementById('imageInput').addEventListener('change', handleImageUpload);
document.getElementById('scaleSlider').addEventListener('input', updateScale);
document.getElementById('thresholdSlider').addEventListener('input', updateThresholdDisplay);
document.getElementById('applyBtn').addEventListener('click', applyEffects);
document.getElementById('downloadBtn').addEventListener('click', downloadImage);

let image = new Image();
let originalWidth, originalHeight;
let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let currentThreshold = 128; // Default threshold
let currentScale = 100; // Default scale percentage

function handleImageUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        image.onload = () => {
            originalWidth = image.width;
            originalHeight = image.height;
            updateScale();
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateScale() {
    const scale = document.getElementById('scaleSlider').value;
    document.getElementById('scaleValue').textContent = `${scale}%`;
    currentScale = scale;
    applyEffects();
}

function updateThresholdDisplay() {
    const threshold = document.getElementById('thresholdSlider').value;
    document.getElementById('thresholdValue').textContent = threshold;
    currentThreshold = threshold;
    applyEffects();
}

function applyEffects() {
    const effect = document.getElementById('effectSelector').value;
    if (!image.src) return; // Do nothing if no image has been uploaded

    canvas.width = originalWidth * (currentScale / 100);
    canvas.height = originalHeight * (currentScale / 100);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    if (effect === 'monochrome') {
        applyMonochrome();
    } else if (effect === 'atkinson') {
        applyAtkinson();
    }
}

function applyMonochrome() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grayscale = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        const color = grayscale < currentThreshold ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = color;
        data[i + 3] = 255; // Full opacity
    }
    ctx.putImageData(imageData, 0, 0);
}

function applyAtkinson() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = imageData.width;
    for (let i = 0; i < data.length; i += 4) {
        let oldPixel = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        let newPixel = oldPixel < currentThreshold ? 0 : 255;
        let quantError = (oldPixel - newPixel) / 8;

        data[i] = data[i + 1] = data[i + 2] = newPixel;

        if (i % (4 * width) < 4 * (width - 3)) {
            // Right pixel
            data[i + 4 + 0] = clip(data[i + 4 + 0] + quantError);
            data[i + 4 + 1] = clip(data[i + 4 + 1] + quantError);
            data[i + 4 + 2] = clip(data[i + 4 + 2] + quantError);
        }

        let rowPixels = 4 * width;
        if (i + rowPixels < data.length) {
            // Down one row
            data[i + rowPixels + 0] = clip(data[i + rowPixels + 0] + quantError);
            data[i + rowPixels + 1] = clip(data[i + rowPixels + 1] + quantError);
            data[i + rowPixels + 2] = clip(data[i + rowPixels + 2] + quantError);

            if (i % (4 * width) > 4) {
                // Bottom left pixel
                data[i + rowPixels - 4 + 0] = clip(data[i + rowPixels - 4 + 0] + quantError);
                data[i + rowPixels - 4 + 1] = clip(data[i + rowPixels - 4 + 1] + quantError);
                data[i + rowPixels - 4 + 2] = clip(data[i + rowPixels - 4 + 2] + quantError);
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function clip(value) {
    return Math.max(0, Math.min(255, value));
}

function downloadImage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Loop through every pixel to change white pixels to transparent
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Check if the pixel is white
        if (r === 255 && g === 255 && b === 255) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }

    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to PNG data URL and trigger download
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link); // Append link to the body temporarily
    link.click();
    document.body.removeChild(link); // Remove link after triggering the download

}
