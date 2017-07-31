/***************************************************
 * emailparser.js                                  *
 *                                                 *
 * This is an interface to process emails          *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// Project imports                                 //
/////////////////////////////////////////////////////
var fs = require('fs');
var email_settings = require('../config/personalemails.js');
var personal_emails = email_settings.personal_emails;
var email_patterns = email_settings.email_patterns;

/////////////////////////////////////////////////////
// void email_slice_and_find(username, words, buf) //
/////////////////////////////////////////////////////
// This will slice and compare a name              //
/////////////////////////////////////////////////////
// 
// The algorithm is as follows:
// for an email, edking
// 1. Find words in email 
// 2. Found: "Ed", "King", "in"
// 3. Iterate list and compare two entries(O(N^2))
// 4. 
// 
// for an email, reenteringccasper
//

//
// Debug
//
var bin_to_str = (function(bin, start, len) {
    var i, seq = [];
    for (i = 0; i < len; i++) {
        seq.push(bin[start + i]);
    }
    return String.fromCharCode.apply(this, seq);
});

function email_get_adjacent(components, buf) {

    //
    // TODO: While scanning the strings, ignore
    // any non-alphabetic character until a match
    // comes in(i.e. Ed, King)
    //

    //
    // Local variables
    //
    var i, new_component, results = { left: null, current: null, right: null };

    //
    // Current word
    //
    results.current = components;

    //
    // Detect the word in front
    //
    new_component = { start: 0, end: 0, size: 0 };
    i = components.end + 1;
    new_component.start = i;
    // console.log(" WORD : " + bin_to_str(buf, components.start, components.size));
    // while(!(buf[i] >= 65 && buf[i] <= 122)){i++;}

    while (buf[i] >= 65 && buf[i] <= 122) {

        i++;

    }
    new_component.end = i;
    new_component.size = i - new_component.start;
    results.right = new_component;
    // console.log(" TO RIGHT: " + bin_to_str(buf, new_component.start, new_component.size));

    //
    // Detect word behind
    //
    new_component = { start: 0, end: 0, size: 0 };
    i = components.start - 2;
    new_component.end = i + 1;

    /*while(i >= 0 && !(buf[i] >= 65 && buf[i] <= 122))
    {
      i--;
    }*/

    while (i >= 0 && buf[i] >= 65 && buf[i] <= 122) {

        i--;

    }

    //
    // Check and see if it didn't cross boundary
    //
    if (i > 0) {
        i++;
        new_component.start = i;
        new_component.size = new_component.end - i;
        results.left = new_component;
        // console.log(" TO LEFT: " + bin_to_str(buf, new_component.start, new_component.size));
        // console.log(new_component);
    }


    // console.log(results);
    // console.log(components);
    // process.exit();
    return results;

}

//
// Order in ascending order the "remaining" field
// of word pairs.
//
// i.e. ["Ed", "King"] has remaining of 0 because "edking" is completely replaced
// i.e. ["Ed", "In"] has remaining of 2 because "edking" turns into "kg"
function email_sort_filter1(filter_results) {

    //
    // Local variables
    //
    var single_names, pair_names, merge_names;

    //
    // Comparator function to sort
    //
    var comparator_fn = (function(o1, o2) {
        return o1.remaining - o2.remaining;
    });

    //
    // Merge both lists
    //
    merge_names = filter_results.match_one.concat(filter_results.match_two).sort(comparator_fn);
    // console.log(merge_names);

    //
    // Sort single names
    //
    // single_names = filter_results.match_one.sort(comparator_fn);

    //
    // Sort name pairs
    //
    // pair_names = filter_results.match_two.sort(comparator_fn);

    // console.log(pair_names);
    // console.log(single_names);

    //
    // Merge the lists
    //
    return merge_names;

}

