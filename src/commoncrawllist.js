/***************************************************
 * commoncrawllist.js                              *
 *                                                 *
 * This file creates an interface for adding sets  *
 * of "compressed" Common Crawl information        *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// class CommonCrawlList                           //
/////////////////////////////////////////////////////
// Defines methods for inserting and traversing    //
// a common crawl "compressed" list                //
/////////////////////////////////////////////////////
function CommonCrawlList(month, time, date, chunks, server, ip) {

    //
    // private field: "list"
    //
    this._list = {

        //
        // Items on the list as an associative array
        //
        items: {},

        //
        // First and last items
        //
        first: null,
        last: null,

        //
        // Count
        //
        count: 0

    }

}

/////////////////////////////////////////////////////
// void CommonCrawlList::add(month, time,          //
// date, chunks, server, ip)                       //
/////////////////////////////////////////////////////
// This method will instantiate a CommonCrawlList  //
// entry                                           //
/////////////////////////////////////////////////////
// function CommonCrawlList__add(month, time, date, chunks, server, ip) {

//     //
//     // Local variables
//     //
//     var ref;

//     //
//     // Increment the count
//     //
//     this._list.count++;

//     //
//     // Determine if the entry exists
//     //
//     ref = this._list.items[time];
//     if (ref) {

//         //
//         // If it exists, just update the chunk
//         //
//         ref.chunks = parseInt(chunks);
//         return;

//     }

//     //
//     // It does not exist. Create a new entry
//     //
//     this._list.items[time] = {}
//     ref = this._list.items[time];

//     //
//     // Set the fields
//     //
//     ref.month = month;
//     ref.time = time;
//     ref.date = date;
//     ref.chunks = chunks;
//     ref.server = server;
//     ref.ip = ip;

//     //
//     // Make first item on list if applicable
//     //
//     if (this._list.first == null) {

//         //
//         // Make this entry the first entry
//         //
//         this._list.first = ref;

//     } else {

//         //
//         // Set the next pointer of last entry
//         //
//         this._list.last.next = ref;

//     }

//     //
//     // Set the last entry
//     //
//     this._list.last = ref;

//     // console.log(this._list.items);
// }

// function CommonCrawlList__add(month, time, date, chunks, server, ip) {
function CommonCrawlList__add(data) {

    //
    // Local variables
    //
    var ref;

    //
    // Increment the count
    //
    this._list.count++;

    //
    // Determine if the entry exists
    //
    ref = this._list.items[time];
    if (ref) {

        //
        // If it exists, just update the chunk
        //
        ref.chunks = parseInt(chunks);
        return;

    }

    //
    // It does not exist. Create a new entry
    //
    this._list.items[time] = {}
    ref = this._list.items[time];

    //
    // Set the fields
    //
    ref.month = month;
    ref.time = time;
    ref.date = date;
    ref.chunks = chunks;
    ref.server = server;
    ref.ip = ip;

    //
    // Make first item on list if applicable
    //
    if (this._list.first == null) {

        //
        // Make this entry the first entry
        //
        this._list.first = ref;

    } else {

        //
        // Set the next pointer of last entry
        //
        this._list.last.next = ref;

    }

    //
    // Set the last entry
    //
    this._list.last = ref;

    // console.log(this._list.items);
}

CommonCrawlList.prototype.add = CommonCrawlList__add;

/////////////////////////////////////////////////////
// int CommonCrawlList::size()                     //
/////////////////////////////////////////////////////
// This method will return the amount of entries   //
// in the list                                     //
/////////////////////////////////////////////////////
function CommonCrawlList__size() {

    //
    // Just return the size of the list
    //
    return this._list.count;

}

CommonCrawlList.prototype.size = CommonCrawlList__size;

/////////////////////////////////////////////////////
// Object CommonCrawlList::getFirstEntry()         //
/////////////////////////////////////////////////////
// This method will return the first entry on the  //
// list                                            //
/////////////////////////////////////////////////////
function CommonCrawlList__getFirstEntry() {

    //
    // Just return the size of the list
    //
    return this._list.first;

}

CommonCrawlList.prototype.getFirstEntry = CommonCrawlList__getFirstEntry;

/////////////////////////////////////////////////////
// Object CommonCrawlList::getEntryByTime(time)    //
/////////////////////////////////////////////////////
// This method will return the an entry based off  //
// of a time                                       //
/////////////////////////////////////////////////////
function CommonCrawlList__getEntryByTime(time) {

    //
    // Just return the size of the list
    //
    return this._list.items[time] || null;

}

CommonCrawlList.prototype.getEntryByTime = CommonCrawlList__getEntryByTime;

/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = CommonCrawlList;