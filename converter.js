document.getElementById('imageInput').addEventListener('change', handleImageUpload);
document.getElementById('thresholdSlider').addEventListener('input', updateThreshold);
document.getElementById('thresholdSlider').addEventListener('touchend', updateThreshold);
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('downloadBtn').addEventListener('click', downloadImage);
});

let threshold = 128;
let image = new Image();
let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');

function handleImageUpload(event) {
  const reader = new FileReader();
  reader.onload = function(e) {
    image.onload = () => {
      convertToMonochrome();
      updateCanvasSize();
    };
    image.src = e.target.result;
  };
  reader.readAsDataURL(event.target.files[0]);
}

function updateThreshold(event) {
  threshold = event.target.value;
  document.getElementById('thresholdValue').textContent = threshold;
  convertToMonochrome();
}

function convertToMonochrome() {
  if (!image.src) return; // Do nothing if no image has been uploaded

  updateCanvasSize();
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const grayscale = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
    const color = grayscale < threshold ? 0 : 255;
    data[i] = color;
    data[i + 1] = color;
    data[i + 2] = color;
    // Set alpha to 0 for white pixels
    data[i + 3] = color === 0 ? 255 : 0;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function updateCanvasSize() {
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
}

function downloadImage() {
  if (!canvas.toDataURL) return; // Do nothing if the canvas hasn't been drawn to

  const link = document.createElement('a');
  link.download = 'converted-image.png';
  link.href = canvas.toDataURL('image/png');
  // Use dispatchEvent for better cross-browser compatibility
  const event = new MouseEvent('click');
  link.dispatchEvent(event);
}