function email_sort_filter2(filter_results, words, buf) {

    //
    // TODO:
    // How many words match
    //

    //
    // Local variables
    //
    var i, len, key, tmp, component, results = {};

    len = filter_results.length;
    for (i = 0; i < len; i++) {
        component = { left: null, current: null, right: null };

        tmp = filter_results[i].current;
        // key = bin_to_str(buf, tmp.start, tmp.size).toLowerCase();
        key = bin_to_str(buf, tmp.start, tmp.size);
        component.current = bin_to_str(buf, tmp.start, tmp.size);

        tmp = filter_results[i].left;
        if (tmp) {
            component.left = bin_to_str(buf, tmp.start, tmp.size);
        }

        tmp = filter_results[i].right;
        if (tmp) {
            component.right = bin_to_str(buf, tmp.start, tmp.size);
        }

        if (component.right) {

            tmp = key + " " + component.right;
            if (results[tmp]) {
                results[tmp]++;
            } else {
                results[tmp] = 1;
            }

        }

        if (component.left) {

            tmp = component.left + " " + key;
            if (results[tmp]) {
                results[tmp]++;
            } else {
                results[tmp] = 1;
            }

        }

        // console.log(component);

    }

    // console.log(results);
    // console.log(filter_results);

    return results;

}

function email_sort_filter3(filter_results, words, buf) {

    //
    // Local variables
    //
    var names, first_initial, last_initial, result = [];

    for (fullname in filter_results) {

        // Initialize
        names = fullname.split(' ');
        first_initial = names[0][0];
        last_initial = names[1][0];

        // Check initials
        if (first_initial == first_initial.toUpperCase() && last_initial == last_initial.toUpperCase()) {

            result.push(fullname);

        }

    }

    return result;

}

function email_analyze_filters(filter1, filter2, clean_email, words, buf) {

    //
    // Filter1 will contain sorted results
    //
    filter1 = email_sort_filter1(filter1);

    //
    // Filter2 will pair words and order them by
    // their frequency
    // 
    filter2 = email_sort_filter2(filter2, words, buf);

    //
    // FILTER THREE: Which words from filter2 are capitalized
    // as proper nouns
    //
    filter3 = email_sort_filter3(filter2, words, buf);

    //
    // FILTER SIX: Essentially filter 1, but with
    // matched/found words
    //


    //
    // FILTER FOUR: Consecutive initials
    //

    //
    // FILTER FIVE: Middle names
    // Can be done with adjancency matching (Gary A. Andrew)
    //

    //
    // TODO: During word scanning, detect change in
    // uppercase/lowercase for word separation
    //

    //
    // Match the initials
    // + rgenn
    // - {"Sara Genn":1,"Robert Genn":1}
    //

    // console.log(filter1);
    // console.log(filter2);

    //fs.appendFile('analytics.txt', ' + ' + clean_email + '\r\n   - ' + JSON.stringify(filter3) + '\r\n', function(err) {});

    return filter3;

    // process.exit();

}

function email_calculate(username, components, words, buf) {

    //
    // Local variables
    //
    var piece, piece_length, clean_email, processed_email, i, j, filter1 = {},
        filter2 = [],
        len, tmp, tmp2;

    //
    // Load up a "clean" email
    //
    clean_email = username.replace(/\.|-|_/gi, '');
    // console.log(clean_email);

    //
    // Load up the different words in email
    // that are found on the page
    //
    piece = Object.keys(components);
    piece_length = piece.length;

    //
    // FILTER ONE: Do words make up email?
    // Do this by deleting the words found in email
    // TODO: Make this a function
    // TODO: Take account of frequency of the word
    // TODO: Check for middle name
    // 
    filter1['match_one'] = [];
    filter1['match_two'] = [];
    for (i = 0; i < piece_length; i++) {
        processed_email = clean_email;
        // console.log(" + processing: " + processed_email);

        //
        // Replace first word
        // If first word is "ed", it will modify "edking" to be "king" 
        //
        processed_email = processed_email.replace(piece[i], '');
        // console.log("   - with word `"+piece[i]+"`: " + processed_email);

        //
        // piece[i] = word
        //
        filter1['match_one'].push({ names: [piece[i]], remaining: processed_email.length });

        for (j = i + 1; j < piece_length; j++) {

            //
            // Replace second word
            // If second word is "in", it will modify "king" to be "kg"
            //
            // If second word is "king", username will now be empty
            // 
            var tmp = processed_email.replace(piece[j], '');
            // console.log("     - with word `"+piece[j]+"`: " + tmp);

            //
            // piece[j] = word
            //
            filter1['match_two'].push({ names: [piece[i], piece[j]], remaining: tmp.length });

        }


    }

    //
    // FILTER TWO: Are words adjacent?
    // Do this by scanning words left and right
    //
    // Can compare if word exists in piece Array
    // or calculate probability of being another name
    // 
    for (component in components) {

        //
        // Scan through the words
        //
        len = components[component].matches;
        for (i = 0; i < len; i++) {

            tmp = components[component].indexes[i];
            tmp2 = email_get_adjacent(tmp, buf);
            filter2.push(tmp2);

        }

        //
        // Get frequency of direction for word
        //

        //
        // FILTER THREE: Nicknames  
        //
        // To be implemented... 
        //

    }

    //
    // Feed filter results and calculate
    // probabily of name
    //
    return email_analyze_filters(filter1, filter2, clean_email, words, buf);


    // console.log(piece);
    // console.log(results);
    // process.exit();

}

