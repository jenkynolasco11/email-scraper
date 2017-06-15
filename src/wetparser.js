/***************************************************
 * wetparser.js                                    *
 *                                                 *
 * This defines an interface for processing WET    *
 * files                                           *
 *                                                 *
 * TODO:                                           *
 * 1) Rewrite header parser and make less managed  *
 * 2) Build a trie for words in a response body    *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// System imports                                  //
/////////////////////////////////////////////////////
var fs = require('fs');

// (NEW)
var EmailParser = require('./emailparser.js');

/////////////////////////////////////////////////////
// Constants                                       //
/////////////////////////////////////////////////////
const MEM_BLOCK_SIZE = 16 * 1024 * 1024; // 16MB;

/////////////////////////////////////////////////////
// class WetParser                                 //
/////////////////////////////////////////////////////
// Creates an interface for parsing results for a  //
// WET file                                        //
/////////////////////////////////////////////////////
function WetParser() {

    //
    // private field: "contentlength"
    //
    this._contentlength = 0;

    //
    // private field: "url"
    //
    this._url = "";

    //
    // private field: "buffercursor"
    //
    this._buffercursor = 0;

    //
    // private field: "buffer"
    //
    this._buffer = Buffer.allocUnsafe(MEM_BLOCK_SIZE);

    //
    // private field: "buffersize"
    //
    this._buffersize = MEM_BLOCK_SIZE;

    //
    // private field: "potentialemail"
    //

    this._potentialemail = [];

    //
    // private field: "email list"
    //
    this._emaillist = {};

    //
    // private field: "startword" (NEW)
    //
    this._startword = 0;

    //
    // private field: "wordtable" (NEW)
    //
    this._wordtable = {};

}

/////////////////////////////////////////////////////
// void WetParser::getEmails()                     //
/////////////////////////////////////////////////////
// This method will parse a specific chunk which   //
// was retrieved from a file pipe                  //
/////////////////////////////////////////////////////
function WetParser__getEmails() {

    //
    // Just return the email list field
    //
    return this._emaillist;

}

WetParser.prototype.getEmails = WetParser__getEmails;
/////////////////////////////////////////////////////
// void WetParser::parseContent()                  //
/////////////////////////////////////////////////////
// This method will parse a speciic chunk which    //
// was retrieved from a file pipe                  //
/////////////////////////////////////////////////////
function WetParser__parseContent() {

    //
    // Check if we have any potential emails to parse
    //
    if (this._potentialemail.length == 0) {

        //
        // Exit the function. Nothing to do.
        // 
        return;

    } else {


        EmailParser.parse(this._url, this._emaillist, this._potentialemail, this._wordtable, this._buffer);

        /*if (typeof this.__done === "undefined") {
        this.__done = 30;
        }

        if (this.__done-- == 0) {
        process.exit();
        }*/
    }

}

WetParser.prototype.parseContent = WetParser__parseContent;
/////////////////////////////////////////////////////
// void WetParser::parseLine()                     //
/////////////////////////////////////////////////////
// This method will parse a specific chunk which   //
// was retrieved from a file pipe                  //
/////////////////////////////////////////////////////
function WetParser__parseLine() {

    //
    // Local variables
    // 
    var buf, line, val, header;

    //
    // Initialize
    //
    buf = this._buffer;

    //
    // Since the buffer is in binary, convert the
    // binary into a UTF-8 string
    //
    line = buf.toString("utf8", 0, this._buffercursor);

    //
    // TODO: Potential bug fix: this._contentlength <= 0
    //
    if (this._buffercursor == 0 && this._contentlength < 0) {

        //
        // The buffer is empty and we have Content-Length;
        // treat this as a signal for content body
        //
        this._contentlength = -this._contentlength;

    } else {

        //
        // This is a header
        //

        //
        // Check for Content-Length header
        //
        header = line.substr(0, 16);
        if (header == "Content-Length: ") {

            //
            // Parse value
            //
            val = parseInt(line.substr(16));


            //
            // Check if Content-Length is greater than
            // buffer size
            //
            if (val > this._buffersize) {

                //
                // Display warning
                //
                console.log("Content-Length is " + val + ", but current buffer is " + this._buffersize);

            }

            this._contentlength = -val;

            //
            // Reset (NEW)
            //
            this._startword = 0;

            // console.log("Content-Length = " + this._contentlength);

        } else if (header == "WARC-Target-URI:") {

            //
            // Parse value
            //
            val = line.substr(17);

            //
            // Set the URL
            //
            this._url = val;

        }

        this._buffercursor = 0;

    }

}

