var Database = {

    pattern: [

        { pattern: "[fn].[ln]", specific: TYPE_SPECIFIC },
        { pattern: "[ln].[fn]", specific: TYPE_SPECIFIC },

        { pattern: "[fn]-[ln]", specific: TYPE_SPECIFIC },
        { pattern: "[ln]-[fn]", specific: TYPE_SPECIFIC },

        { pattern: "[fn][ln]", specific: TYPE_SPECIFIC },
        { pattern: "[ln][fn]", specific: TYPE_SPECIFIC },

        { pattern: "[fn]_[ln]", specific: TYPE_SPECIFIC },
        { pattern: "[ln]_[fn]", specific: TYPE_SPECIFIC },

        { pattern: "[fi].[ln]", specific: TYPE_SEMI },
        { pattern: "[ln].[fi]", specific: TYPE_SEMI },

        { pattern: "[fi]-[ln]", specific: TYPE_SEMI },
        { pattern: "[ln]-[fi]", specific: TYPE_SEMI },

        { pattern: "[fi][ln]", specific: TYPE_SEMI },
        { pattern: "[ln][fi]", specific: TYPE_SEMI },

        { pattern: "[fi]_[ln]", specific: TYPE_SEMI },
        { pattern: "[ln]_[fi]", specific: TYPE_SEMI },

        { pattern: "[fn][li]", specific: TYPE_NONE },
        { pattern: "[fn].[li]", specific: TYPE_NONE },

        { pattern: "[fi][li]", specific: TYPE_NONE },
        { pattern: "[fi].[li]", specific: TYPE_NONE },

        { pattern: "[li][fn]", specific: TYPE_NONE },
        { pattern: "[li].[fn]", specific: TYPE_NONE },

        { pattern: "[li][fi]", specific: TYPE_NONE },
        { pattern: "[li].[fi]", specific: TYPE_NONE },

        { pattern: "[fi][mi][ln]", specific: TYPE_SEMI },
        { pattern: "[fi][mi].[ln]", specific: TYPE_SEMI },

        { pattern: "[fn][mi][ln]", specific: TYPE_SEMI },
        { pattern: "[fn].[mi].[ln]", specific: TYPE_SEMI },

        { pattern: "[fn][mn][ln]", specific: TYPE_SPECIFIC },
        { pattern: "[fn].[mn].[ln]", specific: TYPE_SPECIFIC },

        { pattern: "[fn]-[li]", specific: TYPE_NONE },
        { pattern: "[fi]-[li]", specific: TYPE_NONE },

        { pattern: "[li]-[fn]", specific: TYPE_NONE },
        { pattern: "[li]-[fi]", specific: TYPE_NONE },

        { pattern: "[fi][mi]-[ln]", specific: TYPE_SEMI },
        { pattern: "[fn]-[mi]-[ln]", specific: TYPE_SEMI },

        { pattern: "[fn]-[mn]-[ln]", specific: TYPE_SPECIFIC },
        { pattern: "[fn]_[li]", specific: TYPE_NONE },

        { pattern: "[fi]_[li]", specific: TYPE_NONE },
        { pattern: "[li]_[fn]", specific: TYPE_NONE },

        { pattern: "[li]_[fi]", specific: TYPE_NONE },
        { pattern: "[fi][mi]_[ln]", specific: TYPE_SEMI },

        { pattern: "[fn]_[mi]_[ln]", specific: TYPE_SEMI },
        { pattern: "[fn]_[mn]_[ln]", specific: TYPE_SEMI },

        { pattern: "[fn]", specific: TYPE_NONE },
        { pattern: "[ln]", specific: TYPE_NONE },

    ]

};

function populate_db(fn) {
    Pattern.findOne({ id: 1 }).then(function(pattern) {

        if (pattern != null) {
            fn();
            return;
        } else {
            Pattern.bulkCreate(Database.pattern).then(function() {
                fn();
            });
        }

    });
}

module.exports = populate_db;