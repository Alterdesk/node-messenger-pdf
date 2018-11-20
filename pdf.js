const ChromePdf = require('html-pdf-chrome');
const PhantomPdf = require('phantom-html-to-pdf');
const Parse5 = require('parse5');
const UuidV1 = require('uuid/v1');
const FileSystem = require('fs');
const Mkdirp = require('mkdirp');
const Path = require('path');
const OS = require('os');
const Log = require('log');

var tmpDir = Path.resolve(OS.tmpdir(), 'messenger-pdfs');

var logger = new Log(process.env.NODE_MESSENGER_SDK_LOG_LEVEL || process.env.HUBOT_LOG_LEVEL || 'info');

const method = process.env.NODE_MESSENGER_PDF_METHOD || "phantom";
const port = process.env.NODE_MESSENGER_PDF_PORT || 9222;  // Chrome/Chromium port

var phantom;

class Pdf {
    constructor() {
        this.removeTags = ["script", "iframe"];
    }

    create(filename, html, options, callback) {
        if(!filename || filename === "") {
            logger.error("Pdf::create() Filename invalid: " + filename);
            callback(false, null);
        }
        if(!html || html === "") {
            logger.error("Pdf::create() HTML invalid: " + html);
            callback(false, null);
        }

        if(this.removeTags && this.removeTags.length > 0) {
            try {
                var document = Parse5.parse(html);
                this.removeHtmlNode(document, this.removeTags);
                html = Parse5.serialize(document);
            } catch(err) {
                logger.error("Pdf::create() Unable to remove tags from HTML: ", err);
                callback(false, null);
            }
        }

        var tmpDirPath = tmpDir + "/" + UuidV1();

        Mkdirp(tmpDirPath, (mkdirError) => {
            if(mkdirError != null) {
                logger.error("Pdf::create() Unable to create temporary folder: " + tmpDirPath);
                callback(false, null);
                return;
            }

            var filePath = Path.resolve(tmpDirPath, filename);

            if(method === "chrome") {
                this.chromeMethod(filePath, html, options, callback);
            } else if(method === "phantom") {
                this.phantomMethod(filePath, html, options, callback);
            } else {
                logger.error("Pdf::create() Invalid method: " + method);
                callback(false, null);
            }
        });
    }

    chromeMethod(filePath, html, options, callback) {
        var chromeOptions = {};
        chromeOptions["port"] = port;
        var header;
        var footer;
        if(options) {
            header = options["header"];
            footer = options["footer"];
        }
        if((header && header.length > 0) || (footer && footer.length > 0)) {
            var printOptions = {};
            printOptions["displayHeaderFooter"] = true;
            if(header && header.length > 0) {
                    logger.debug("Pdf::create() Using header");
                printOptions["headerTemplate"] = header;
            }
            if(footer && footer.length > 0) {
                    logger.debug("Pdf::create() Using footer");
                printOptions["footerTemplate"] = footer;
            }
            chromeOptions["printOptions"] = printOptions;
        }

        ChromePdf.create(html, chromeOptions).then((pdf) => {
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
    }

    phantomMethod(filePath, html, options, callback) {
        if(!phantom) {
            phantom = new PhantomPdf();
        }
        var allowFileAccess;
        var header;
        var footer;
        var headerHeight;
        var footerHeight;
        var margin;
        var orientation;
        var format;
        if(options) {
            allowFileAccess = options["allowFileAccess"];
            header = options["header"];
            footer = options["footer"];
            headerHeight = options["headerHeight"];
            footerHeight = options["footerHeight"];
            margin = options["margin"];
            orientation = options["orientation"];
            format = options["format"];
        }
        var phantomOptions = {};
        phantomOptions["html"] = html;
        if(allowFileAccess) {
            phantomOptions["allowLocalFilesAccess"] = allowFileAccess;
        }
        if(header && header.length > 0) {
            phantomOptions["header"] = header;
        }
        if(footer && footer.length > 0) {
            phantomOptions["footer"] = footer;
        }
        var paperSize = {};
        if(headerHeight) {
            paperSize["headerHeight"] = headerHeight;
        }
        if(footerHeight) {
            paperSize["footerHeight"] = footerHeight;
        }
        if(margin) {
            paperSize["margin"] = margin;
        }
        if(orientation) {
            paperSize["orientation"] = orientation;
        }
        if(format) {
            paperSize["format"] = format;
        }
        phantomOptions["paperSize"] = paperSize;

        phantom(phantomOptions, (err, pdf) => {
            if(err) {
                logger.error("Pdf::create() Unable to create PDF: ", err);
                callback(false, null);
                return;
            }
            var stream = FileSystem.createWriteStream(filePath);
            pdf.stream.pipe(stream);
            pdf.stream.on('end', () => {
                logger.debug("Pdf::create() Created PDF: " + filePath);
                callback(true, filePath);
            });
        });
    }

    removeHtmlNode(node, removeTags) {
        if(!node) {
            return true;
        }
        var name = node.tagName || node.nodeName;
        if(!name) {
            return true;
        }
        if(removeTags.indexOf(name) !== -1) {
            logger.error("Pdf::removeHtmlNode() Removing tag \"" + name + "\" with contents \"" + Parse5.serialize(node) + "\"");
            return true;
        }
        if(node.childNodes && node.childNodes.length > 0) {
            var removeNodes = [];
            for(let index in node.childNodes) {
                var child = node.childNodes[index];
                if(this.removeHtmlNode(child, removeTags)) {
                    removeNodes.push(child);
                }
            }
            for(let index in removeNodes) {
                var removeNode = removeNodes[index];
                let i = node.childNodes.indexOf(removeNode);
                node.childNodes.splice(i, 1);
            }
        }
        return false;
    }
}

module.exports = {
    Pdf: Pdf
}