WetParser.prototype.parseLine = WetParser__parseLine;
/////////////////////////////////////////////////////
// void WetParser::addWord( start, end )           //
/////////////////////////////////////////////////////
// Adds a word from content into a tree            //
/////////////////////////////////////////////////////
function WetParser__addWord(start, end) {

    //
    // TODO: Use index markers until word is actually needed
    //
    // return;

    //
    // Local variables
    //
    // var i, chars = [], buf, word = '';
    var tmp;

    //
    // Check length
    //
    if (start == end) {

        //
        // Nothing to do
        //
        return;

    }
    //
    // DEBUG
    //

    var bin_to_str = (function(bin, start, len) {
        var i, seq = [];
        for (i = 0; i < len; i++) {
            seq.push(bin[start + i]);
        }
        return String.fromCharCode.apply(this, seq);
    });

    // console.log("Adding string: " + bin_to_str(this._buffer, start, end - start));

    //
    // Initialize
    //
    // buf = this._buffer;
    tmp = EmailParser.toLower(this._buffer[start]);

    //
    // Convert bytes to string
    //
    // for(i=start;i<end;i++) {
    //
    // Push the ASCII
    //
    // chars.push(buf[i]);
    // }

    //
    // Set word
    //
    //word = String.fromCharCode.apply(this, chars).toLowerCase();

    //
    // Check for existence
    //
    // if (!this._wordtable[word[0]]) 
    if (!this._wordtable[tmp]) {

        //
        // Create a new entry
        //
        this._wordtable[tmp] = [];

    }

    //
    // Add word into dictionary
    //
    // this._wordtable[word[0]][word] = true;
    // TODO: Add length/size
    this._wordtable[tmp].push({ start: start, end: end, size: (end - start) });

    // console.log(word);


    //
    // Counter
    // 
    /*if (typeof mytimer === 'undefined')
    {
      mytimer = 20;
    }
  
    if (mytimer-- == 0) {
      console.log(this._wordtable);
      process.exit();
    }
    /**/
    //
    // Counter
    //

}

WetParser.prototype.addWord = WetParser__addWord;
/////////////////////////////////////////////////////
// void WetParser::parseChunk( chunk )             //
/////////////////////////////////////////////////////
// This method will parse a speciic chunk which    //
// was retrieved from a file pipe                  //
/////////////////////////////////////////////////////
function WetParser__parseChunk(chunk) {

    //
    // Local variables
    //
    var len, buf, i;

    //
    // Initialize
    //
    len = chunk.length;
    buf = this._buffer;

    //
    // Iterate through the chunk bytes.
    //
    // IMPORTANT: We are dealing with binary
    // inside this loop through "val"
    //
    for (i = 0; i < len; i++) {

        //
        // Get the current byte value
        //
        val = chunk[i];

        //
        // If we have a "contentlength", we
        // are currently parsing a content body
        //
        if (this._contentlength > 0) {

            //
            // We are parsing CONTENT here
            //

            //
            // 64 = '@'
            //
            if (val == 64) {

                //
                // Mark this as a potential email
                //
                this._potentialemail.push(this._buffercursor);

            }

            //
            // 10 = linefeed (NEW)
            // 13 = newline (NEW)
            // 32 = ' '(space) (NEW)
            //
            // else if (val == 32 || val == 10 || val == 13 || val == 32)
            else if (!(val >= 65 && val <= 122)) {

                //
                // We have a word
                //
                this.addWord(this._startword, this._buffercursor);

                //
                // We'll mark the new character as the start
                // of a new word
                //
                this._startword = this._buffercursor + 1;

            }
            //
            // Save this byte in our overall chunk
            //
            buf[this._buffercursor++] = val;

            //
            // Decrement our content length counter,
            // effectively describing how many bytes
            // are left
            //
            this._contentlength--;

            //
            // Check if we are done parsing content
            //
            if (this._contentlength == 0) {

                //
                // We are done parsing content
                //

                //
                // If there are potential emails
                //
                if (this._potentialemail.length != 0) {

                    //
                    // Parse content for emails
                    //
                    this.parseContent();

                }

                //
                // Reset
                //
                this._url = "";
                this._buffercursor = 0;
                this._potentialemail = [];
                this._wordtable = {};
            }

        } else {

            //
            // We are parsing HEADERS here
            //

            if (val == 13) {

                //
                // Reset(linefeed)
                //

            } else if (val == 10) {

                //
                // Newline; parse the current line
                //
                this.parseLine();

            } else {

                //
                // Arbitrary byte. Add this to buffer
                //
                buf[this._buffercursor++] = val;

            }

        }

    }

}

// function WetParser__parseChunk(chunk, cb) {
//     var start_time = (new Date()).getTime();
//     //
//     // Local variables
//     //
//     var len, buf, i;

//     //
//     // Initialize
//     //
//     len = chunk.length;
//     buf = this._buffer;

//     //
//     // Iterate through the chunk bytes.
//     //
//     // IMPORTANT: We are dealing with binary
//     // inside this loop through "val"
//     //
//     for (i = 0; i < len; i++) {

//         //
//         // Get the current byte value
//         //
//         val = chunk[i];