function email_slice_and_find(username, words, buf) {

    //
    // Local variables
    //
    var first_letter, start_indexes, indexes_len, word, word_size, i, j, size, len, results = {};

    username = username.toLowerCase();
    len = username.length;
    binary = new Buffer(username);

    //
    // Starting cursor
    //
    for (i = 0; i < len - 1; i++) {

        //
        // Get the first letter of the email username
        //
        first_letter = binary[i];

        //
        // Get word index list for letter
        //
        start_indexes = words[first_letter];
        if (!start_indexes) {
            //
            // Reiterate. A word with that first letter does not exist
            // on the page
            //
            continue;

            // console.log(username);
            // console.log("start_indexes is empty for letter: " + first_letter + "(`"+String.fromCharCode(first_letter)+"`)");
            // console.log(words);
        }

        // console.log("Hint: " + bin_to_str(buf, start_indexes[0], 10));

        //
        // Get the length of the list
        //
        indexes_len = start_indexes.length;

        // console.log(" + Found index for word: " + bin_to_str(binary, i, len - i));
        /*console.log("   - Word Matches");
    
        var z, c;
        for(z=0;z<indexes_len;z++) {
          c = start_indexes[z];
          console.log("     > " + bin_to_str(buf, c.start, c.size));
        }*/

        //
        // Search the indexes(indexes for words that start with a specific letter)
        //
        for (j = 0; j < indexes_len; j++) {

            //
            // Word index
            //
            word = start_indexes[j].start;
            word_size = start_indexes[j].size;

            // console.log("   - Matching: " + bin_to_str(buf, word, start_indexes[j].size));

            //
            // TODO: Check sizes
            //

            //
            // We want to select at least 2 characters
            //
            size = 2;

            // while((size + i) < len || (size + i) < word_size) {
            while (size <= len && size <= word_size) {

                if (binary[i + size - 1] != char_to_lower(buf[word + size - 1])) {

                    // console.log("     > " + bin_to_str(buf, word, size) + '(' + (word_size) + ', ' + (size) + ')');
                    // console.log("      > `"+binary[i+size-1]+"` vs `"+buf[word+size-1]+"`");
                    // j = indexes_len;
                    // console.log("Found match: " + bin_to_str(binary, i, size));
                    break;

                }

                // if (size == start_indexes[j].size) {

                //
                // This evaluates to true if part of the email matches 
                // an entire word(edking, ed matches "Ed")
                //
                if (size == word_size) {
                    var str = bin_to_str(buf, word, size).toLowerCase();
                    // console.log("     * " + bin_to_str(buf, word, size));
                    // console.log("     * " + str);
                    // TODO : see why is it failing in results[str].indexes.push(start_indexes[j]);.... It says there is no push in undefined
                    if (results[str]) {
                        // TODO : remove try catch... Check why is throwing an error
                        try {
                            results[str].matches++;
                            results[str].indexes.push(start_indexes[j]);
                        } catch (e) {
                            console.log('results: ', results, '\n\n');
                            console.log('str: ', str, '\n\n');
                            console.log('results[str]: ', results[str], '\n\n');
                        }
                    } else {
                        results[str] = { matches: 1, indexes: [start_indexes[j]] };
                    }

                    //
                    // TODO: Remove break to scan for additional matches
                    // TODO: Check if match is email match on page
                    //
                    break;
                }

                size++;


            }
            // console.log(start_indexes);

        }

    }

    // console.log(results);
    // console.log("slice&find: " + username);
    return email_calculate(username, results, words, buf);
    // process.exit();

}



