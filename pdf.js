const HtmlPdf = require('html-pdf-chrome');
const Parse5 = require('parse5');
const UuidV1 = require('uuid/v1');
const FileSystem = require('fs');
const Mkdirp = require('mkdirp');
const Path = require('path');
const OS = require('os');
const Log = require('log');

var tmpDir = Path.resolve(OS.tmpdir(), 'messenger-pdfs');

var logger = new Log(process.env.NODE_MESSENGER_SDK_LOG_LEVEL || process.env.HUBOT_LOG_LEVEL || 'info');

const port = process.env.NODE_MESSENGER_PDF_PORT || 9222;  // Chrome/Chromium port

class Pdf {
    constructor() {
        this.removeTags = ["script", "iframe"];
    }

    create(filename, html, header, footer, callback) {
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

        Mkdirp(tmpDirPath, function(mkdirError) {
            if(mkdirError != null) {
                logger.error("Pdf::create() Unable to create temporary folder: " + tmpDirPath);
                callback(false, null);
                return;
            }

            var filePath = Path.resolve(tmpDirPath, filename);

            var options = {};
            options["port"] = port;
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
                options["printOptions"] = printOptions;
            }

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