//         //
//         // If we have a "contentlength", we
//         // are currently parsing a content body
//         //
//         if (this._contentlength > 0) {

//             //
//             // We are parsing CONTENT here
//             //

//             //
//             // 64 = '@'
//             //
//             if (val == 64) {

//                 //
//                 // Mark this as a potential email
//                 //
//                 this._potentialemail.push(this._buffercursor);

//             }

//             //
//             // 10 = linefeed (NEW)
//             // 13 = newline (NEW)
//             // 32 = ' '(space) (NEW)
//             //
//             // else if (val == 32 || val == 10 || val == 13 || val == 32)
//             else if (!(val >= 65 && val <= 122)) {

//                 //
//                 // We have a word
//                 //
//                 this.addWord(this._startword, this._buffercursor);

//                 //
//                 // We'll mark the new character as the start
//                 // of a new word
//                 //
//                 this._startword = this._buffercursor + 1;

//             }
//             //
//             // Save this byte in our overall chunk
//             //
//             buf[this._buffercursor++] = val;

//             //
//             // Decrement our content length counter,
//             // effectively describing how many bytes
//             // are left
//             //
//             this._contentlength--;

//             //
//             // Check if we are done parsing content
//             //
//             if (this._contentlength == 0) {

//                 //
//                 // We are done parsing content
//                 //

//                 //
//                 // If there are potential emails
//                 //
//                 if (this._potentialemail.length != 0) {

//                     //
//                     // Parse content for emails
//                     //
//                     this.parseContent();

//                 }

//                 //
//                 // Reset
//                 //
//                 this._url = "";
//                 this._buffercursor = 0;
//                 this._potentialemail = [];
//                 this._wordtable = {};
//             }

//         } else {

//             //
//             // We are parsing HEADERS here
//             //

//             if (val == 13) {

//                 //
//                 // Reset(linefeed)
//                 //

//             } else if (val == 10) {

//                 //
//                 // Newline; parse the current line
//                 //
//                 this.parseLine();

//             } else {

//                 //
//                 // Arbitrary byte. Add this to buffer
//                 //
//                 buf[this._buffercursor++] = val;

//             }

//         }

//     }

//     var end_time = (new Date()).getTime();
//     var time_compare = end_time - start_time;
//     cb(parser.getEmails(), time_compare, len);
// }


WetParser.prototype.parseChunk = WetParser__parseChunk;
/////////////////////////////////////////////////////
// void _paser( filename, callback )               //
/////////////////////////////////////////////////////
// Begin the parsing of a WET file. It will        //
// execute callback per page.                      //
/////////////////////////////////////////////////////
function _parse(filename, callback) {

    //
    // Local variables
    //
    var readStream,
        parser,
        start_time,
        end_time,
        time_compare,
        bytes;

    //
    // Calculate bytes
    //
    bytes = fs.statSync(filename).size;

    //
    // Benchmark our time
    //
    start_time = (new Date()).getTime();

    //
    // Create a read pipe for our file
    //
    readStream = fs.createReadStream(filename);

    //
    // Create a new WetParser object
    //
    parser = new WetParser();

    //
    // Whenever there is data
    //
    readStream.on('data', function(chunk) {

        //
        // Parse chunk
        //
        parser.parseChunk(chunk);

    });

    readStream.on('end', function() {

        /*var writeStream = fs.createWriteStream("emails2.txt");
		// var emails = parser.getEmails();
		
    var emails = parser.getEmails();
        
		for( email in emails ) {
			
      console.log("email: " + email);
      writeStream.write(email + "\n");
			
		}
		
		writeStream.end();/**/

        end_time = (new Date()).getTime();
        time_compare = end_time - start_time;
        callback(parser.getEmails(), time_compare, bytes);

    });
}

function _parseStream(stream, cb) {
    console.log('Started parsing...');

    var bytes = 0;
    // //
    // // Benchmark our time
    // //
    // var start_time = Date.now();

    // //
    // // Create a new WetParser object
    // //
    var parser = new WetParser();

    //
    // Whenever there is data
    // //
    stream.on('data', function(chunk) {
//	if((bytes%500000) < 1000) console.log(bytes);
        bytes += chunk.length;
        parser.parseChunk(chunk);
    });

    stream.on('end', function() {
        // var elapsed = Date.now() - start_time;
        // var time = new Date(elapsed);
        // var secs = ('0' + time.getSeconds()).slice(-2);
        // var mins = ('0' + time.getMinutes()).slice(-2);

        // console.log('It took ' + mins + ":" + secs + ' mins');
        cb(parser.getEmails(), elapsed, bytes);
    });
}

/////////////////////////////////////////////////////
// Export functions                                //
/////////////////////////////////////////////////////
//                                                 //
// Expose the functions to other parts of the      //
// application                                     //
//                                                 //
/////////////////////////////////////////////////////
module.exports = {
    parse: _parse,
    parseStream: _parseStream,
};