/////////////////////////////////////////////////////
// int  email_get_pattern(email, matches)          // 
/////////////////////////////////////////////////////
// This will fetch a first and last name for an    //
// email                                           //
/////////////////////////////////////////////////////
function email_check_patterns(email, fullname) {
    //
    // Local variables
    //
    var pattern, generated_email,
        name_components = fullname.split(' '),
        first_name = '',
        first_initial = '',
        middle_name = '',
        middle_initial = '',
        last_name = '',
        last_initial = '';

    if (name_components.length >= 1) {
        first_name = name_components[0];
        first_initial = name_components[0][0];
    }

    if (name_components.length >= 2) {
        last_name = name_components[1];
        last_initial = name_components[1][0];
    }

    if (name_components.length >= 3) {
        middle_name = last_name;
        middle_initial = last_initial;

        last_name = name_components[2];
        last_initial = name_components[2][0];
    }

    for (pattern in email_patterns) {
        pattern_id = email_patterns[pattern].id;
        generated_email = pattern.
        replace('[fn]', first_name).
        replace('[ln]', last_name).
        replace('[mn]', middle_name).
        replace('[fi]', first_initial).
        replace('[li]', last_initial).
        replace('[mi]', middle_initial);

        if (email == generated_email) {
            //
            // We have a match!
            //

            // console.log(email, '-', fullname);
            ret = {
                pattern_id: pattern_id,
                first_name: first_name,
                middle_name: middle_name,
                last_name: last_name,
                full_name: fullname
            };

            return ret;
            // console.log(ret);
            // process.exit();
            // return fullname;
        }
    }

    return null;
}

function email_get_pattern(email, matches) {
    //
    // Local variables
    //
    var i,
        len,
        ret = null;

    len = matches.length;

    for (i = 0; i < len; i++) {
        ret = email_check_patterns(email.toLowerCase(), matches[i].toLowerCase());
        if (ret) {
            break;
        }
    }

    return ret;
}

/////////////////////////////////////////////////////
// void email_fetch_name(email, words, buf)        //
/////////////////////////////////////////////////////
// This will fetch a first and last name for an    //
// email                                           //
/////////////////////////////////////////////////////
// edking@02809photo.com
// reenteringccasper@centurytel.net
//
// IDEAS: 
// 1. Use David's pattern with Ukraine method of slicing emails
// 2. Strip numbers and symbols from email and slice and find page matches
function email_fetch_name(email, words, buf) {

    //
    // Local variables
    //
    var username,
        stripped_username,
        components,
        ret = null;

    //
    // STEP 1 - obtain the username portion
    // of the email
    //
    username = email.split('@')[0];

    //
    // STEP 2 - strip any numerical symbols from
    // username portion
    //
    stripped_username = username.replace(/[0-9]+/gi, '');

    //
    // STEP 3 - Break into components
    //
    components = stripped_username.split(/-|\.|_/gi);

    if (components.length == 1) {

        //
        // Handle cases for 1 component
        //
        potential_names = email_slice_and_find(components[0], words, buf);
        ret = email_get_pattern(stripped_username, potential_names);

        // console.log(result);
        // process.exit();

    } else if (components.length == 2) {

        //
        // Handle cases for 2 components
        //
        components[0] = stripped_username.replace(/-|\.|_/gi, '');
        potential_names = email_slice_and_find(components[0], words, buf);
        ret = email_get_pattern(stripped_username, potential_names);

        // console.log('I have a two component email');
        // console.log(email);
        // console.log(components);
        // process.exit();

    }

    // if (ret)
    // {
    // console.log(ret.full_name + ' <'+email+'>');
    return ret;
    // process.exit();
    // }

    // console.log("I have username: " + username);

    // process.exit();

}

/////////////////////////////////////////////////////
// int char_to_lower (character)                   //
/////////////////////////////////////////////////////
// Converts an integer character to lower          //
/////////////////////////////////////////////////////
function char_to_lower(character) {

    return (character >= 65 && character <= 90) ? character + 32 : character;

}

