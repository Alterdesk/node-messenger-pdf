# node-messenger-pdf

Helper module to generate PDF files from HTML with a headless Chrome/Chromium instance

## Start headless Chrome/Chromium
Start an instance of Chrome or Chromium that will receive the commands on the given port(default is 9222).
Replace "chromium-browser" with your installed chrome/chromium binary.
```bash
chromium-browser --headless \
--disable-gpu \
--interpreter none \
--disable-translate \
--disable-extensions \
--disable-background-networking \
--safebrowsing-disable-auto-update \
--disable-sync \
--metrics-recording-only \
--disable-default-apps \
--no-first-run \
--mute-audio \
--hide-scrollbars \
--remote-debugging-port=9222
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

## Color issue
When the colors in the generated PDF files are off, use the following webkit argument in your body style
```css
body {
    -webkit-print-color-adjust:exact;
}
```

## Sandbox issues
If you are unable to run the headless chrome/chromium instance without using --no-sandbox, you can try the following 
configurations. The configurations were tested on CentOS successfully.

```bash
# Run as root
echo "user.max_user_namespaces=15000" >> /etc/sysctl.conf
```
Reboot your machine and check if the configuration value 15000 was set:
```bash
sudo sysctl -a | grep user.max_user_namespaces
```
Try if running in with a sandbox now works, if the problem persists because you are using an older kernel:
```bash
grubby --args="user_namespace.enable=1 namespace.unpriv_enable=1" --update-kernel="$(grubby --default-kernel)"
```
Reboot again and check if the changes are set:
```bash
cat /proc/cmdline
```
When the values are set the headless chrome/chromium instance should run in a sandbox.

## Environment variables
Chrome/Chromium port to connect to
* NODE_MESSENGER_PDF_PORT *(default: 9222)*