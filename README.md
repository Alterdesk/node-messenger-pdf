# node-messenger-pdf

Helper module to generate PDF files from HTML with a headless Chrome/Chromium instance

## Start headless Chrome/Chromium
Start an instance of Chrome or Chromium that will receive the commands on the given port(default is 9222).
Replace "chromium-browser" with your installed chrome/chromium binary.
```bash
chromium-browser --headless --disable-gpu --remote-debugging-port=9222
```

## Usage
Example of usage
```javascript
// Import the Pdf class
const {Pdf} = require('node-messenger-pdf');

// Create a Pdf instance
var pdf = new Pdf();

// Filename to create
var filename = "hello_world.pdf";

// HTML page as a string
var html = "<p>Hello world!</p>";

// Create the pdf
pdf.create(filename, html, (success, filePath) => {
    if(!success) {
        console.error("Unable to generate PDF");
        return;
    }
    console.log("Generated PDF: " + filePath);
});
```

## Environment variables
Chrome/Chromium port to connect to
* NODE_MESSENGER_PDF_PORT *(default: 9222)*