window.onload = function() {
    const uploader = document.getElementById('imageUploader');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const resizeSlider = document.getElementById('resizeSlider');
    const darkThreshold = document.getElementById('darkThreshold');
    const mediumThreshold = document.getElementById('mediumThreshold');
    const lightThreshold = document.getElementById('lightThreshold');
    const downloadBtn = document.getElementById('downloadBtn');
    const colorInputs = document.querySelectorAll('.colorInput');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const colorsContainer = document.getElementById('colorsContainer');

    let img = new Image();
    let originalWidth = 0, originalHeight = 0;

    uploader.addEventListener('change', handleImage, false);
    resizeSlider.addEventListener('input', renderImage);
    [darkThreshold, mediumThreshold, lightThreshold].forEach(el => el.addEventListener('input', renderImage));
    colorInputs.forEach(input => input.addEventListener('input', updateColorDisplay));
    downloadBtn.addEventListener('click', downloadImage);
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Initialize color history from localStorage
    loadColorHistory();

    function handleImage(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            img.onload = function() {
                originalWidth = img.width;
                originalHeight = img.height;
                renderImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }

    function renderImage() {
        const scaleFactor = resizeSlider.value / 100;
        canvas.width = originalWidth * scaleFactor;
        canvas.height = originalHeight * scaleFactor;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        applyAtkinsonDithering();
    }

    function applyAtkinsonDithering() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = imageData.width;

        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            let targetColor, error;
            if (brightness < darkThreshold.value) {
                targetColor = hexToRgb(document.getElementById('darkColor').value || '#000000');
            } else if (brightness < mediumThreshold.value) {
                targetColor = hexToRgb(document.getElementById('mediumColor').value || '#808080');
            } else if (brightness < lightThreshold.value) {
                targetColor = hexToRgb(document.getElementById('lightColor').value || '#C0C0C0');
            } else {
                targetColor = { r: 255, g: 255, b: 255 }; // White
            }

            error = (brightness - (0.299 * targetColor.r + 0.587 * targetColor.g + 0.114 * targetColor.b)) / 8;
            data[i] = targetColor.r;
            data[i + 1] = targetColor.g;
            data[i + 2] = targetColor.b;

            spreadError(data, i, error, w);
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function spreadError(data, index, error, width) {
        if (index + 4 < data.length) {
            data[index + 4] += error;  // Right
        }
        if (index + 8 < data.length) {
            data[index + 8] += error;  // Two right
        }
        if (index + 4 * width - 4 < data.length) {
            data[index + 4 * width - 4] += error;  // Below left
        }
        if (index + 4 * width < data.length) {
            data[index + 4 * width] += error;  // Directly below
        }
        if (index + 4 * width + 4 < data.length) {
            data[index + 4 * width + 4] += error;  // Below right
        }
        if (index + 2 * 4 * width < data.length) {
            data[index + 2 * 4 * width] += error;  // Two rows below
        }
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function updateColorDisplay(e) {
        const hex = e.target.value;
        if (/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
            addColorToHistory(hex);
        }
    }

    function addColorToHistory(hex) {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'colorDisplay';
        colorDiv.style.backgroundColor = hex;
        colorDiv.textContent = hex;
        colorDiv.onclick = () => navigator.clipboard.writeText(hex);
        colorsContainer.appendChild(colorDiv);
        saveColorToStorage(hex);
    }

    function loadColorHistory() {
        const history = JSON.parse(localStorage.getItem('colorHistory')) || [];
        history.forEach(addColorToHistory);
    }

    function saveColorToStorage(hex) {
        let history = JSON.parse(localStorage.getItem('colorHistory')) || [];
        if (!history.includes(hex)) {
            history.push(hex);
            localStorage.setItem('colorHistory', JSON.stringify(history));
        }
    }

    function clearHistory() {
        localStorage.removeItem('colorHistory');
        colorsContainer.innerHTML = '';
    }

    function downloadImage() {
        let fileName = fileNameInput.value.trim() || 'custom-image';
        fileName += '.png';
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = fileName;
        link.href = image;
        link.click();
    }
};
