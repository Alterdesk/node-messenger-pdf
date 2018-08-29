const HtmlPdf = require('html-pdf-chrome');
const UuidV1 = require('uuid/v1');
const FileSystem = require('fs');
const Mkdirp = require('mkdirp');
const Path = require('path');
const OS = require('os');
const Log = require('log');

var tmpDir = Path.resolve(OS.tmpdir(), 'messenger-pdfs');

var logger = new Log(process.env.NODE_MESSENGER_SDK_LOG_LEVEL || process.env.HUBOT_LOG_LEVEL || 'info');

const options = {
    port: process.env.NODE_MESSENGER_PDF_CHROME_PORT || 9222  // Chrome/Chromium port
};

class Pdf {
    create(filename, html, callback) {
        if(!filename || filename === "") {
            logger.error("Pdf::create() Filename invalid: " + filename);
            callback(false, null);
        }
        if(!html || html === "") {
            logger.error("Pdf::create() HTML invalid: " + html);
            callback(false, null);
        }

        var tmpDirPath = tmpDir + "/" + UuidV1();

        Mkdirp(tmpDirPath, function(mkdirError) {
            if(mkdirError != null) {
                logger.error("Pdf::create() Unable to create temporary folder: " + tmpDirPath);
                callback(false, null);
                return;
            }

            var filePath = Path.resolve(tmpDirPath, filename);

            HtmlPdf.create(html, options).then((pdf) => {
                var promise = pdf.toFile(filePath);
                promise.then((res) => {
                    logger.debug("Pdf::create() Created PDF: " + filePath);
                    callback(true, filePath);
                });
                promise.catch((err) => {
                    logger.error("Pdf::create() Unable to create PDF: ", err);
                    callback(false, null);
                });
            });
        });
    }
}

module.exports = {
    Pdf: Pdf
}