/////////////////////////////////////////////////////
// void email_parse(url, emails, hint, words, buf) //
/////////////////////////////////////////////////////
// Will parse an email and verify presence in page //
/////////////////////////////////////////////////////
function email_parse(url, email_list, email_hints, word_table, buf) {

    //
    // Local variables
    //
    var i, j, at, len, start, end, email, extract, charseq;
    var email_regex = /[A-Za-z][\w-.]+@([\w.]+\.[A-Za-z]{2,5})/gi;

    // 
    // Initialize
    // 
    len = email_hints.length;

    //
    // Iterate through all the potential emails
    //
    for (i = 0; i < len; i++) {

        //
        // Placeholders
        //
        at = email_hints[i];
        start = at - 64;
        end = at + 64;
        charseq = [];

        // console.log("@ at " + at + "... searching from " + start + "-" + end);
        for (j = start; j < end; j++) {

            //
            // Build a string
            //
            charseq.push(buf[j]);

        }

        //
        // Convert bytes into string
        //
        email = String.fromCharCode.apply(this, charseq);

        // console.log("Regex: `" + email.match(email_regex) + "`");

        //
        // Use a regular expression to extra email
        //
        // extract = email.match(email_regex);
        extract = email_regex.exec(email);

        //
        // Check if extracted
        //
        if (extract) {

            //
            // We now have an email address
            // 

            // this._emaillist.push(extract[0]);

            // extract[1] = domain
            if (personal_emails[extract[1]]) {

                // TODO: Add personal emails
                continue;

            }

            // this._emaillist[extract[0]] = true;
            extract[0] = extract[0].toLowerCase();

            // (NEW)
            if (true) {
                // if (url == 'http://cites.org/esp/com/ac/member.php') {
                // if (url == 'http://artquotes.robertgenn.com/getquotes.php?catid=304&numcats=370') {
                // if (url == 'http://alsa-project.org/main/index.php?title=Changes_v1.0.11_v1.0.12rc1&oldid=1160') {
                // if (url == 'http://albarchive.merlinone.net/mweb/wmsql.wm.request?oneimage&imageid=6446553') {
                // if (url == 'http://advanceindiana.blogspot.com/2012/03/obama-may-rue-saying-son-would-look_3385.html') {
                // if (url == 'http://aboutlincolncenter.org/support/support-corporate-sponsorship/corporate-entertaining') {
                // if (url == 'http://arkivverket.no/URN:db_read/db/49309/486/') {
                // if (url == 'http://02809photo.com/') {
                // if (url == 'http://1caseycolette.blogspot.com/2011/11/80-worth-of-amazon-gift-cards-giveaway.html?showComment=1323514602233') {
                // if (url == 'http://scholar.lib.vt.edu/theses/available/etd-11162009-180706/') {
                // if (url == 'http://warwicksd.org/teacherweb/home.php?id=527') {

                ret = email_fetch_name(extract[0], word_table, buf);

                if (ret) {
                    // TODO: Account multiple emails
                    // console.log(url);
                    // process.exit();

                    if (!email_list[extract[0]]) {

                        email_list[extract[0]] = {
                            email: extract[0],
                            tries: 0,
                            // counts: 0,
                            pattern_id: ret.pattern_id,

                            first_name: ret.first_name,
                            middle_name: ret.middle_name,
                            last_name: ret.last_name,
                            full_name: ret.full_name,
                            has_name: true,

                            domain: '',
                            is_personal_email: false,

                            crawled_by: '',
                            crawled_on: null,
                            found_on: url,

                            verified_by: '',
                            verified_on: null,
                            verification_status: 'none',

                            // scraped_from: url,
                            scraped_from: '',
                            is_valid: true,
                            priority: 1
                        };

                    }

                    // email_list[extract[0]].counts++;

                    // console.log(email_list[extract[0]]);
                    // process.exit();

                }

            }

            // if (!email_list[extract[0]]) 
            // {

            //  email_list[extract[0]] = {};

            // }

            // email_list[extract[0]][url] = true;

        }

    }

}

/////////////////////////////////////////////////////
// Export functions                                //
/////////////////////////////////////////////////////
module.exports = {

    parse: email_parse,
    toLower: char_to_lower

};