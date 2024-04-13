document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const imgElement = document.createElement("img");
        imgElement.src = e.target.result;
        imgElement.id = 'uploadedImage';
        imgElement.onload = function() {
            applyEffect(); // Apply default effect or no effect initially
        }

        const container = document.getElementById('imageContainer');
        container.innerHTML = ''; // Clear the container
        container.appendChild(imgElement);
    };

    reader.readAsDataURL(file);
});

document.getElementById('effectSlider').addEventListener('input', function(event) {
    document.getElementById('sliderValue').textContent = event.target.value;
    applyEffect();
});

document.getElementById('monochromeButton').addEventListener('click', function() {
    window.currentEffect = 'monochrome';
    applyEffect();
});

document.getElementById('atkinsonButton').addEventListener('click', function() {
    window.currentEffect = 'atkinson';
    applyEffect();
});

function applyEffect() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.getElementById('uploadedImage');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const threshold = document.getElementById('effectSlider').value;

    if (window.currentEffect === 'monochrome') {
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
            const color = gray < threshold ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = color;
        }
    } else if (window.currentEffect === 'atkinson') {
        // Implementing Atkinson Dithering
        for (let i = 0; i < data.length; i += 4) {
            let oldPixel = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
            let newPixel = oldPixel < threshold ? 0 : 255;
            let quantError = oldPixel - newPixel;

            data[i] = data[i + 1] = data[i + 2] = newPixel;

            if (i + 4 < data.length) data[i + 4] += quantError * (1 / 8);  // Right pixel
            if (i + 4 * canvas.width < data.length) data[i + 4 * canvas.width] += quantError * (1 / 8);  // Below pixel
            // Add additional checks and distribution for Atkinson
        }
    }

    ctx.putImageData(imageData, 0, 0);
    img.src = canvas.toDataURL();
}
