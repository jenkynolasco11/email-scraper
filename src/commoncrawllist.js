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

        count: 0,

        processed: 0,

        // toProcess: 0,

        months: {

        },
    };

    // this._list = {

    //     //
    //     // Items on the list as an associative array
    //     //
    //     items: {},

    //     //
    //     // First and last items
    //     //
    //     first: null,
    //     last: null,

    //     //
    //     // Count
    //     //
    //     count: 0

    // }

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

// function CommonCrawlList__add(data) {
function CommonCrawlList__add(month, time, date, chunks, server, ip, url) {

    var list = this._list;
    var ref = null,
        obj = null;

    // list.count += 1;

    // In case the month doesn't exist, create it
    if (!list.months[month]) {
        list.months[month] = {
            month: month,
            count: 0,
            processed: 0,
            first: null,
            last: null,
            urls: {},
            done: false,
        };
        // list.months[month][time] = [];
    }

    // we take this month as reference
    ref = list.months[month];

    if (ref.urls[time]) {

        // If it exists, just update the chunk
        // ref.urls[time].chunks = parseInt(chunks);
        // console.log(ref.urls[time])
        // console.log(chunks);
        return;

    }
    var li = 0;
    obj = {
        month: month,
        time: time,
        date: date,
        chunks: parseInt(chunks),
        // chunks: parseInt(chunks) > li ? li : parseInt(chunks),
        server: server,
        ip: ip,
        url: url,
        next: null
            // processed: false,   // Tempting
    }



    if (!ref.first) {

        // If there is no first, set it as first
        ref.first = obj;

    } else {

        ref.last.next = obj;

    }

    ref.urls[time] = obj;

    list.months[month].count += (+chunks);

    this._list.count += (+chunks);

    // Set new obj as last
    ref.last = obj;
}

CommonCrawlList.prototype.add = CommonCrawlList__add;


// 1 for descending, -1 for ascending
function CommonCrawlList__getSortedKeys(asc) {
    var keys = Object.keys(this._list.months);
    // var newObj = {};

    keys = keys.sort(function(a, b) {
        if (a < b) return 1 * asc;
        if (a > b) return -1 * asc;
        return 0;
    });

    return keys;
}

CommonCrawlList.prototype.getSortedKeys = CommonCrawlList__getSortedKeys;



function CommonCrawlList__asArray(asc) {
    var arr = [],
        self = this;

    var keys = this.getSortedKeys(asc);

    arr = keys.map(function(key) {
        // return [key, self._list.months[key]];
        return self._list.months[key];
        // return {
        //     urls: self._list.months[key].urls,
        //     month: key,
        //     processed: 0,
        //     count: self._list.months[key].count
        // };
    });

    return arr;
}

CommonCrawlList.prototype.asArray = CommonCrawlList__asArray;


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
function CommonCrawlList__getEntryByTime(time, month) {

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