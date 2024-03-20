// TODO confirm that possible to remove then add an item with different active effect
// add injury and disease item types
// reduce range of weapon impacts to Combat & Tactics scale? maybe d14 for maul
// ^ maybe targets of 2/4/6/8/10 and d3/d4/d6/d8/d10/d12 dice
// -- update weapon spreadsheet

// injury has:
// severity
// notes has recommended treatment (GM only),
// location,
// bleeding (none, serious, critical), -- bleeding must be stopped before treatment
// healed (no longer healing)
// wound (closed, open, dressed, herbal treatment, infected)
// admin:
// healing TN
// healing mod (+3 for each )
// active effect (unless just a bleeder)
// permanent severity (add 1 for each heal fail after 3rd, stop healing when severity reaches this)
// ^ can start at -3 so can add 1 for each fail and don't have to track the first 3 fails separately
// TODO write lil monte carlo script to estimate heal/spell learn odds
// remember when deleting injuries/disease items, have to delete TimeQ events too -- make button that does both
// when cuts heal, rename as scar

// TODO refactor to use roll over THAC0-like skills and descending AC
// use simple 2d6 for reaction, morale and d6 for surprise, initiative, passive noticing
// saves start at 16 and improve +1 every 2/3 levels for fast, every 1/2 for slow

// THEN CONTINUE to actor derived data!!!
