// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { menuRepository } from "./services";
import {
    loadDemoAccessRequests,
    saveDemoAccessRequests,
} from "./services/accessRequestStore";
import {
    extractItemNameFromKey,
    resolveItemUniqueKey,
    resolveRestaurantId,
    slugifyIdentifier,
} from "./services/demoSchemaUtils";
import {
    loadReportedIssues,
    saveReportedIssues,
} from "./services/itemInteractionStore";
import {
    createOwnerUploadedFile,
    loadOwnerRestaurantChangeRequests,
    loadOwnerRestaurantRequests,
    loadOwnerTasks,
    saveOwnerRestaurantChangeRequests,
    saveOwnerRestaurantRequests,
    saveOwnerTasks,
} from "./services/ownerWorkflowStore";
import {
    getDemoAdminProfiles,
    getDemoLoginProfiles,
    getDemoRestaurantOwnerProfiles,
    loadDemoSession,
    saveDemoSession,
} from "./services/profileStore";

const ALL=[{"n":"Chicken Breast","r":"Noodlebox","cat":"Protein Add-on","p":18,"c":80,"f":1,"ca":1,"so":null,"su":null,"ppc":0.225},{"n":"Prawns","r":"Noodlebox","cat":"Protein Add-on","p":20,"c":90,"f":1,"ca":0,"so":null,"su":null,"ppc":0.2222},{"n":"Beef Sirloin","r":"Noodlebox","cat":"Protein Add-on","p":18,"c":90,"f":2,"ca":0,"so":null,"su":null,"ppc":0.2},{"n":"Organic Tofu","r":"Noodlebox","cat":"Protein Add-on","p":14,"c":80,"f":1,"ca":3,"so":null,"su":null,"ppc":0.175},{"n":"5 Pc Hand-Breaded Chicken Tenders","r":"A&W","cat":"Chicken","p":67,"c":430,"f":15,"ca":8,"so":1830,"su":0,"ppc":0.1558},{"n":"3 Pc Hand-Breaded Chicken Tenders","r":"A&W","cat":"Chicken","p":40,"c":260,"f":9,"ca":5,"so":1100,"su":0,"ppc":0.1538},{"n":"New York Steak","r":"Old Spaghetti Factory","cat":"Grilled Items","p":54,"c":360,"f":14,"ca":5,"so":1370,"su":2,"ppc":0.15},{"n":"1 Pc Hand-Breaded Chicken Tenders","r":"A&W","cat":"Chicken","p":13,"c":90,"f":3,"ca":2,"so":370,"su":0,"ppc":0.1444},{"n":"Bacon Wrapped Filet Mignon 7oz","r":"Chuck's Roadhouse","cat":"Steaks","p":54,"c":443,"f":22.4,"ca":0,"so":522,"su":0,"ppc":0.1219},{"n":"Steak Frites","r":"Moxies","cat":"Steaks","p":44,"c":370,"f":20,"ca":2,"so":1400,"su":0,"ppc":0.1189},{"n":"Sirloin","r":"Moxies","cat":"Steaks","p":44,"c":370,"f":20,"ca":2,"so":1400,"su":0,"ppc":0.1189},{"n":"New York 10oz","r":"Chuck's Roadhouse","cat":"Steaks","p":76,"c":674,"f":37,"ca":0,"so":309,"su":0,"ppc":0.1128},{"n":"Rib-Eye 12oz","r":"Chuck's Roadhouse","cat":"Steaks","p":102,"c":904,"f":55,"ca":0,"so":420,"su":0,"ppc":0.1128},{"n":"Crispy Tofu","r":"Noodlebox","cat":"Protein Add-on","p":14,"c":130,"f":1,"ca":11,"so":null,"su":null,"ppc":0.1077},{"n":"Steak & Cheese Salad","r":"Subway","cat":"Salads","p":17,"c":160,"f":6,"ca":13,"so":620,"su":6,"ppc":0.1062},{"n":"New York","r":"Moxies","cat":"Steaks","p":62,"c":590,"f":37,"ca":2,"so":1450,"su":0,"ppc":0.1051},{"n":"Rib Eye","r":"Moxies","cat":"Steaks","p":100,"c":960,"f":61,"ca":2,"so":1550,"su":0,"ppc":0.1042},{"n":"Turkey Breast Salad","r":"Subway","cat":"Salads","p":12,"c":120,"f":3,"ca":13,"so":570,"su":6,"ppc":0.1},{"n":"T-Bone 14oz","r":"Chuck's Roadhouse","cat":"Steaks","p":101,"c":1035,"f":64,"ca":0,"so":442,"su":0,"ppc":0.0976},{"n":"Grilled Tenders - 5","r":"A&W","cat":"Chicken","p":33,"c":360,"f":8,"ca":0,"so":1180,"su":0,"ppc":0.0917},{"n":"Grilled Tenders - 3","r":"A&W","cat":"Chicken","p":20,"c":220,"f":4.5,"ca":0,"so":630,"su":0,"ppc":0.0909},{"n":"Chicken Wings","r":"Old Spaghetti Factory","cat":"Appetizers","p":75,"c":830,"f":52,"ca":12,"so":3180,"su":0,"ppc":0.0904},{"n":"Top Sirloin 7oz","r":"Chuck's Roadhouse","cat":"Steaks","p":42,"c":466,"f":32.5,"ca":0,"so":269,"su":0,"ppc":0.0901},{"n":"Porterhouse 20oz","r":"Chuck's Roadhouse","cat":"Steaks","p":142,"c":1585,"f":112,"ca":0,"so":545,"su":0,"ppc":0.0896},{"n":"NY Steak Sandwich","r":"Old Spaghetti Factory","cat":"Lunch","p":44,"c":500,"f":25,"ca":24,"so":1630,"su":3,"ppc":0.088},{"n":"Rotisserie-Style Chicken Salad","r":"Subway","cat":"Salads","p":13,"c":150,"f":4,"ca":10,"so":340,"su":5,"ppc":0.0867},{"n":"Big Blueberry Protein","r":"Jugo Juice","cat":"Protein Smoothies","p":27.4,"c":322,"f":3.3,"ca":45.6,"so":null,"su":null,"ppc":0.0851},{"n":"Black Forest Ham Salad","r":"Subway","cat":"Salads","p":11,"c":130,"f":3,"ca":13,"so":590,"su":6,"ppc":0.0846},{"n":"Crispy Chicken","r":"Noodlebox","cat":"Protein Add-on","p":16,"c":190,"f":1.5,"ca":24,"so":null,"su":null,"ppc":0.0842},{"n":"Rotisserie-Style Chicken","r":"Subway","cat":"6\" Classic Subs","p":26,"c":320,"f":5,"ca":43,"so":650,"su":5,"ppc":0.0813},{"n":"Chicken Sandwich - Hand Breaded","r":"A&W","cat":"Chicken","p":33,"c":410,"f":12,"ca":43,"so":1130,"su":8,"ppc":0.0805},{"n":"Dippin Chicken 5pc","r":"Triple O's","cat":"Classics & Sides","p":35,"c":450,"f":18.2,"ca":28.3,"so":917,"su":8.3,"ppc":0.0778},{"n":"Chicken Parmigiana","r":"Old Spaghetti Factory","cat":"Grilled Items","p":55,"c":711,"f":36,"ca":40,"so":1000,"su":6,"ppc":0.0774},{"n":"Chicken Club Sandwich - Hand Breaded","r":"A&W","cat":"Chicken","p":36,"c":470,"f":17,"ca":43,"so":1370,"su":9,"ppc":0.0766},{"n":"Grilled Chicken","r":"Subway","cat":"6\" Limited/Regional Subs","p":21,"c":280,"f":4,"ca":41,"so":690,"su":6,"ppc":0.075},{"n":"Sweet Onion Chicken Teriyaki Salad","r":"Subway","cat":"Salads","p":18,"c":240,"f":4,"ca":34,"so":760,"su":26,"ppc":0.075},{"n":"Garlic Parmesan Chicken Wings","r":"Old Spaghetti Factory","cat":"Appetizers","p":93,"c":1250,"f":90,"ca":15,"so":4270,"su":2,"ppc":0.0744},{"n":"Grilled Chicken","r":"Moxies","cat":"Sides","p":20,"c":270,"f":22,"ca":1,"so":730,"su":0,"ppc":0.0741},{"n":"Peanut Butter Protein","r":"Jugo Juice","cat":"Protein Smoothies","p":32.5,"c":440,"f":15.1,"ca":50.7,"so":null,"su":null,"ppc":0.0739},{"n":"Chuck's BBQ Chicken","r":"Chuck's Roadhouse","cat":"BBQ & Ribs","p":26,"c":364,"f":8.5,"ca":0,"so":1930,"su":0,"ppc":0.0714},{"n":"Lunch Lasagna","r":"Old Spaghetti Factory","cat":"Lunch","p":49,"c":690,"f":29,"ca":59,"so":1360,"su":6,"ppc":0.071},{"n":"Tropical Green Protein","r":"Jugo Juice","cat":"Protein Smoothies","p":25.7,"c":366,"f":2.5,"ca":62.5,"so":null,"su":null,"ppc":0.0702},{"n":"Mocha Protein","r":"Jugo Juice","cat":"Protein Smoothies","p":27.7,"c":402,"f":0.6,"ca":27.7,"so":null,"su":null,"ppc":0.0689},{"n":"Bacon Cheeseburger","r":"Moxies","cat":"Handhelds","p":68,"c":990,"f":52,"ca":53,"so":1670,"su":4,"ppc":0.0687},{"n":"Crispy Beef","r":"Noodlebox","cat":"Protein Add-on","p":13,"c":190,"f":2.5,"ca":14,"so":null,"su":null,"ppc":0.0684},{"n":"Lasagna","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":79,"c":1170,"f":45,"ca":115,"so":2150,"su":10,"ppc":0.0675},{"n":"Yangzhou Fried Rice Box","r":"Noodlebox","cat":"Boxes","p":46,"c":682,"f":42,"ca":48,"so":null,"su":null,"ppc":0.0674},{"n":"Steak & Cheese","r":"Subway","cat":"6\" Classic Subs","p":24,"c":360,"f":10,"ca":43,"so":1120,"su":5,"ppc":0.0667},{"n":"Chicken & Rib Combo","r":"Chuck's Roadhouse","cat":"BBQ & Ribs","p":53,"c":801,"f":34,"ca":0,"so":2816,"su":0,"ppc":0.0662},{"n":"Turkey Breast","r":"Subway","cat":"6\" Classic Subs","p":19,"c":290,"f":5,"ca":44,"so":860,"su":7,"ppc":0.0655},{"n":"Mushroom Sirloin","r":"Moxies","cat":"Steaks","p":47,"c":720,"f":52,"ca":2,"so":2000,"su":0,"ppc":0.0653},{"n":"Pink Power Protein","r":"Jugo Juice","cat":"Protein Smoothies","p":26,"c":400,"f":4,"ca":68,"so":null,"su":null,"ppc":0.065},{"n":"Sweet Onion Chicken Teriyaki","r":"Subway","cat":"6\" Classic Subs","p":24,"c":370,"f":5,"ca":59,"so":920,"su":19,"ppc":0.0649},{"n":"Chicken Rancher","r":"Subway","cat":"6\" Chicken Subs","p":36,"c":560,"f":26,"ca":45,"so":1140,"su":6,"ppc":0.0643},{"n":"Chimichurri Steak Salad","r":"Moxies","cat":"Soup & Salads","p":38,"c":600,"f":21,"ca":31,"so":1240,"su":20,"ppc":0.0633},{"n":"Thai Chicken Wrap","r":"Jugo Juice","cat":"Wraps","p":20,"c":320,"f":5,"ca":47,"so":null,"su":null,"ppc":0.0625},{"n":"Italian B.M.T. Salad","r":"Subway","cat":"Salads","p":15,"c":240,"f":16,"ca":13,"so":1080,"su":6,"ppc":0.0625},{"n":"Manicotti","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":43,"c":690,"f":36,"ca":51,"so":2290,"su":8,"ppc":0.0623},{"n":"2 Pc Fish & Chips","r":"Chuck's Roadhouse","cat":"Favourites","p":58,"c":933,"f":45,"ca":0,"so":2118,"su":0,"ppc":0.0622},{"n":"Black Forest Ham","r":"Subway","cat":"6\" Classic Subs","p":18,"c":290,"f":5,"ca":44,"so":870,"su":7,"ppc":0.0621},{"n":"Meatball Marinara Salad","r":"Subway","cat":"Salads","p":18,"c":290,"f":16,"ca":22,"so":800,"su":9,"ppc":0.0621},{"n":"Beef Dip","r":"Moxies","cat":"Handhelds","p":56,"c":910,"f":42,"ca":82,"so":2110,"su":4,"ppc":0.0615},{"n":"Spaghetti with Meatballs","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":51,"c":830,"f":26,"ca":100,"so":1910,"su":10,"ppc":0.0614},{"n":"Seafood Linguine","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":62,"c":1020,"f":38,"ca":109,"so":2090,"su":9,"ppc":0.0608},{"n":"Piri-Piri Chicken","r":"Subway","cat":"6\" Chicken Subs","p":31,"c":510,"f":23,"ca":44,"so":1170,"su":5,"ppc":0.0608},{"n":"Blackened Shrimp Tacos","r":"Moxies","cat":"Handhelds","p":17,"c":280,"f":12,"ca":24,"so":1300,"su":2,"ppc":0.0607},{"n":"Tuna Poke Bowl","r":"Moxies","cat":"Pastas & Bowls","p":35,"c":580,"f":30,"ca":36,"so":1230,"su":14,"ppc":0.0603},{"n":"Blackened Chicken Burger","r":"Moxies","cat":"Handhelds","p":39,"c":650,"f":32,"ca":48,"so":2170,"su":3,"ppc":0.06},{"n":"Veggie Delite Salad","r":"Subway","cat":"Salads","p":3,"c":50,"f":1,"ca":9,"so":75,"su":4,"ppc":0.06},{"n":"Philly Beef Sandwich","r":"Chuck's Roadhouse","cat":"Sandwiches","p":42,"c":701,"f":50,"ca":0,"so":941,"su":0,"ppc":0.0599},{"n":"Bourbon BBQ Steak & Cheddar","r":"Subway","cat":"6\" Steak Subs","p":31,"c":520,"f":18,"ca":55,"so":1230,"su":9,"ppc":0.0596},{"n":"Roasted Garlic Grilled Chicken","r":"Old Spaghetti Factory","cat":"Grilled Items","p":70,"c":1180,"f":62,"ca":83,"so":1030,"su":2,"ppc":0.0593},{"n":"Hunter's Chicken","r":"Old Spaghetti Factory","cat":"Grilled Items","p":42,"c":731,"f":44,"ca":43,"so":570,"su":8,"ppc":0.0575},{"n":"Spicy Chicken Sandwich","r":"Chuck's Roadhouse","cat":"Sandwiches","p":36,"c":633,"f":46,"ca":0,"so":1820,"su":0,"ppc":0.0569},{"n":"Chicken Tenders and Fries","r":"Old Spaghetti Factory","cat":"Lunch","p":37,"c":650,"f":25,"ca":31,"so":1520,"su":2,"ppc":0.0569},{"n":"Chicken Rancher Wrap","r":"Subway","cat":"Wraps","p":37,"c":650,"f":31,"ca":56,"so":1340,"su":5,"ppc":0.0569},{"n":"3 Piece Chicken Strips","r":"A&W","cat":"Chicken","p":21,"c":370,"f":18,"ca":29,"so":1190,"su":8,"ppc":0.0568},{"n":"Baby Back Ribs - Full Rack","r":"Moxies","cat":"Mains","p":100,"c":1760,"f":96,"ca":94,"so":310,"su":44,"ppc":0.0568},{"n":"Chicken & Ribs","r":"Moxies","cat":"Mains","p":75,"c":1320,"f":72,"ca":69,"so":3260,"su":17,"ppc":0.0568},{"n":"Chipotle Mango Chicken","r":"Moxies","cat":"Mains","p":55,"c":970,"f":51,"ca":79,"so":2750,"su":15,"ppc":0.0567},{"n":"Grilled Salmon","r":"Moxies","cat":"Sides","p":17,"c":300,"f":25,"ca":0,"so":340,"su":0,"ppc":0.0567},{"n":"Great Canadian Club","r":"Subway","cat":"6\" Deli Subs","p":27,"c":480,"f":20,"ca":49,"so":1390,"su":8,"ppc":0.0563},{"n":"Baby Back Ribs","r":"Old Spaghetti Factory","cat":"Grilled Items","p":84,"c":1500,"f":101,"ca":57,"so":1330,"su":43,"ppc":0.056},{"n":"Chicken Bacon Cheddar","r":"Triple O's","cat":"Burgers","p":44,"c":791,"f":41,"ca":58,"so":1214,"su":12,"ppc":0.0556},{"n":"Spaghetti with IMPOSSIBLE Meatballs","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":46,"c":830,"f":29,"ca":100,"so":2030,"su":9,"ppc":0.0554},{"n":"Buffalo Chicken Sandwich","r":"Chuck's Roadhouse","cat":"Sandwiches","p":37,"c":673,"f":26.5,"ca":0,"so":1463,"su":0,"ppc":0.055},{"n":"Loaded Breakfast Wrap","r":"Triple O's","cat":"Breakfast","p":30.8,"c":564,"f":41,"ca":21,"so":943,"su":1.4,"ppc":0.0546},{"n":"Mushroom Onion Melts Burger - Double","r":"A&W","cat":"Burgers","p":32,"c":590,"f":34,"ca":39,"so":1480,"su":7,"ppc":0.0542},{"n":"The Big Chuck","r":"Chuck's Roadhouse","cat":"Burgers","p":74,"c":1366,"f":81,"ca":0,"so":2377,"su":0,"ppc":0.0542},{"n":"Cheeseburger","r":"Moxies","cat":"Handhelds","p":45,"c":830,"f":44,"ca":57,"so":2330,"su":5,"ppc":0.0542},{"n":"Nashville-Style Hot Chicken","r":"Subway","cat":"6\" Chicken Subs","p":32,"c":590,"f":27,"ca":53,"so":1270,"su":7,"ppc":0.0542},{"n":"Spaghetti with Meat Sauce","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":33,"c":610,"f":11,"ca":97,"so":1240,"su":10,"ppc":0.0541},{"n":"Turkey Bacon Club Wrap","r":"Jugo Juice","cat":"Wraps","p":21,"c":390,"f":19,"ca":30,"so":null,"su":null,"ppc":0.0538},{"n":"Teriyaki Crunch","r":"Subway","cat":"6\" Chicken Subs","p":29,"c":540,"f":15,"ca":67,"so":1340,"su":20,"ppc":0.0537},{"n":"Grilled Chicken Club","r":"Chuck's Roadhouse","cat":"Sandwiches","p":33,"c":620,"f":32,"ca":0,"so":1849,"su":0,"ppc":0.0532},{"n":"Rotisserie-Style Chicken Wrap","r":"Subway","cat":"Wraps","p":26,"c":490,"f":19,"ca":55,"so":960,"su":4,"ppc":0.0531},{"n":"B.L.T.","r":"Subway","cat":"6\" Limited/Regional Subs","p":19,"c":360,"f":13,"ca":42,"so":930,"su":4,"ppc":0.0528},{"n":"Bacon Cheese Burger","r":"Chuck's Roadhouse","cat":"Burgers","p":44,"c":836,"f":44.7,"ca":0,"so":1392,"su":0,"ppc":0.0526},{"n":"Chicken Avocado Wrap","r":"Jugo Juice","cat":"Wraps","p":23,"c":440,"f":24,"ca":36,"so":null,"su":null,"ppc":0.0523},{"n":"GOA Chicken Wrap","r":"Jugo Juice","cat":"Wraps","p":23,"c":440,"f":23,"ca":33,"so":null,"su":null,"ppc":0.0523},{"n":"Original Bacon Cheeseburger - Double","r":"A&W","cat":"Burgers","p":36,"c":690,"f":43,"ca":42,"so":1410,"su":10,"ppc":0.0522},{"n":"Meatball Marinara","r":"Subway","cat":"6\" Classic Subs","p":24,"c":460,"f":18,"ca":51,"so":1170,"su":7,"ppc":0.0522},{"n":"Sweet Onion Teriyaki Wrap","r":"Subway","cat":"Wraps","p":24,"c":460,"f":10,"ca":70,"so":1110,"su":18,"ppc":0.0522},{"n":"Morning Blend Protein","r":"Jugo Juice","cat":"Protein Smoothies","p":28,"c":540,"f":7,"ca":93,"so":null,"su":null,"ppc":0.0519},{"n":"Original Burger","r":"A&W","cat":"Burgers","p":31,"c":600,"f":34,"ca":42,"so":1260,"su":10,"ppc":0.0517},{"n":"Double Cheeseburger","r":"A&W","cat":"Burgers","p":31,"c":600,"f":34,"ca":42,"so":1260,"su":10,"ppc":0.0517},{"n":"Steak'n Bacon","r":"Subway","cat":"6\" Steak Subs","p":31,"c":600,"f":32,"ca":46,"so":1480,"su":6,"ppc":0.0517},{"n":"Full Rack Ribs","r":"Chuck's Roadhouse","cat":"BBQ & Ribs","p":55,"c":1070,"f":51,"ca":0,"so":2960,"su":0,"ppc":0.0514},{"n":"Italian B.M.T.","r":"Subway","cat":"6\" Classic Subs","p":21,"c":410,"f":17,"ca":46,"so":1400,"su":6,"ppc":0.0512},{"n":"Seafood Fettuccine Alfredo","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":53,"c":1040,"f":34,"ca":129,"so":1190,"su":3,"ppc":0.051},{"n":"Tenderloin","r":"Moxies","cat":"Steaks","p":30,"c":590,"f":51,"ca":2,"so":680,"su":0,"ppc":0.0508},{"n":"Buffalo Chicken Burger","r":"Triple O's","cat":"Burgers","p":36.3,"c":714,"f":34.1,"ca":63.7,"so":2100,"su":11.6,"ppc":0.0508},{"n":"Chuck's Burger","r":"Chuck's Roadhouse","cat":"Burgers","p":35,"c":690,"f":33.5,"ca":0,"so":928,"su":0,"ppc":0.0507},{"n":"Cheese Burger","r":"Chuck's Roadhouse","cat":"Burgers","p":41,"c":810,"f":42.5,"ca":0,"so":1118,"su":0,"ppc":0.0506},{"n":"Chicken Club Sandwich - Grilled","r":"A&W","cat":"Chicken","p":22,"c":440,"f":14,"ca":39,"so":1220,"su":8,"ppc":0.05},{"n":"Chicken Sandwich - Grilled","r":"A&W","cat":"Chicken","p":19,"c":380,"f":9,"ca":40,"so":970,"su":8,"ppc":0.05},{"n":"Cold Cut Combo Salad","r":"Subway","cat":"Salads","p":12,"c":240,"f":17,"ca":12,"so":620,"su":5,"ppc":0.05},{"n":"Tuna Salad","r":"Subway","cat":"Salads","p":14,"c":280,"f":21,"ca":10,"so":380,"su":5,"ppc":0.05},{"n":"1 Pc Fish & Chips","r":"Chuck's Roadhouse","cat":"Favourites","p":32,"c":647,"f":32,"ca":0,"so":1473,"su":0,"ppc":0.0495},{"n":"Lemon Basil Salmon","r":"Moxies","cat":"Mains","p":45,"c":910,"f":52,"ca":66,"so":1450,"su":7,"ppc":0.0495},{"n":"Chicken Zen Bowl","r":"Moxies","cat":"Pastas & Bowls","p":45,"c":910,"f":27,"ca":122,"so":3020,"su":32,"ppc":0.0495},{"n":"Bourbon Brisket","r":"Subway","cat":"6\" Steak Subs","p":34,"c":690,"f":34,"ca":63,"so":1600,"su":16,"ppc":0.0493},{"n":"Cheese Curds Large","r":"A&W","cat":"Sides","p":52,"c":1060,"f":74,"ca":44,"so":1770,"su":4,"ppc":0.0491},{"n":"Cheese Curds Small","r":"A&W","cat":"Sides","p":26,"c":530,"f":37,"ca":22,"so":890,"su":2,"ppc":0.0491},{"n":"Beyond Bacon Cheeseburger","r":"A&W","cat":"Burgers","p":25,"c":510,"f":27,"ca":46,"so":1110,"su":9,"ppc":0.049},{"n":"Steak & Cheese Wrap","r":"Subway","cat":"Wraps","p":25,"c":510,"f":22,"ca":55,"so":1420,"su":5,"ppc":0.049},{"n":"Chicken Dippers","r":"Old Spaghetti Factory","cat":"Appetizers","p":26,"c":532,"f":40,"ca":32,"so":770,"su":1,"ppc":0.0489},{"n":"Crispy Chicken Club Sandwich","r":"A&W","cat":"Chicken","p":26,"c":540,"f":25,"ca":52,"so":1510,"su":12,"ppc":0.0481},{"n":"Spaghetti with Spicy Meat Sauce","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":26,"c":540,"f":8,"ca":91,"so":920,"su":7,"ppc":0.0481},{"n":"Pizza Sub Melt Salad","r":"Subway","cat":"Salads","p":13,"c":270,"f":19,"ca":15,"so":1190,"su":8,"ppc":0.0481},{"n":"Crispy Chicken Sandwich","r":"A&W","cat":"Chicken","p":23,"c":480,"f":20,"ca":51,"so":1270,"su":12,"ppc":0.0479},{"n":"Original Bacon Cheeseburger - Single","r":"A&W","cat":"Burgers","p":23,"c":480,"f":26,"ca":41,"so":1010,"su":9,"ppc":0.0479},{"n":"Half Rack Ribs","r":"Chuck's Roadhouse","cat":"BBQ & Ribs","p":28,"c":585,"f":25.5,"ca":0,"so":1860,"su":0,"ppc":0.0479},{"n":"Chicken Fingers (5pc)","r":"Chuck's Roadhouse","cat":"Favourites","p":27,"c":564,"f":42.5,"ca":0,"so":952,"su":0,"ppc":0.0479},{"n":"Papa Burger - Double","r":"A&W","cat":"Burgers","p":31,"c":650,"f":40,"ca":44,"so":1660,"su":12,"ppc":0.0477},{"n":"Coney Dog","r":"A&W","cat":"Hot Dogs","p":31,"c":650,"f":40,"ca":44,"so":1660,"su":12,"ppc":0.0477},{"n":"Veggie Burger","r":"Chuck's Roadhouse","cat":"Burgers","p":31,"c":650,"f":26.7,"ca":0,"so":1475,"su":0,"ppc":0.0477},{"n":"Mushroom Onion Melts Burger - Single","r":"A&W","cat":"Burgers","p":19,"c":400,"f":19,"ca":38,"so":1150,"su":7,"ppc":0.0475},{"n":"BBQ Bacon Crunch Cheeseburger - Double","r":"A&W","cat":"Burgers","p":36,"c":760,"f":47,"ca":51,"so":1450,"su":14,"ppc":0.0474},{"n":"Spicy Papa Burger - Double","r":"A&W","cat":"Burgers","p":31,"c":660,"f":40,"ca":44,"so":1820,"su":12,"ppc":0.047},{"n":"Rib & Wing Combo","r":"Chuck's Roadhouse","cat":"BBQ & Ribs","p":79,"c":1680,"f":77.7,"ca":0,"so":3706,"su":0,"ppc":0.047},{"n":"Double Double Burger","r":"Triple O's","cat":"Burgers","p":57.2,"c":1217,"f":81.6,"ca":59.4,"so":1649,"su":11.4,"ppc":0.047},{"n":"Grilled Chicken Wrap","r":"Subway","cat":"Wraps","p":21,"c":450,"f":17,"ca":55,"so":1030,"su":5,"ppc":0.0467},{"n":"Baby Back Ribs - Half Rack","r":"Moxies","cat":"Mains","p":53,"c":1140,"f":61,"ca":65,"so":2400,"su":16,"ppc":0.0465},{"n":"Cheeseburger","r":"A&W","cat":"Burgers","p":19,"c":410,"f":19,"ca":42,"so":910,"su":10,"ppc":0.0463},{"n":"Original Sunny Start - Sausage","r":"Triple O's","cat":"Breakfast","p":32.5,"c":713,"f":39.3,"ca":55.1,"so":1319,"su":9.6,"ppc":0.0456},{"n":"Veggie Delite","r":"Subway","cat":"6\" Classic Subs","p":10,"c":220,"f":3,"ca":40,"so":360,"su":6,"ppc":0.0455},{"n":"Butter Chicken Box","r":"Noodlebox","cat":"Boxes","p":44,"c":980,"f":46,"ca":46,"so":null,"su":null,"ppc":0.0449},{"n":"Crispy Chicken Club","r":"Triple O's","cat":"Burgers","p":31.6,"c":710,"f":32,"ca":65.1,"so":2090,"su":9.6,"ppc":0.0445},{"n":"Hamburger","r":"A&W","cat":"Burgers","p":16,"c":360,"f":14,"ca":41,"so":680,"su":9,"ppc":0.0444},{"n":"BBQ Char Siu Pork","r":"Noodlebox","cat":"Protein Add-on","p":4,"c":90,"f":1,"ca":16,"so":null,"su":null,"ppc":0.0444},{"n":"Tuna (includes Mayonnaise)","r":"Subway","cat":"6\" Classic Subs","p":20,"c":450,"f":22,"ca":42,"so":690,"su":5,"ppc":0.0444},{"n":"Beyond Burger","r":"A&W","cat":"Burgers","p":22,"c":500,"f":25,"ca":51,"so":990,"su":13,"ppc":0.044},{"n":"Mozza Triangles","r":"Old Spaghetti Factory","cat":"Appetizers","p":21,"c":477,"f":29,"ca":32,"so":910,"su":3,"ppc":0.044},{"n":"Tuna Sushi Stack","r":"Moxies","cat":"Appetizers","p":14,"c":320,"f":12,"ca":44,"so":3,"su":44,"ppc":0.0437},{"n":"Chicken Tenders","r":"Moxies","cat":"Handhelds","p":35,"c":800,"f":50,"ca":48,"so":680,"su":0,"ppc":0.0437},{"n":"BT's Crispy Chicken Sandwich","r":"Moxies","cat":"Handhelds","p":31,"c":710,"f":31,"ca":73,"so":1420,"su":7,"ppc":0.0437},{"n":"Smashed Avocado & Turkey","r":"Subway","cat":"6\" Deli Subs","p":24,"c":550,"f":28,"ca":50,"so":1240,"su":7,"ppc":0.0436},{"n":"Coconut Prawns (2)","r":"Noodlebox","cat":"Extras","p":10,"c":230,"f":3.5,"ca":39,"so":null,"su":null,"ppc":0.0435},{"n":"Tempura Chicken Bites (5)","r":"Noodlebox","cat":"Extras","p":10,"c":230,"f":3.5,"ca":39,"so":null,"su":null,"ppc":0.0435},{"n":"Cranberry Turkey","r":"Jugo Juice","cat":"Grilled Cheese","p":19,"c":440,"f":15,"ca":50,"so":null,"su":null,"ppc":0.0432},{"n":"Chicken Parmigiana","r":"Chuck's Roadhouse","cat":"Favourites","p":34,"c":791,"f":33,"ca":0,"so":1527,"su":0,"ppc":0.043},{"n":"Crispy Shanghai Chicken Box","r":"Noodlebox","cat":"Boxes","p":27,"c":630,"f":46,"ca":34,"so":null,"su":null,"ppc":0.0429},{"n":"Chicken Alfredo and Bacon Ravioli","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":54,"c":1260,"f":83,"ca":67,"so":1530,"su":6,"ppc":0.0429},{"n":"Sweet Carolina Burger","r":"Chuck's Roadhouse","cat":"Burgers","p":44,"c":1030,"f":62,"ca":0,"so":1733,"su":0,"ppc":0.0427},{"n":"Cold Cut Combo","r":"Subway","cat":"6\" Classic Subs","p":17,"c":400,"f":18,"ca":43,"so":930,"su":6,"ppc":0.0425},{"n":"Bacon Cheddar Burger","r":"Triple O's","cat":"Burgers","p":39.4,"c":933,"f":60.7,"ca":54.9,"so":1138,"su":11.3,"ppc":0.0422},{"n":"Pizza Sub","r":"Subway","cat":"6\" Classic Subs","p":18,"c":430,"f":20,"ca":44,"so":1500,"su":6,"ppc":0.0419},{"n":"Smokehouse Burger","r":"Chuck's Roadhouse","cat":"Burgers","p":42,"c":1012,"f":46,"ca":0,"so":1696,"su":0,"ppc":0.0415},{"n":"Tuna Avocado Wrap","r":"Jugo Juice","cat":"Wraps","p":12,"c":290,"f":13,"ca":31,"so":null,"su":null,"ppc":0.0414},{"n":"Veggie Patty","r":"Subway","cat":"6\" Classic Subs","p":16,"c":390,"f":12,"ca":57,"so":680,"su":8,"ppc":0.041},{"n":"Breakfast Club - Sausage","r":"Triple O's","cat":"Breakfast","p":34.3,"c":843,"f":45,"ca":72.2,"so":1633,"su":9.6,"ppc":0.0407},{"n":"Honey Mustard Ham Snackwich","r":"Subway","cat":"Snackwiches","p":13,"c":320,"f":13,"ca":42,"so":970,"su":4,"ppc":0.0406},{"n":"Papa Burger - Single","r":"A&W","cat":"Burgers","p":19,"c":470,"f":24,"ca":43,"so":1400,"su":11,"ppc":0.0404},{"n":"Spicy Papa Burger - Single","r":"A&W","cat":"Burgers","p":19,"c":470,"f":24,"ca":43,"so":1400,"su":11,"ppc":0.0404},{"n":"Pork Tenderloin Sandwich","r":"A&W","cat":"Sandwiches","p":19,"c":470,"f":13,"ca":63,"so":1070,"su":8,"ppc":0.0404},{"n":"Thai Chicken Salad","r":"Moxies","cat":"Soup & Salads","p":40,"c":990,"f":54,"ca":93,"so":1420,"su":11,"ppc":0.0404},{"n":"BBQ Bacon Crunch Cheeseburger - Single","r":"A&W","cat":"Burgers","p":22,"c":550,"f":30,"ca":50,"so":1050,"su":13,"ppc":0.04},{"n":"Beyond Meat Burger","r":"Moxies","cat":"Handhelds","p":32,"c":800,"f":33,"ca":89,"so":3460,"su":29,"ppc":0.04},{"n":"Pot-Pourri Spaghetti","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":26,"c":650,"f":21,"ca":89,"so":1680,"su":7,"ppc":0.04},{"n":"Turkey Ranch Snackwich","r":"Subway","cat":"Snackwiches","p":14,"c":350,"f":15,"ca":40,"so":980,"su":2,"ppc":0.04},{"n":"Three Cheese Snackwich","r":"Subway","cat":"Snackwiches","p":14,"c":350,"f":16,"ca":37,"so":780,"su":1,"ppc":0.04},{"n":"Monty Mushroom","r":"Triple O's","cat":"Burgers","p":37.2,"c":943,"f":62.4,"ca":57.3,"so":812,"su":12.9,"ppc":0.0394},{"n":"Original Sunny Start - Bacon","r":"Triple O's","cat":"Breakfast","p":24.1,"c":611,"f":32,"ca":54.4,"so":1270,"su":9.6,"ppc":0.0394},{"n":"Original Cheeseburger","r":"Triple O's","cat":"Burgers","p":33.8,"c":860,"f":54.1,"ca":56.9,"so":1169,"su":11.3,"ppc":0.0393},{"n":"3 Piece Fish & Chips","r":"Triple O's","cat":"Classics & Sides","p":24.5,"c":629,"f":30,"ca":58.5,"so":884,"su":1.7,"ppc":0.039},{"n":"Loaded Cheeseburger","r":"Moxies","cat":"Handhelds","p":45,"c":1160,"f":77,"ca":67,"so":2570,"su":13,"ppc":0.0388},{"n":"Chicken Melt","r":"Jugo Juice","cat":"Grilled Cheese","p":15,"c":390,"f":12,"ca":50,"so":null,"su":null,"ppc":0.0385},{"n":"Spicy Ultimate Crunch","r":"Triple O's","cat":"Burgers","p":27.1,"c":703,"f":37.6,"ca":63,"so":1257,"su":11.1,"ppc":0.0385},{"n":"Poutine","r":"Triple O's","cat":"Classics & Sides","p":18.7,"c":490,"f":29.9,"ca":35.9,"so":987,"su":1.7,"ppc":0.0382},{"n":"Honey Mustard Crunch","r":"Triple O's","cat":"Burgers","p":28,"c":734,"f":39,"ca":66,"so":1336,"su":13,"ppc":0.0381},{"n":"Penne with Chicken","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":35,"c":920,"f":54,"ca":74,"so":870,"su":4,"ppc":0.038},{"n":"Smokehouse Supreme","r":"Triple O's","cat":"Burgers","p":39.5,"c":1043,"f":61.9,"ca":60.4,"so":1275,"su":15.6,"ppc":0.0379},{"n":"Original Burger","r":"Triple O's","cat":"Burgers","p":29.7,"c":789,"f":49.2,"ca":54.6,"so":808,"su":11.3,"ppc":0.0376},{"n":"Corn Dog Nuggets - 10 Pc","r":"A&W","cat":"Sides","p":18,"c":480,"f":26,"ca":45,"so":1010,"su":4,"ppc":0.0375},{"n":"Shrimp - 16 Pc","r":"A&W","cat":"Seafood","p":18,"c":480,"f":26,"ca":45,"so":1010,"su":1,"ppc":0.0375},{"n":"Black Bean Tacos","r":"Moxies","cat":"Handhelds","p":9,"c":240,"f":12,"ca":27,"so":680,"su":3,"ppc":0.0375},{"n":"Spaghetti with Marinara","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":18,"c":480,"f":4.5,"ca":94,"so":1110,"su":9,"ppc":0.0375},{"n":"Kid's Burger","r":"Triple O's","cat":"Burgers","p":29.1,"c":778,"f":49.1,"ca":52.2,"so":803,"su":9.7,"ppc":0.0374},{"n":"Big Veggie","r":"Subway","cat":"6\" Veggie Subs","p":20,"c":540,"f":25,"ca":60,"so":1080,"su":7,"ppc":0.037},{"n":"Chicken Alfredo","r":"Moxies","cat":"Pastas & Bowls","p":48,"c":1310,"f":81,"ca":93,"so":1780,"su":5,"ppc":0.0366},{"n":"Hot Dog Regular","r":"A&W","cat":"Hot Dogs","p":12,"c":330,"f":19,"ca":31,"so":770,"su":6,"ppc":0.0364},{"n":"Calamari Fritti","r":"Old Spaghetti Factory","cat":"Appetizers","p":19,"c":524,"f":36,"ca":31,"so":1130,"su":3,"ppc":0.0363},{"n":"Crispy Fish Burger","r":"Triple O's","cat":"Burgers","p":24.7,"c":684,"f":31.6,"ca":71.1,"so":1162,"su":7.9,"ppc":0.0361},{"n":"Avocado & Bacon Cobb Salad","r":"Moxies","cat":"Soup & Salads","p":32,"c":890,"f":62,"ca":53,"so":2720,"su":16,"ppc":0.036},{"n":"Breakfast Burger","r":"Triple O's","cat":"Breakfast","p":39,"c":1090,"f":81,"ca":52,"so":1340,"su":17,"ppc":0.0358},{"n":"Beef Vindaloo","r":"Moxies","cat":"Pastas & Bowls","p":31,"c":870,"f":63,"ca":46,"so":900,"su":23,"ppc":0.0356},{"n":"2 Pc Pub Cod Sandwich","r":"A&W","cat":"Seafood","p":33,"c":940,"f":51,"ca":85,"so":1810,"su":9,"ppc":0.0351},{"n":"BLT Snackwich","r":"Subway","cat":"Snackwiches","p":14,"c":400,"f":22,"ca":38,"so":800,"su":1,"ppc":0.035},{"n":"Fettuccini Alfredo","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":37,"c":1060,"f":43,"ca":129,"so":780,"su":3,"ppc":0.0349},{"n":"Kid's Grilled Cheese","r":"Triple O's","cat":"Classics & Sides","p":18.1,"c":520,"f":35,"ca":44,"so":840,"su":32,"ppc":0.0348},{"n":"Spaghetti with Mizithra","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":34,"c":980,"f":50,"ca":81,"so":2990,"su":4,"ppc":0.0347},{"n":"Cashew Chicken Lettuce Wraps","r":"Moxies","cat":"Appetizers","p":10,"c":290,"f":15,"ca":29,"so":12,"su":29,"ppc":0.0345},{"n":"Cashew Tofu Lettuce Wraps","r":"Moxies","cat":"Appetizers","p":10,"c":290,"f":17,"ca":28,"so":7,"su":28,"ppc":0.0345},{"n":"Peanut Butter & Chocolate","r":"Jugo Juice","cat":"Smoothies","p":12,"c":350,"f":19,"ca":39,"so":null,"su":null,"ppc":0.0343},{"n":"Breakfast Club - Bacon","r":"Triple O's","cat":"Breakfast","p":25.1,"c":731,"f":37,"ca":71.4,"so":1570,"su":9.6,"ppc":0.0343},{"n":"Ginger Beef Box","r":"Noodlebox","cat":"Boxes","p":19,"c":560,"f":35,"ca":47,"so":null,"su":null,"ppc":0.0339},{"n":"Linguine with Clams","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":27,"c":800,"f":38,"ca":88,"so":1920,"su":1,"ppc":0.0338},{"n":"Falafel Wrap","r":"Jugo Juice","cat":"Wraps","p":14,"c":420,"f":19,"ca":53,"so":null,"su":null,"ppc":0.0333},{"n":"Vegetarian Power Bowl","r":"Moxies","cat":"Pastas & Bowls","p":18,"c":540,"f":31,"ca":43,"so":1380,"su":19,"ppc":0.0333},{"n":"Drunken Noodle Box","r":"Noodlebox","cat":"Boxes","p":16,"c":498,"f":27,"ca":82,"so":null,"su":null,"ppc":0.0321},{"n":"Bacon Cheese Dog","r":"A&W","cat":"Hot Dogs","p":20,"c":640,"f":36,"ca":55,"so":1660,"su":13,"ppc":0.0312},{"n":"Coney Cheese Dog","r":"A&W","cat":"Hot Dogs","p":20,"c":640,"f":36,"ca":55,"so":1660,"su":13,"ppc":0.0312},{"n":"Super Greens Salad","r":"Moxies","cat":"Soup & Salads","p":26,"c":840,"f":66,"ca":44,"so":860,"su":6,"ppc":0.031},{"n":"Crispy Chicken Club","r":"Old Spaghetti Factory","cat":"Lunch","p":37,"c":1194,"f":71,"ca":89,"so":2670,"su":14,"ppc":0.031},{"n":"Crunchy Veggie Wrap","r":"Jugo Juice","cat":"Wraps","p":8,"c":260,"f":8,"ca":41,"so":null,"su":null,"ppc":0.0308},{"n":"Vegetable Spring Roll","r":"Noodlebox","cat":"Extras","p":4,"c":130,"f":5,"ca":16,"so":null,"su":null,"ppc":0.0308},{"n":"Bam Bam Shrimp","r":"Old Spaghetti Factory","cat":"Appetizers","p":22,"c":720,"f":48,"ca":54,"so":1440,"su":5,"ppc":0.0306},{"n":"Mushroom Veggie Burger","r":"Triple O's","cat":"Burgers","p":20,"c":660,"f":33,"ca":78,"so":1270,"su":19,"ppc":0.0303},{"n":"Impossible Burger","r":"Triple O's","cat":"Burgers","p":20,"c":660,"f":49,"ca":78,"so":1282,"su":19,"ppc":0.0303},{"n":"Pesto Linguine","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":29,"c":960,"f":53,"ca":88,"so":1280,"su":5,"ppc":0.0302},{"n":"Chicken Madeira Rigatoni","r":"Moxies","cat":"Pastas & Bowls","p":43,"c":1460,"f":103,"ca":85,"so":3680,"su":8,"ppc":0.0295},{"n":"Kung Pao Box","r":"Noodlebox","cat":"Boxes","p":13,"c":440,"f":29,"ca":40,"so":null,"su":null,"ppc":0.0295},{"n":"Spaghetti with Mushroom Alfredo","r":"Old Spaghetti Factory","cat":"Spaghetti Classics","p":27,"c":920,"f":47,"ca":90,"so":1170,"su":7,"ppc":0.0293},{"n":"Teriyaki Box","r":"Noodlebox","cat":"Boxes","p":9,"c":310,"f":19,"ca":34,"so":null,"su":null,"ppc":0.029},{"n":"Spicy Peanut Box","r":"Noodlebox","cat":"Boxes","p":33,"c":1150,"f":101,"ca":45,"so":null,"su":null,"ppc":0.0287},{"n":"Kids Mac & Cheese Box","r":"Noodlebox","cat":"Boxes","p":10,"c":360,"f":32,"ca":10,"so":null,"su":null,"ppc":0.0278},{"n":"Peaches n Raspberry Overnight Oats","r":"Jugo Juice","cat":"Snacks","p":11,"c":410,"f":7,"ca":76,"so":null,"su":null,"ppc":0.0268},{"n":"Egg BLT Ciabatta","r":"Triple O's","cat":"Breakfast","p":18,"c":680,"f":51,"ca":35,"so":1000,"su":4,"ppc":0.0265},{"n":"Ancient Grains","r":"Moxies","cat":"Sides","p":10,"c":380,"f":15,"ca":52,"so":400,"su":1,"ppc":0.0263},{"n":"Corn Dog Nuggets - 5 Pc","r":"A&W","cat":"Sides","p":7,"c":270,"f":13,"ca":41,"so":490,"su":4,"ppc":0.0259},{"n":"Caesar Salad","r":"Moxies","cat":"Soup & Salads","p":14,"c":550,"f":46,"ca":21,"so":1350,"su":3,"ppc":0.0255},{"n":"Strawberry Pecan Salad","r":"Chuck's Roadhouse","cat":"Salads","p":6,"c":245,"f":20,"ca":0,"so":332,"su":0,"ppc":0.0245},{"n":"Tortellini Pomodoro","r":"Old Spaghetti Factory","cat":"Signature Pastas","p":25,"c":1020,"f":53,"ca":116,"so":1380,"su":10,"ppc":0.0245},{"n":"Yogurt Parfait","r":"Jugo Juice","cat":"Snacks","p":9,"c":370,"f":15,"ca":52,"so":null,"su":null,"ppc":0.0243},{"n":"Three Cheese","r":"Jugo Juice","cat":"Grilled Cheese","p":16,"c":660,"f":40,"ca":47,"so":null,"su":null,"ppc":0.0242},{"n":"Onion Rings - Regular","r":"A&W","cat":"Sides","p":6,"c":250,"f":4.5,"ca":45,"so":1200,"su":6,"ppc":0.024},{"n":"Garlic Cheese Toast","r":"Old Spaghetti Factory","cat":"Appetizers","p":24,"c":1000,"f":73,"ca":54,"so":2000,"su":1,"ppc":0.024},{"n":"Onion Rings - Large","r":"A&W","cat":"Sides","p":9,"c":380,"f":7,"ca":67,"so":1810,"su":9,"ppc":0.0237},{"n":"Chili Fries - Large","r":"A&W","cat":"Sides","p":12,"c":510,"f":20,"ca":68,"so":1270,"su":3,"ppc":0.0235},{"n":"Veggie Delite Wrap","r":"Subway","cat":"Wraps","p":9,"c":390,"f":15,"ca":54,"so":710,"su":4,"ppc":0.0231},{"n":"Lavender Lover","r":"Jugo Juice","cat":"Smoothies","p":7,"c":310,"f":5,"ca":68,"so":null,"su":null,"ppc":0.0226},{"n":"Black Bean Box","r":"Noodlebox","cat":"Boxes","p":7,"c":310,"f":19,"ca":34,"so":null,"su":null,"ppc":0.0226},{"n":"Pad Thai Box","r":"Noodlebox","cat":"Boxes","p":12,"c":550,"f":27,"ca":74,"so":null,"su":null,"ppc":0.0218},{"n":"Chili Fries - Regular","r":"A&W","cat":"Sides","p":8,"c":370,"f":15,"ca":49,"so":880,"su":2,"ppc":0.0216},{"n":"Thai Chow Mein Box","r":"Noodlebox","cat":"Boxes","p":8,"c":370,"f":31,"ca":19,"so":null,"su":null,"ppc":0.0216},{"n":"Bombay Mac & Cheese Box","r":"Noodlebox","cat":"Boxes","p":15,"c":700,"f":56,"ca":42,"so":null,"su":null,"ppc":0.0214},{"n":"Raspberry Rush","r":"Jugo Juice","cat":"Smoothies","p":9,"c":430,"f":1.5,"ca":91,"so":null,"su":null,"ppc":0.0209},{"n":"Parmesan Sweet Potato Fries","r":"Old Spaghetti Factory","cat":"Appetizers","p":18,"c":890,"f":69,"ca":55,"so":900,"su":12,"ppc":0.0202},{"n":"Prawn Thai Curry Laksa","r":"Moxies","cat":"Pastas & Bowls","p":21,"c":1060,"f":49,"ca":138,"so":2710,"su":82,"ppc":0.0198},{"n":"Cambodian Jungle Curry Box","r":"Noodlebox","cat":"Boxes","p":14,"c":750,"f":64,"ca":48,"so":null,"su":null,"ppc":0.0187},{"n":"Salted Caramel Cheesecake","r":"Moxies","cat":"Desserts","p":10,"c":543,"f":40,"ca":40,"so":370,"su":35,"ppc":0.0184},{"n":"Burmese Naan","r":"Noodlebox","cat":"Extras","p":4,"c":220,"f":10,"ca":30,"so":null,"su":null,"ppc":0.0182},{"n":"Cheese Fries - Large","r":"A&W","cat":"Sides","p":12,"c":680,"f":29,"ca":90,"so":2090,"su":2,"ppc":0.0176},{"n":"Berry Banana","r":"Jugo Juice","cat":"Smoothies","p":7,"c":400,"f":2,"ca":87,"so":null,"su":null,"ppc":0.0175},{"n":"Cheese Fries - Regular","r":"A&W","cat":"Sides","p":11,"c":640,"f":26,"ca":88,"so":1870,"su":2,"ppc":0.0172},{"n":"Jasmine Rice","r":"Moxies","cat":"Sides","p":6,"c":350,"f":2.5,"ca":74,"so":370,"su":0,"ppc":0.0171},{"n":"Blue Crush","r":"Jugo Juice","cat":"Smoothies","p":7,"c":420,"f":1.5,"ca":95,"so":null,"su":null,"ppc":0.0167},{"n":"Vegan Thai Curry Laksa","r":"Moxies","cat":"Pastas & Bowls","p":18,"c":1085,"f":51,"ca":145,"so":1690,"su":81,"ppc":0.0166},{"n":"Mashed Potatoes","r":"Moxies","cat":"Sides","p":6,"c":370,"f":18,"ca":41,"so":980,"su":2,"ppc":0.0162},{"n":"Key Lime Pie","r":"Moxies","cat":"Desserts","p":10,"c":620,"f":39,"ca":62,"so":350,"su":49,"ppc":0.0161},{"n":"Cheesecake on a Stick","r":"Triple O's","cat":"Classics & Sides","p":3,"c":190,"f":11,"ca":21,"so":105,"su":10,"ppc":0.0158},{"n":"Singapore Cashew Curry Box","r":"Noodlebox","cat":"Boxes","p":10,"c":640,"f":61,"ca":25,"so":null,"su":null,"ppc":0.0156},{"n":"Cashew Chili Chicken","r":"Moxies","cat":"Appetizers","p":7,"c":460,"f":26,"ca":34,"so":22,"su":34,"ppc":0.0152},{"n":"Fries Large","r":"Triple O's","cat":"Classics & Sides","p":5,"c":334,"f":16.8,"ca":42,"so":165,"su":2.3,"ppc":0.015},{"n":"Porchetta Sandwich","r":"Old Spaghetti Factory","cat":"Lunch","p":18,"c":1220,"f":95,"ca":60,"so":1320,"su":1,"ppc":0.0148},{"n":"Fries Regular","r":"Triple O's","cat":"Classics & Sides","p":3.5,"c":239,"f":12,"ca":30,"so":119,"su":1.7,"ppc":0.0146},{"n":"Apple Pie Spring Roll","r":"Noodlebox","cat":"Extras","p":1,"c":70,"f":0.2,"ca":17,"so":null,"su":null,"ppc":0.0143},{"n":"Apple Pie Chia Pudding","r":"Jugo Juice","cat":"Snacks","p":5.8,"c":421,"f":28.6,"ca":43.7,"so":null,"su":null,"ppc":0.0138},{"n":"Mighty Kale","r":"Jugo Juice","cat":"Smoothies","p":4,"c":292,"f":0.5,"ca":68.4,"so":null,"su":null,"ppc":0.0137},{"n":"Coney Fries - Large","r":"A&W","cat":"Sides","p":9,"c":670,"f":30,"ca":88,"so":1880,"su":0,"ppc":0.0134},{"n":"Churro Sandwich","r":"Moxies","cat":"Desserts","p":6,"c":460,"f":29,"ca":44,"so":310,"su":17,"ppc":0.013},{"n":"Fries - Regular","r":"A&W","cat":"Sides","p":4,"c":310,"f":12,"ca":44,"so":1050,"su":0,"ppc":0.0129},{"n":"Potstickers","r":"Moxies","cat":"Appetizers","p":4,"c":320,"f":23,"ca":19,"so":7,"su":19,"ppc":0.0125},{"n":"Kids Chow Mein Box","r":"Noodlebox","cat":"Boxes","p":2,"c":160,"f":14,"ca":8,"so":null,"su":null,"ppc":0.0125},{"n":"Banana Spring Roll","r":"Noodlebox","cat":"Extras","p":1,"c":80,"f":1,"ca":16,"so":null,"su":null,"ppc":0.0125},{"n":"Mini Sticky Toffee Pudding","r":"Moxies","cat":"Desserts","p":7,"c":580,"f":23,"ca":89,"so":340,"su":54,"ppc":0.0121},{"n":"Tiny Tuna Tacos","r":"Moxies","cat":"Appetizers","p":2,"c":170,"f":5,"ca":20,"so":10,"su":20,"ppc":0.0118},{"n":"Onion Rings","r":"Triple O's","cat":"Classics & Sides","p":5.5,"c":467,"f":28.8,"ca":47.7,"so":437,"su":11.4,"ppc":0.0118},{"n":"Fries - Large","r":"A&W","cat":"Sides","p":5,"c":430,"f":17,"ca":61,"so":1220,"su":0,"ppc":0.0116},{"n":"Caesar Salad","r":"Chuck's Roadhouse","cat":"Salads","p":5,"c":462,"f":44,"ca":0,"so":568,"su":0,"ppc":0.0108},{"n":"Sweet Potato Fries Regular","r":"Triple O's","cat":"Classics & Sides","p":5.4,"c":519,"f":29.6,"ca":60.5,"so":523,"su":23.4,"ppc":0.0104},{"n":"Bite of Brownie","r":"Moxies","cat":"Desserts","p":7,"c":680,"f":35,"ca":87,"so":290,"su":53,"ppc":0.0103},{"n":"Roasted Tomatoes & Whipped Feta","r":"Moxies","cat":"Appetizers","p":5,"c":520,"f":33,"ca":47,"so":16,"su":47,"ppc":0.0096},{"n":"Jugo Classico","r":"Jugo Juice","cat":"Smoothies","p":2.5,"c":267,"f":0.4,"ca":66.3,"so":null,"su":null,"ppc":0.0094},{"n":"Seasonal Vegetables","r":"Moxies","cat":"Sides","p":1,"c":110,"f":7,"ca":11,"so":550,"su":5,"ppc":0.0091},{"n":"Chuck's Caesar","r":"Chuck's Roadhouse","cat":"Salads","p":8,"c":886,"f":86.5,"ca":0,"so":1060,"su":0,"ppc":0.009},{"n":"Green Glow","r":"Jugo Juice","cat":"Smoothies","p":3.3,"c":367,"f":7.9,"ca":75.8,"so":null,"su":null,"ppc":0.009},{"n":"Vanilla Matcha","r":"Jugo Juice","cat":"Smoothies","p":3,"c":370,"f":1,"ca":83,"so":null,"su":null,"ppc":0.0081},{"n":"Smashed Avocado Dip","r":"Moxies","cat":"Appetizers","p":1,"c":130,"f":5,"ca":19,"so":2,"su":19,"ppc":0.0077},{"n":"Calamari","r":"Moxies","cat":"Appetizers","p":3,"c":410,"f":26,"ca":28,"so":16,"su":28,"ppc":0.0073},{"n":"Fries","r":"Moxies","cat":"Sides","p":4,"c":620,"f":45,"ca":49,"so":2160,"su":1,"ppc":0.0065},{"n":"Sweet Potato Fries","r":"Moxies","cat":"Sides","p":3,"c":630,"f":38,"ca":68,"so":1430,"su":32,"ppc":0.0048},{"n":"Bombay Cheese Balls (2)","r":"Noodlebox","cat":"Extras","p":1,"c":232,"f":9.5,"ca":40,"so":null,"su":null,"ppc":0.0043},{"n":"Mango Magic","r":"Jugo Juice","cat":"Smoothies","p":1.1,"c":303,"f":0.5,"ca":73,"so":null,"su":null,"ppc":0.0036},{"n":"Nachos","r":"Moxies","cat":"Appetizers","p":2,"c":670,"f":40,"ca":36,"so":41,"su":36,"ppc":0.003},{"n":"Truffle Parm Fries","r":"Moxies","cat":"Appetizers","p":1,"c":420,"f":26,"ca":37,"so":10,"su":37,"ppc":0.0024}];
const R=[{"name":"A&W","desc":"American-style fast food with burgers, chicken, and root beer.","tags":["Fast Food","Burgers","Chicken","Hot Dogs"],"ic":48,"cats":["Burgers","Chicken","Hot Dogs","Sandwiches","Seafood","Sides"],"pdf":"aw_nutrition.pdf","avgP":22.9,"avgC":498.0},{"name":"Chuck's Roadhouse","desc":"Value steakhouse chain with ribs, burgers, and chicken.","tags":["Casual Dining","Steakhouse","Canadian","Value"],"ic":29,"cats":["BBQ & Ribs","Burgers","Favourites","Salads","Sandwiches","Steaks"],"pdf":"chucks_roadhouse_nutrition.pdf","avgP":47.8,"avgC":798.0},{"name":"Jugo Juice","desc":"Smoothie and juice bar with wraps, grilled cheese, and snacks.","tags":["Smoothie Bar","Juice","Wraps","Quick Service"],"ic":29,"cats":["Grilled Cheese","Protein Smoothies","Smoothies","Snacks","Wraps"],"pdf":"jugo_juice_nutrition.pdf","avgP":14.5,"avgC":387.0},{"name":"Moxies","desc":"Canadian casual dining with steaks, pastas, bowls, and handhelds.","tags":["Casual Dining","Canadian","Steaks","Burgers"],"ic":61,"cats":["Appetizers","Desserts","Handhelds","Mains","Pastas & Bowls","Sides","Soup & Salads","Steaks"],"pdf":"moxies_ca_nutrition.pdf","avgP":27.7,"avgC":649.0},{"name":"Noodlebox","desc":"Asian-inspired noodle and rice boxes with customizable proteins.","tags":["Asian","Noodles","Quick Service","Customizable"],"ic":31,"cats":["Boxes","Extras","Protein Add-on"],"pdf":"noodlebox_nutrition.pdf","avgP":14.0,"avgC":362.0},{"name":"Old Spaghetti Factory","desc":"Classic Italian-style pasta house with spaghetti, grilled items, and family dining.","tags":["Casual Dining","Italian","Pasta","Family"],"ic":36,"cats":["Appetizers","Grilled Items","Lunch","Signature Pastas","Spaghetti Classics"],"pdf":"old_spaghetti_factory_nutrition.pdf","avgP":41.5,"avgC":854.0},{"name":"Subway","desc":"Global sandwich chain with customizable subs, wraps, and salads.","tags":["Fast Food","Sandwiches","Wraps","Salads"],"ic":45,"cats":["6\" Chicken Subs","6\" Classic Subs","6\" Deli Subs","6\" Limited/Regional Subs","6\" Steak Subs","6\" Veggie Subs","Salads","Snackwiches","Wraps"],"pdf":"Subway.pdf","avgP":20.3,"avgC":381.0},{"name":"Triple O's","desc":"White Spot's quick-service burger chain with burgers, chicken, and shakes.","tags":["Fast Casual","Burgers","Chicken","Canadian"],"ic":31,"cats":["Breakfast","Burgers","Classics & Sides"],"pdf":"triple_os_nutrition.pdf","avgP":26.5,"avgC":687.0}];
const C=["#3a8f5c","#2f65cc","#a86a13","#9e4c3b","#6b5b95","#d4723c","#2a9d8f","#c44569"];
const ini=n=>n.charAt(0).toUpperCase();
const fpc=v=>(v*100).toFixed(1);
const ik=it=>it?.key||`${it.r}::${it.n}`;
const RNAMES=R.map(r=>r.name);
const GCATS=["Burgers","Subs & Sandwiches","Salads","Wraps","Chicken","Steaks","Pasta","Bowls & Mains","BBQ & Ribs","Smoothies","Breakfast","Sides","Appetizers"];
function catGroup(c){if(!c)return"Other";if(c.includes("Sub")||c.includes("Snack"))return"Subs & Sandwiches";if(c.includes("Burger"))return"Burgers";if(c.includes("Steak"))return"Steaks";if(c.includes("Salad"))return"Salads";if(c.includes("Wrap"))return"Wraps";if(c.includes("Chicken")&&!c.includes("Box"))return"Chicken";if(c.includes("Pasta")||c.includes("Spaghetti")||c.includes("Signature"))return"Pasta";if(c.includes("Bowl")||c.includes("Box")||c.includes("Main"))return"Bowls & Mains";if(c.includes("Breakfast"))return"Breakfast";if(c.includes("Smoothie"))return"Smoothies";if(c.includes("Side")||c.includes("Classic"))return"Sides";if(c.includes("Rib")||c.includes("BBQ"))return"BBQ & Ribs";if(c.includes("Appetizer")||c.includes("Extra"))return"Appetizers";return"Other";}
function sortItems(items,sm){const s=[...items];if(sm==="protein")s.sort((a,b)=>b.p-a.p);else if(sm==="lowCal")s.sort((a,b)=>a.c-b.c);else if(sm==="lowSodium")s.sort((a,b)=>(a.so??9999)-(b.so??9999));else s.sort((a,b)=>b.ppc-a.ppc);return s;}
const QUEUE={"rr":[{"id":"rr_001","owner":"Maria Fontaine","email":"maria@moxies.com","phone":"403-555-0142","rest":"Moxies","role":"Owner","web":"https://www.moxies.com","menuUrl":"https://www.moxies.com/menu","note":"We focus on casual dining with steaks, pastas, and handhelds. Full nutrition PDF available.","pdf":"moxies_ca_nutrition.pdf","hasImage":true,"samples":[{"name":"Steak Frites","cat":"Steaks","protein":44,"cal":370,"price":"24.99"},{"name":"Tuna Poke Bowl","cat":"Pastas & Bowls","protein":35,"cal":580,"price":"19.99"}],"status":"approved","at":"2025-11-20"},{"id":"rr_002","owner":"Dave Thompson","email":"dave@chucksroadhouse.ca","phone":"416-555-0238","rest":"Chuck's Roadhouse","role":"Owner","web":null,"menuUrl":null,"note":"Value steakhouse chain. All nutrition data available in official PDF.","pdf":"chucks_roadhouse_nutrition.pdf","hasImage":false,"samples":[{"name":"Top Sirloin 7oz","cat":"Steaks","protein":42,"cal":350,"price":"12.99"}],"status":"approved","at":"2025-12-10"},{"id":"rr_003","owner":"Priya Nair","email":"priya@noodlebox.ca","phone":"604-555-0391","rest":"Noodlebox","role":"Owner","web":"https://www.noodlebox.ca","menuUrl":"https://www.noodlebox.ca/menu","note":"Asian-inspired noodle and rice boxes with customizable proteins. We have a full nutrition breakdown for all core items.","pdf":"noodlebox_nutrition.pdf","hasImage":true,"samples":[{"name":"Crispy Shanghai Chicken Box","cat":"Boxes","protein":28,"cal":680,"price":"15.49"},{"name":"Thai Basil Tofu Box","cat":"Boxes","protein":18,"cal":520,"price":"14.49"}],"status":"pending","at":"2026-03-20"}],"role":[{"id":"role_001","user":"Jordan Lee","email":"jordan@example.com","rest":"Freshii","role":"Owner","note":"I own three Freshii locations in Calgary. Would like to upload our nutrition PDF and keep our data current on MacroFinder.","status":"pending","at":"2026-04-08"}],"issues":[{"id":"issue_001","user":"Sam Chen","item":"Moxies::Rib Eye","rest":"Moxies","type":"Wrong nutrition info","note":"Protein count seems too high at 100g for a 388g serving.","status":"open","at":"2026-04-05"},{"id":"issue_002","user":"Alex Rivera","item":"Subway::Turkey Breast","rest":"Subway","type":"Item discontinued","note":"This sub was removed from Calgary locations.","status":"open","at":"2026-04-09"},{"id":"issue_003","user":"Jordan Lee","item":"A&W::Chicken Wrap","rest":"A&W","type":"Wrong category","note":"Should be under Wraps not Chicken.","status":"resolved","at":"2026-03-28"}],"cr":[{"id":"cr_001","owner":"Maria Fontaine","rest":"Moxies","type":"rest_image","desc":"Update restaurant hero image \u2014 branding photo PDF attached","pdf":"moxies_branding_2026.pdf","status":"pending","at":"2026-04-09"},{"id":"cr_002","owner":"Dave Thompson","rest":"Chuck's Roadhouse","type":"rest_description","desc":"Update restaurant description \u2014 PDF with new copy attached","pdf":"chucks_desc_update.pdf","status":"approved","at":"2026-03-30"}]};
const defFilters={sort:"",minP:"",maxCal:"",maxSod:"",maxSug:"",rest:"",cats:[],coreOnly:false};
const USERS=[{"id":"user_001","name":"Jordan Lee","email":"jordan@example.com","pass":"demo123","role":"user","si":["A&W::5 Pc Hand-Breaded Chicken Tenders","A&W::3 Pc Hand-Breaded Chicken Tenders","Old Spaghetti Factory::New York Steak","Chuck's Roadhouse::Bacon Wrapped Filet Mignon 7oz","Moxies::Steak Frites","Moxies::Sirloin"],"sr":["Chuck's Roadhouse","Moxies"],"diet":["high-protein","low-carb"]},{"id":"user_002","name":"Sam Chen","email":"sam@example.com","pass":"demo123","role":"user","si":["Noodlebox::Chicken Breast","Moxies::Sirloin","A&W::Grilled Tenders - 3"],"sr":["A&W"],"diet":[]},{"id":"user_003","name":"Alex Rivera","email":"alex@example.com","pass":"demo123","role":"user","si":["Noodlebox::Chicken Breast","Noodlebox::Prawns","Noodlebox::Beef Sirloin","A&W::3 Pc Hand-Breaded Chicken Tenders"],"sr":["Subway","Jugo Juice"],"diet":["low-calorie"]},{"id":"owner_001","name":"Maria Fontaine","email":"maria@moxies.com","pass":"owner123","role":"restaurant_owner","phone":"403-555-0142","rests":[{"name":"Moxies","verified":true,"status":"active","type":"Casual Dining","tags":["Canadian","Steaks","Pasta"],"pdf":"moxies_ca_nutrition.pdf","pdfStatus":"approved","ic":61,"pt":12,"ct":2}],"todos":[{"id":"task_item_001_moxies","type":"add_image","item":"Tuna Sushi Stack","cat":"Appetizers","status":"pending","desc":"Upload a photo for Tuna Sushi Stack"},{"id":"task_item_002_moxies","type":"add_image","item":"Truffle Parm Fries","cat":"Appetizers","status":"pending","desc":"Upload a photo for Truffle Parm Fries"},{"id":"task_item_003_moxies","type":"add_image","item":"Potstickers","cat":"Appetizers","status":"pending","desc":"Upload a photo for Potstickers"},{"id":"task_item_004_moxies","type":"add_image","item":"Tiny Tuna Tacos","cat":"Appetizers","status":"pending","desc":"Upload a photo for Tiny Tuna Tacos"},{"id":"task_item_005_moxies","type":"add_image","item":"Calamari","cat":"Appetizers","status":"pending","desc":"Upload a photo for Calamari"},{"id":"task_item_006_moxies","type":"add_image","item":"Roasted Tomatoes & Whipped Feta","cat":"Appetizers","status":"pending","desc":"Upload a photo for Roasted Tomatoes & Whipped Feta"},{"id":"task_item_007_moxies","type":"add_image","item":"Dry Ribs","cat":"Appetizers","status":"pending","desc":"Upload a photo for Dry Ribs"},{"id":"task_item_008_moxies","type":"add_image","item":"Smashed Avocado Dip","cat":"Appetizers","status":"pending","desc":"Upload a photo for Smashed Avocado Dip"},{"id":"task_desc_item_009_moxies","type":"add_description","item":"1lb Chicken Wings","cat":"Appetizers","status":"pending","desc":"Write a short description for 1lb Chicken Wings"},{"id":"task_desc_item_010_moxies","type":"add_description","item":"Celery & Dip","cat":"Appetizers","status":"pending","desc":"Write a short description for Celery & Dip"},{"id":"task_desc_item_011_moxies","type":"add_description","item":"Cashew Chicken Lettuce Wraps","cat":"Appetizers","status":"pending","desc":"Write a short description for Cashew Chicken Lettuce Wraps"},{"id":"task_desc_item_012_moxies","type":"add_description","item":"Cashew Tofu Lettuce Wraps","cat":"Appetizers","status":"pending","desc":"Write a short description for Cashew Tofu Lettuce Wraps"},{"id":"task_pdf_upload","type":"upload_pdf","item":null,"cat":null,"status":"completed","desc":"Upload nutrition PDF for Moxies"},{"id":"task_verify_menu","type":"verify_categories","item":null,"cat":null,"status":"completed","desc":"Verify menu categories match your restaurant"}],"perms":["upload_pdf","edit_items","view_reports"],"si":[],"sr":["Moxies"]},{"id":"owner_002","name":"Dave Thompson","email":"dave@chucksroadhouse.ca","pass":"owner123","role":"restaurant_owner","phone":"416-555-0238","rests":[{"name":"Chuck's Roadhouse","verified":true,"status":"active","type":"Casual Dining","tags":["Steakhouse","Canadian","Value"],"pdf":"chucks_roadhouse_nutrition.pdf","pdfStatus":"approved","ic":29,"pt":5,"ct":1}],"todos":[{"id":"task_item_001_chucks-roadhouse","type":"add_image","item":"Top Sirloin 7oz","cat":"Steaks","status":"pending","desc":"Upload a photo for Top Sirloin 7oz"},{"id":"task_item_002_chucks-roadhouse","type":"add_image","item":"New York 10oz","cat":"Steaks","status":"pending","desc":"Upload a photo for New York 10oz"},{"id":"task_item_003_chucks-roadhouse","type":"add_image","item":"Rib-Eye 12oz","cat":"Steaks","status":"pending","desc":"Upload a photo for Rib-Eye 12oz"},{"id":"task_item_004_chucks-roadhouse","type":"add_image","item":"Porterhouse 20oz","cat":"Steaks","status":"pending","desc":"Upload a photo for Porterhouse 20oz"},{"id":"task_item_005_chucks-roadhouse","type":"add_image","item":"T-Bone 14oz","cat":"Steaks","status":"pending","desc":"Upload a photo for T-Bone 14oz"},{"id":"task_pdf_chucks","type":"upload_pdf","item":null,"cat":null,"status":"completed","desc":"Upload nutrition PDF for Chuck's Roadhouse"}],"perms":["upload_pdf","edit_items","view_reports"],"si":[],"sr":["Chuck's Roadhouse"]},{"id":"owner_003","name":"Priya Nair","email":"priya@noodlebox.ca","pass":"owner123","role":"restaurant_owner","phone":null,"rests":[{"name":"Noodlebox","verified":false,"status":"pending","type":"Quick Service","tags":["Asian","Noodles"],"pdf":null,"pdfStatus":"not_submitted","ic":0,"pt":2,"ct":0}],"todos":[{"id":"task_submit_pdf_nb","type":"upload_pdf","item":null,"cat":null,"status":"pending","desc":"Upload nutrition PDF for Noodlebox"},{"id":"task_franchise_details","type":"franchise_details","item":null,"cat":null,"status":"pending","desc":"Complete franchise details for admin review"}],"perms":["view_reports"],"si":[],"sr":["Noodlebox"]},{"id":"admin_001","name":"Taylor Kim","email":"taylor@macrofinder.ca","pass":"admin123","role":"admin","si":[],"sr":[]},{"id":"admin_002","name":"Morgan Reeves","email":"morgan@macrofinder.ca","pass":"admin123","role":"admin","si":[],"sr":[]}];

const CUSTOM_USERS_STORAGE_KEY="macrofinder.demo.customUsers";
const OWNER_DEFAULT_PERMS=["upload_pdf","edit_items","view_reports"];
const OWNER_PENDING_PERMS=["view_reports"];

function replaceArrayContents(target,next){target.splice(0,target.length,...next)}
function averageNumbers(values){const nums=values.filter(v=>typeof v==="number"&&!Number.isNaN(v));return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0}
function roundValue(value,precision=1){const factor=10**precision;return Math.round((value||0)*factor)/factor}
function toDateOnly(value){return typeof value==="string"&&value?value.slice(0,10):new Date().toISOString().slice(0,10)}
function toIsoDate(value,fallback){if(typeof value==="string"&&value){return value.length===10?`${value}T00:00:00.000Z`:value}return fallback||new Date().toISOString()}
function ppcFor(protein,calories){if(!calories||calories<=0)return 0;return roundValue(protein/calories,4)}
function matchStatus(status,...allowed){return allowed.includes(status)}
function buildOwnerProfileId(userId,restaurantName){const restaurantSlug=resolveRestaurantId(restaurantName)||slugifyIdentifier(restaurantName||"")||slugifyIdentifier(userId||"owner");return `owner-profile-${restaurantSlug}-demo`}
function loadStoredCustomUsers(){try{const raw=window.localStorage.getItem(CUSTOM_USERS_STORAGE_KEY);if(!raw)return[];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return[];return parsed.filter(u=>u&&typeof u==="object"&&typeof u.email==="string"&&typeof u.name==="string")}catch{return[]}}
function saveStoredCustomUsers(users){window.localStorage.setItem(CUSTOM_USERS_STORAGE_KEY,JSON.stringify(users))}
function toUiAccessStatus(status){if(status==="approved")return"approved";if(status==="denied")return"denied";if(status==="needs_changes")return"needs_changes";return"pending"}
function fromUiAccessStatus(status){if(status==="approved")return"approved";if(status==="denied")return"denied";if(status==="needs_changes")return"needs_changes";return"pending_review"}
function toUiRestaurantRequestStatus(status){if(status==="approved")return"approved";if(status==="rejected")return"denied";if(status==="needs_changes")return"needs_changes";return"pending"}
function fromUiRestaurantRequestStatus(status){if(status==="approved")return"approved";if(status==="denied")return"rejected";if(status==="needs_changes")return"needs_changes";return"pending_admin_review"}
function toUiChangeStatus(status){if(status==="approved")return"approved";if(status==="denied")return"denied";if(status==="needs_changes")return"needs_changes";return"pending"}
function fromUiChangeStatus(status){if(status==="approved")return"approved";if(status==="denied")return"denied";if(status==="needs_changes")return"needs_changes";return"pending_admin_review"}
function encodeChangeNote(type,itemName,note){return `UI:${type||"rest_description"}:${itemName||""}\n${note||""}`}
function decodeChangeNote(request){
    const raw=request?.owner_note||"";
    if(typeof raw==="string"&&raw.startsWith("UI:")){
        const [head,...lines]=raw.split("\n");
        const [,type="",itemName=""]=head.split(":");
        return{type:type||"rest_description",itemName,note:lines.join("\n")||request?.requested_changes?.description||""}
    }
    if(request?.files?.restaurant_image)return{type:"rest_image",itemName:"",note:request?.requested_changes?.description||request?.owner_note||""}
    if(request?.requested_changes?.description)return{type:"rest_description",itemName:"",note:request.requested_changes.description}
    return{type:"rest_url",itemName:"",note:request?.owner_note||""}
}
function buildLegacyItems(items){
    return items.map(item=>{
        const protein=Number(item?.macros?.protein_g??0);
        const calories=Number(item?.macros?.calories??0);
        return{
            n:item.item_name,
            r:item.restaurant_name,
            cat:item.category||"Other",
            p:protein,
            c:calories,
            f:item?.macros?.fat_g??null,
            ca:item?.macros?.carbs_g??null,
            so:item?.macros?.sodium_mg??null,
            su:item?.macros?.sugar_g??null,
            ppc:ppcFor(protein,calories),
            price:item.price_cad??null,
            key:item.unique_key,
            restId:item.restaurant_id,
            pdf:item?.data_quality?.source_pdf??null,
            summary:item.summary||"",
            portion:item.portion||"",
            sourceUrl:item.source_url||"",
            imageUrl:item.image_url||"",
        }
    })
}
function buildLegacyRestaurants(restaurants,items){
    const itemsByRestaurant=new Map();
    items.forEach(item=>{const bucket=itemsByRestaurant.get(item.r)||[];bucket.push(item);itemsByRestaurant.set(item.r,bucket)});
    return restaurants.map(restaurant=>{
        const restItems=itemsByRestaurant.get(restaurant.restaurant_name)||[];
        return{
            id:restaurant.restaurant_id,
            name:restaurant.restaurant_name,
            desc:restaurant.description||`Franchise-level record for ${restaurant.restaurant_name}.`,
            tags:[...(restaurant.tags||[])],
            ic:restaurant.item_count||restItems.length,
            cats:[...(restaurant.categories||[])],
            pdf:restItems.find(item=>item.pdf)?.pdf||null,
            avgP:roundValue(restaurant.avg_protein_g||averageNumbers(restItems.map(item=>item.p)),1),
            avgC:roundValue(averageNumbers(restItems.map(item=>item.c)),1),
            avgPrice:roundValue(restaurant.avg_price_cad||averageNumbers(restItems.map(item=>item.price).filter(Boolean)),2),
        }
    })
}
function buildLegacyQueue({accessRequests,restaurantRequests,changeRequests,reportedIssues,loginProfiles}){
    const profileByUserId=new Map(loginProfiles.map(profile=>[profile.profile.user_id,profile]));
    return{
        rr:restaurantRequests.map(request=>({
            id:request.request_id,
            owner:request.contact.owner_full_name||profileByUserId.get(request.requester_user_id)?.profile?.full_name||"Restaurant owner",
            email:request.contact.restaurant_email||profileByUserId.get(request.requester_user_id)?.email||"",
            phone:request.contact.owner_phone||"",
            rest:request.restaurant.restaurant_name,
            role:request.contact.owner_role||"Owner",
            web:request.restaurant.website_url||null,
            menuUrl:request.restaurant.menu_url||null,
            note:request.restaurant.owner_note||"",
            pdf:request.files.nutrition_pdf?.file_name||null,
            hasImage:Boolean(request.files.restaurant_image),
            samples:(request.sample_items||[]).map(sample=>({
                name:sample.item_name,
                cat:sample.category,
                protein:sample.protein_g,
                cal:sample.calories,
                price:sample.price_cad!=null?String(sample.price_cad):"",
            })),
            status:toUiRestaurantRequestStatus(request.review.status),
            at:toDateOnly(request.submitted_at),
            ownerProfileId:request.owner_profile_id,
            requesterUserId:request.requester_user_id,
            reviewedAt:request.review.reviewed_at,
            reviewedBy:request.review.reviewed_by_admin_id,
            adminNote:request.review.admin_notes,
            source:request,
        })),
        role:accessRequests.map(request=>({
            id:request.requestId||`role_${request.requesterUserId}_${request.submittedAt}`,
            user:profileByUserId.get(request.requesterUserId)?.profile?.full_name||request.businessEmail||"User",
            email:request.businessEmail,
            accountEmail:profileByUserId.get(request.requesterUserId)?.email||"",
            rest:request.restaurantName,
            role:request.role||"Owner",
            note:request.note||"",
            status:toUiAccessStatus(request.status),
            at:toDateOnly(request.submittedAt),
            requesterUserId:request.requesterUserId,
            reviewedAt:request.reviewedAt,
            reviewedBy:request.reviewedByAdminId,
            adminNote:request.adminNotes,
            source:request,
        })),
        issues:reportedIssues.map(issue=>({
            id:issue.issue_id,
            user:profileByUserId.get(issue.reporter_user_id)?.profile?.full_name||"Guest",
            item:issue.item_key||`${issue.restaurant_name}::${issue.item_name||"Unknown item"}`,
            rest:issue.restaurant_name,
            type:issue.issue_type,
            note:issue.note||issue.issue_type,
            status:issue.status,
            at:toDateOnly(issue.submitted_at||issue.created_at),
            itemKey:issue.item_key,
            reporterUserId:issue.reporter_user_id,
            reviewedAt:issue.resolved_at,
            reviewedBy:issue.resolved_by_admin_id,
            adminNote:issue.resolution_note,
            source:issue,
        })),
        cr:changeRequests.map(request=>{
            const meta=decodeChangeNote(request);
            return{
                id:request.request_id,
                owner:profileByUserId.get(request.requester_user_id)?.profile?.full_name||"Restaurant owner",
                rest:request.restaurant_name,
                type:meta.type,
                itemName:meta.itemName,
                note:meta.note,
                desc:meta.itemName?`${meta.note} [${meta.itemName}]`:meta.note,
                pdf:request.files.restaurant_image?.file_name||null,
                status:toUiChangeStatus(request.review.status),
                at:toDateOnly(request.submitted_at),
                requesterUserId:request.requester_user_id,
                ownerProfileId:request.owner_profile_id,
                reviewedAt:request.review.reviewed_at,
                reviewedBy:request.review.reviewed_by_admin_id,
                adminNote:request.review.admin_notes,
                source:request,
            }
        }),
    }
}
function buildLegacyUsers({loginProfiles,ownerProfiles,adminProfiles,roleRequests,ownerTasks,restaurants,items,session,customUsers}){
    const restaurantsById=new Map(restaurants.map(restaurant=>[restaurant.id,restaurant]));
    const restaurantsByResolvedId=new Map(restaurants.map(restaurant=>[resolveRestaurantId(restaurant.name),restaurant]));
    const restaurantsByName=new Map(restaurants.map(restaurant=>[restaurant.name.toLowerCase(),restaurant]));
    const ownerByUserId=new Map(ownerProfiles.map(profile=>[profile.user_id,profile]));
    const adminByUserId=new Map(adminProfiles.map(profile=>[profile.user_id,profile]));
    const itemByKey=new Map(items.map(item=>[item.key,item]));
    const approvedRoleByUserId=new Map();
    const approvedRoleByEmail=new Map();
    roleRequests.forEach(request=>{
        if(request.status!=="approved")return;
        if(request.requesterUserId)approvedRoleByUserId.set(request.requesterUserId,request);
        if(request.accountEmail)approvedRoleByEmail.set(request.accountEmail.toLowerCase(),request);
    });

    const baseUsers=loginProfiles.map(record=>{
        const profile=record.profile;
        const email=record.email.toLowerCase();
        const approvedRole=approvedRoleByUserId.get(profile.user_id)||approvedRoleByEmail.get(email)||null;
        const ownerProfile=ownerByUserId.get(profile.user_id)||null;
        const adminProfile=adminByUserId.get(profile.user_id)||null;
        const role=profile.account_type==="user"&&approvedRole?"restaurant_owner":profile.account_type;
        const sessionMatches=session?.user?.email?.toLowerCase()===email;
        const savedItemKeys=sessionMatches&&session?.user?.saved_item_keys?.length?[...session.user.saved_item_keys]:[...(profile.saved_item_keys||[])];
        const savedRestaurantIds=sessionMatches&&session?.user?.saved_restaurant_ids?.length?[...session.user.saved_restaurant_ids]:[...(profile.saved_restaurant_ids||[])];
        const savedRestaurantNames=[...new Set(savedRestaurantIds.map(id=>restaurantsById.get(id)?.name||restaurantsByResolvedId.get(id)?.name).filter(Boolean))];
        const user={
            id:profile.user_id,
            userId:profile.user_id,
            name:profile.full_name,
            email:record.email,
            pass:record.password||"demo123",
            role,
            si:savedItemKeys,
            sr:savedRestaurantNames,
            diet:[],
        };

        if(role==="admin"){
            return{
                ...user,
                perms:[...(adminProfile?.permissions||[])],
            };
        }

        if(role!=="restaurant_owner"){
            return user;
        }

        const managedNames=(ownerProfile?.managed_restaurant_ids||[]).map(id=>restaurantsById.get(id)?.name||restaurantsByResolvedId.get(id)?.name).filter(Boolean);
        if(managedNames.length===0&&approvedRole?.rest)managedNames.push(approvedRole.rest);
        const uniqueManagedNames=[...new Set(managedNames)];
        const ownerProfileId=ownerProfile?.owner_profile_id||buildOwnerProfileId(profile.user_id,uniqueManagedNames[0]||approvedRole?.rest||profile.full_name);
        const relevantTasks=ownerTasks.filter(task=>task.owner_profile_id===ownerProfileId||uniqueManagedNames.includes(task.restaurant_name));
        const rests=uniqueManagedNames.map(name=>{
            const restaurant=restaurantsByName.get(name.toLowerCase());
            const restaurantTasks=relevantTasks.filter(task=>task.restaurant_name===name);
            return{
                name,
                verified:ownerProfile?ownerProfile.verification_status==="verified":true,
                status:ownerProfile?.access_status==="approved"||approvedRole?"active":"pending",
                type:restaurant?.tags?.[0]||"Franchise",
                tags:[...(restaurant?.tags||[])],
                pdf:restaurant?.pdf||null,
                pdfStatus:restaurant?.pdf?"approved":"not_submitted",
                ic:restaurant?.ic||0,
                pt:restaurantTasks.filter(task=>matchStatus(task.status,"queued","needs_owner_input")).length,
                ct:restaurantTasks.filter(task=>matchStatus(task.status,"completed","submitted_for_admin_review")).length,
            }
        });
        const todos=relevantTasks.map(task=>{
            const itemKey=task.item_keys?.[0]||null;
            const item=itemKey?itemByKey.get(itemKey):null;
            return{
                id:task.task_id,
                type:task.task_type,
                item:item?.n||extractItemNameFromKey(itemKey)||null,
                cat:item?.cat||null,
                status:matchStatus(task.status,"queued","needs_owner_input")?"pending":task.status==="completed"?"completed":"submitted",
                desc:task.title,
                adminNote:task.admin_note||"",
            }
        });
        return{
            ...user,
            phone:ownerProfile?.phone||null,
            rests,
            todos,
            ownerProfileId,
            perms:ownerProfile?.access_status==="approved"||approvedRole?[...OWNER_DEFAULT_PERMS]:[...OWNER_PENDING_PERMS],
            sr:[...new Set([...savedRestaurantNames,...rests.map(rest=>rest.name)])],
        };
    });

    const mergedByEmail=new Map();
    [...baseUsers,...(customUsers||[])].forEach(user=>{mergedByEmail.set(user.email.toLowerCase(),user)});
    return [...mergedByEmail.values()];
}
function toSessionUser(user,savedKeys,savedRestaurants,restaurants){
    const restaurantByName=new Map(restaurants.map(restaurant=>[restaurant.name.toLowerCase(),restaurant]));
    return{
        user_id:user.id||user.userId,
        full_name:user.name,
        email:user.email,
        password_hash:null,
        account_type:user.role==="admin"?"admin":user.role==="restaurant_owner"?"restaurant_owner":"user",
        saved_item_keys:[...savedKeys],
        saved_restaurant_ids:[...new Set(savedRestaurants.map(name=>restaurantByName.get(name.toLowerCase())?.id||resolveRestaurantId(name)).filter(Boolean))],
        restaurant_access_request_ids:[],
        status:"active",
        created_at:new Date().toISOString(),
        updated_at:new Date().toISOString(),
    }
}

export default function App(){
    const[view,setView]=useState("main");
    const[mode,setMode]=useState("best");
    const[search,setSearch]=useState("");
    const[exp,setExp]=useState(null);
    const[filters,setFilters]=useState({...defFilters});
    const[saved,setSaved]=useState(new Set());
    const[savedR,setSavedR]=useState(new Set());
    const[toast,setToast]=useState("");
    const[selRest,setSelRest]=useState(null);
    const[restFilter,setRestFilter]=useState("All");
    const[selItem,setSelItem]=useState(null);
    const[prevView,setPrevView]=useState("main");
    const[reportOpen,setReportOpen]=useState(false);
    const[allItemsState,setAllItemsState]=useState(()=>[...ALL]);
    const[restaurantsState,setRestaurantsState]=useState(()=>[...R]);
    const[loginProfiles,setLoginProfiles]=useState(()=>getDemoLoginProfiles());
    const[ownerProfiles,setOwnerProfiles]=useState(()=>getDemoRestaurantOwnerProfiles());
    const[adminProfiles,setAdminProfiles]=useState(()=>getDemoAdminProfiles());
    const[ownerTasks,setOwnerTasks]=useState(()=>loadOwnerTasks());
    const[adminQ,setAdminQ]=useState(()=>buildLegacyQueue({
        accessRequests:loadDemoAccessRequests(),
        restaurantRequests:loadOwnerRestaurantRequests(),
        changeRequests:loadOwnerRestaurantChangeRequests(),
        reportedIssues:loadReportedIssues(),
        loginProfiles:getDemoLoginProfiles(),
    }));
    const[customUsers,setCustomUsers]=useState(()=>loadStoredCustomUsers());
    const[currentUserEmail,setCurrentUserEmail]=useState(null);
    const[sessionSeed,setSessionSeed]=useState(()=>loadDemoSession());
    const[dataReady,setDataReady]=useState(false);
    const[mob,setMob]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);

    const users=useMemo(()=>buildLegacyUsers({
        loginProfiles,
        ownerProfiles,
        adminProfiles,
        roleRequests:adminQ.role,
        ownerTasks,
        restaurants:restaurantsState,
        items:allItemsState,
        session:sessionSeed,
        customUsers,
    }),[loginProfiles,ownerProfiles,adminProfiles,adminQ.role,ownerTasks,restaurantsState,allItemsState,sessionSeed,customUsers]);
    const user=useMemo(()=>users.find(entry=>entry.email.toLowerCase()===String(currentUserEmail||"").toLowerCase())||null,[users,currentUserEmail]);
    const currentUser=user?{...user,si:[...saved],sr:[...savedR]}:null;

    const flash=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),1800)};
    const toggleSave=(it)=>{if(!currentUser){setView("login");return}const k=ik(it);setSaved(prev=>{const next=new Set(prev);if(next.has(k)){next.delete(k);flash("Removed")}else{next.add(k);flash("Saved!")}return next})};
    const toggleSaveR=(name)=>{if(!currentUser){setView("login");return}setSavedR(prev=>{const next=new Set(prev);if(next.has(name)){next.delete(name);flash("Restaurant removed")}else{next.add(name);flash("Restaurant saved!")}return next})};
    const addIssue=(issue)=>{setAdminQ(prev=>({...prev,issues:[...prev.issues,{...issue,itemKey:issue.itemKey||resolveItemUniqueKey(issue.item,issue.rest)||null,reporterUserId:issue.reporterUserId||currentUser?.id||"",source:issue.source||null}]}))};

    useEffect(()=>{
        const handleResize=()=>setMob(window.innerWidth<768);
        window.addEventListener("resize",handleResize);
        return()=>window.removeEventListener("resize",handleResize);
    },[]);

    useEffect(()=>{
        let ignore=false;
        async function loadData(){
            try{
                const bootstrap=await menuRepository.getBootstrapData();
                if(ignore)return;
                const legacyItems=buildLegacyItems(bootstrap.items||[]);
                const legacyRestaurants=buildLegacyRestaurants(bootstrap.restaurants||[],legacyItems);
                const loadedLoginProfiles=getDemoLoginProfiles();
                const loadedOwnerProfiles=getDemoRestaurantOwnerProfiles();
                const loadedAdminProfiles=getDemoAdminProfiles();
                const loadedOwnerTasks=loadOwnerTasks();
                const loadedAccessRequests=loadDemoAccessRequests();
                const loadedRestaurantRequests=loadOwnerRestaurantRequests();
                const loadedChangeRequests=loadOwnerRestaurantChangeRequests();
                const loadedIssues=loadReportedIssues();
                const queue=buildLegacyQueue({
                    accessRequests:loadedAccessRequests,
                    restaurantRequests:loadedRestaurantRequests,
                    changeRequests:loadedChangeRequests,
                    reportedIssues:loadedIssues,
                    loginProfiles:loadedLoginProfiles,
                });
                setAllItemsState(legacyItems);
                setRestaurantsState(legacyRestaurants);
                setLoginProfiles(loadedLoginProfiles);
                setOwnerProfiles(loadedOwnerProfiles);
                setAdminProfiles(loadedAdminProfiles);
                setOwnerTasks(loadedOwnerTasks);
                setAdminQ(queue);
                setDataReady(true);
            }catch{
                setDataReady(true);
            }
        }
        loadData();
        return()=>{ignore=true};
    },[]);

    useEffect(()=>{replaceArrayContents(ALL,allItemsState)},[allItemsState]);
    useEffect(()=>{
        replaceArrayContents(R,restaurantsState);
        replaceArrayContents(RNAMES,restaurantsState.map(restaurant=>restaurant.name));
    },[restaurantsState]);
    useEffect(()=>{replaceArrayContents(USERS,users)},[users]);
    useEffect(()=>{
        replaceArrayContents(QUEUE.rr,adminQ.rr);
        replaceArrayContents(QUEUE.role,adminQ.role);
        replaceArrayContents(QUEUE.issues,adminQ.issues);
        replaceArrayContents(QUEUE.cr,adminQ.cr);
    },[adminQ]);
    useEffect(()=>{saveStoredCustomUsers(customUsers)},[customUsers]);
    useEffect(()=>{
        if(!dataReady)return;
        saveOwnerTasks(ownerTasks);
    },[dataReady,ownerTasks]);

    useEffect(()=>{
        if(!dataReady)return;
        const userByEmail=new Map(users.map(entry=>[entry.email.toLowerCase(),entry]));
        const userById=new Map(users.map(entry=>[entry.id||entry.userId,entry]));
        const accessRequests=adminQ.role.map(entry=>{
            const source=entry.source||{};
            const matchedUser=userById.get(entry.requesterUserId)||userByEmail.get(String(entry.accountEmail||entry.email||"").toLowerCase());
            return{
                requestId:source.requestId||entry.id,
                requesterUserId:source.requesterUserId||entry.requesterUserId||matchedUser?.id||"",
                restaurantName:entry.rest,
                role:entry.role,
                businessEmail:entry.email||"",
                websiteUrl:source.websiteUrl||"",
                note:entry.note||"",
                submittedAt:source.submittedAt||toIsoDate(entry.at),
                status:fromUiAccessStatus(entry.status),
                adminNotes:entry.adminNote||source.adminNotes||null,
                reviewedAt:entry.status==="pending"?null:(entry.reviewedAt||source.reviewedAt||new Date().toISOString()),
                reviewedByAdminId:entry.status==="pending"?null:(entry.reviewedBy||source.reviewedByAdminId||null),
            }
        });
        const restaurantRequests=adminQ.rr.map(entry=>{
            const source=entry.source||{};
            const now=new Date().toISOString();
            const matchedUser=userById.get(entry.requesterUserId)||userByEmail.get(String(entry.email||"").toLowerCase())||currentUser;
            return{
                _id:source._id||entry.id,
                request_id:source.request_id||entry.id,
                owner_profile_id:source.owner_profile_id||entry.ownerProfileId||buildOwnerProfileId(matchedUser?.id||entry.email,entry.rest),
                requester_user_id:source.requester_user_id||entry.requesterUserId||matchedUser?.id||"",
                restaurant:{
                    restaurant_id:source.restaurant?.restaurant_id||null,
                    restaurant_name:entry.rest,
                    franchise_key:source.restaurant?.franchise_key||resolveRestaurantId(entry.rest),
                    website_url:entry.web||source.restaurant?.website_url||"",
                    menu_url:entry.menuUrl||source.restaurant?.menu_url||"",
                    owner_note:entry.note||source.restaurant?.owner_note||"",
                },
                contact:{
                    owner_full_name:entry.owner||source.contact?.owner_full_name||matchedUser?.name||"",
                    owner_role:entry.role||source.contact?.owner_role||"Owner",
                    restaurant_email:entry.email||source.contact?.restaurant_email||matchedUser?.email||"",
                    owner_phone:entry.phone||source.contact?.owner_phone||"",
                },
                files:{
                    nutrition_pdf:source.files?.nutrition_pdf||createOwnerUploadedFile(entry.pdf||`${resolveRestaurantId(entry.rest)}-nutrition.pdf`,"nutrition_pdf","application/pdf"),
                    restaurant_image:source.files?.restaurant_image||(entry.hasImage?createOwnerUploadedFile(`${resolveRestaurantId(entry.rest)}-restaurant.jpg`,"restaurant_image","image/jpeg"):null),
                    menu_export:source.files?.menu_export||null,
                },
                sample_items:(entry.samples||[]).map(sample=>({
                    item_name:sample.name||"",
                    category:sample.cat||"",
                    price_cad:sample.price!==""&&sample.price!=null?Number(sample.price):null,
                    protein_g:sample.protein!=null?Number(sample.protein):null,
                    calories:sample.cal!=null?Number(sample.cal):null,
                    sodium_mg:null,
                    files:{item_image:null},
                })),
                checklist:source.checklist||{
                    official_source_confirmed:true,
                    review_before_launch_acknowledged:true,
                },
                review:{
                    status:fromUiRestaurantRequestStatus(entry.status),
                    admin_notes:entry.adminNote||source.review?.admin_notes||null,
                    reviewed_by_admin_id:entry.status==="pending"?null:(entry.reviewedBy||source.review?.reviewed_by_admin_id||null),
                    reviewed_at:entry.status==="pending"?null:(entry.reviewedAt||source.review?.reviewed_at||now),
                },
                submitted_at:source.submitted_at||toIsoDate(entry.at,now),
                created_at:source.created_at||source.submitted_at||toIsoDate(entry.at,now),
                updated_at:entry.reviewedAt||source.updated_at||now,
            }
        });
        const changeRequests=adminQ.cr.map(entry=>{
            const source=entry.source||{};
            const metaNote=encodeChangeNote(entry.type,entry.itemName||"",entry.note||entry.desc||"");
            const now=new Date().toISOString();
            const matchedUser=userById.get(entry.requesterUserId)||userByEmail.get(String(entry.email||"").toLowerCase())||currentUser;
            return{
                _id:source._id||entry.id,
                request_id:source.request_id||entry.id,
                owner_profile_id:source.owner_profile_id||entry.ownerProfileId||buildOwnerProfileId(matchedUser?.id||entry.rest,entry.rest),
                requester_user_id:source.requester_user_id||entry.requesterUserId||matchedUser?.id||"",
                restaurant_id:source.restaurant_id||resolveRestaurantId(entry.rest),
                restaurant_name:entry.rest,
                request_type:"restaurant_profile_update",
                requested_changes:{
                    description:entry.type==="rest_description"||entry.type==="rest_url"||entry.type.startsWith("item_")?(entry.note||entry.desc||""):source.requested_changes?.description||null,
                    image_url:entry.type==="rest_image"?(source.requested_changes?.image_url||"pending"):source.requested_changes?.image_url||null,
                },
                owner_note:metaNote,
                files:{
                    restaurant_image:source.files?.restaurant_image||createOwnerUploadedFile(entry.pdf||"change_request.pdf","restaurant_image","application/pdf"),
                },
                review:{
                    status:fromUiChangeStatus(entry.status),
                    admin_notes:entry.adminNote||source.review?.admin_notes||null,
                    reviewed_by_admin_id:entry.status==="pending"?null:(entry.reviewedBy||source.review?.reviewed_by_admin_id||null),
                    reviewed_at:entry.status==="pending"?null:(entry.reviewedAt||source.review?.reviewed_at||now),
                },
                submitted_at:source.submitted_at||toIsoDate(entry.at,now),
                created_at:source.created_at||source.submitted_at||toIsoDate(entry.at,now),
                updated_at:entry.reviewedAt||source.updated_at||now,
            }
        });
        const issues=adminQ.issues.map(entry=>{
            const source=entry.source||{};
            const itemKey=entry.itemKey||source.item_key||resolveItemUniqueKey(entry.item,entry.rest)||null;
            return{
                issue_id:source.issue_id||entry.id,
                reporter_user_id:source.reporter_user_id||entry.reporterUserId||"",
                reporter_type:source.reporter_type||"user",
                restaurant_id:source.restaurant_id||resolveRestaurantId(entry.rest),
                restaurant_name:entry.rest,
                item_key:itemKey,
                item_name:source.item_name||extractItemNameFromKey(itemKey)||String(entry.item||"").split("::")[1]||null,
                issue_type:entry.type,
                note:entry.note||source.note||null,
                attachment:source.attachment||{file_name:null,file_url:null,file_type:null},
                listing_snapshot:source.listing_snapshot||{shown_price_cad:null,shown_category:null,last_updated_at:null,source_url:null},
                status:entry.status==="resolved"?"resolved":entry.status==="in_progress"?"in_progress":"open",
                resolution_note:entry.adminNote||source.resolution_note||null,
                resolved_by_admin_id:entry.status==="resolved"?(entry.reviewedBy||source.resolved_by_admin_id||null):null,
                submitted_at:source.submitted_at||toIsoDate(entry.at),
                resolved_at:entry.status==="resolved"?(entry.reviewedAt||source.resolved_at||new Date().toISOString()):null,
                created_at:source.created_at||source.submitted_at||toIsoDate(entry.at),
                updated_at:entry.reviewedAt||source.updated_at||toIsoDate(entry.at),
            }
        });
        saveDemoAccessRequests(accessRequests);
        saveOwnerRestaurantRequests(restaurantRequests);
        saveOwnerRestaurantChangeRequests(changeRequests);
        saveReportedIssues(issues);
    },[dataReady,adminQ,users,currentUser]);

    useEffect(()=>{
        if(!currentUser)return;
        saveDemoSession({
            logged_in:true,
            requested_owner_access:adminQ.role.some(request=>(request.requesterUserId===currentUser.id||request.accountEmail===currentUser.email)&&request.status==="pending"),
            user:toSessionUser(currentUser,Array.from(saved),Array.from(savedR),restaurantsState),
        });
    },[currentUser,saved,savedR,restaurantsState,adminQ.role]);

    const doLogin=(uData)=>{
        setCurrentUserEmail(uData.email);
        setSaved(new Set(uData.si||[]));
        setSavedR(new Set(uData.sr||[]));
        setView("main");
        flash(`Welcome, ${uData.name}!`);
    };
    const doSignup=(uData)=>{
        const createdId=uData.id||`custom_${Date.now()}`;
        const createdUser={...uData,id:createdId,userId:createdId};
        setCustomUsers(prev=>[...prev.filter(entry=>entry.email.toLowerCase()!==createdUser.email.toLowerCase()),createdUser]);
        doLogin(createdUser);
    };
    const doLogout=()=>{setView("main");setCurrentUserEmail(null);setSaved(new Set());setSavedR(new Set());flash("Logged out")};

    const createRestaurantRequest=(payload)=>{
        const requestId=`rr_${Date.now()}`;
        setAdminQ(prev=>({...prev,rr:[...prev.rr,{
                id:requestId,
                owner:currentUser?.name||"Restaurant owner",
                email:payload.restaurantEmail||currentUser?.email||"",
                phone:payload.phone||"",
                rest:payload.restaurantName,
                role:payload.ownerRole||"Owner",
                web:payload.websiteUrl||null,
                menuUrl:payload.menuUrl||null,
                note:payload.ownerNote||"",
                pdf:`${resolveRestaurantId(payload.restaurantName)}-nutrition.pdf`,
                hasImage:true,
                samples:(payload.sampleItems||[]).map(sample=>({
                    name:sample.name||"",
                    cat:sample.cat||"",
                    protein:sample.protein||"",
                    cal:sample.cal||"",
                    price:sample.price||"",
                })),
                status:"pending",
                at:new Date().toISOString().slice(0,10),
                requesterUserId:currentUser?.id||"",
                ownerProfileId:currentUser?.ownerProfileId||buildOwnerProfileId(currentUser?.id||payload.restaurantEmail,payload.restaurantName),
                source:null,
            }]}));
    };
    const createChangeRequest=(payload)=>{
        const requestId=`cr_${Date.now()}`;
        setAdminQ(prev=>({...prev,cr:[...prev.cr,{
                id:requestId,
                owner:currentUser?.name||"Restaurant owner",
                rest:payload.restaurantName,
                type:payload.type,
                itemName:payload.itemName||"",
                note:payload.note||"",
                desc:payload.itemName?`${payload.note} [${payload.itemName}]`:payload.note,
                pdf:"change_request.pdf",
                status:"pending",
                at:new Date().toISOString().slice(0,10),
                requesterUserId:currentUser?.id||"",
                ownerProfileId:currentUser?.ownerProfileId||buildOwnerProfileId(currentUser?.id||payload.restaurantName,payload.restaurantName),
                source:null,
            }]}));
    };
    const completeOwnerTask=(taskId)=>{
        setOwnerTasks(prev=>prev.map(task=>task.task_id===taskId?{...task,status:"submitted_for_admin_review",updated_at:new Date().toISOString()}:task));
    };
    const sendOwnerTask=({restaurantName,itemName,requestType,note})=>{
        const ownerUser=users.find(entry=>entry.role==="restaurant_owner"&&(entry.rests||[]).some(rest=>rest.name===restaurantName));
        const itemKey=itemName?resolveItemUniqueKey(null,restaurantName,itemName):null;
        const taskType=requestType.includes("image")?"photo_review":requestType.includes("PDF")?"pdf_review":"item_details";
        const title=itemName
            ? requestType.includes("image")
                ? `Upload a photo for ${itemName}`
                : requestType.includes("PDF")
                    ? `Verify nutrition support for ${itemName}`
                    : `Add item details for ${itemName}`
            : requestType.includes("image")
                ? `Upload a restaurant image for ${restaurantName}`
                : requestType.includes("PDF")
                    ? `Upload the latest nutrition PDF for ${restaurantName}`
                    : `Update restaurant details for ${restaurantName}`;
        setOwnerTasks(prev=>[...prev,{
            task_id:`task_${Date.now()}`,
            owner_profile_id:ownerUser?.ownerProfileId||buildOwnerProfileId(ownerUser?.id||restaurantName,restaurantName),
            restaurant_id:resolveRestaurantId(restaurantName),
            restaurant_name:restaurantName,
            task_type,
            title,
            summary:note||requestType,
            status:"needs_owner_input",
            priority:requestType.includes("PDF")?"high":requestType.includes("image")?"low":"medium",
            source_label:itemName||restaurantName,
            item_keys:itemKey?[itemKey]:[],
            missing_fields:requestType.includes("image")?["image"]:requestType.includes("PDF")?["pdf"]:["description"],
            admin_note:note||"",
            created_at:new Date().toISOString(),
            updated_at:new Date().toISOString(),
        }]);
        return true;
    };

    const modeItems=useMemo(()=>{let items=allItemsState.filter(it=>it.p>0&&it.c>50);if(mode==="lowCal")items=items.filter(it=>it.p>=12);if(mode==="lowSodium")items=items.filter(it=>it.so!=null&&it.p>=12);return sortItems(items,mode).slice(0,40)},[mode,allItemsState]);
    const searchResults=useMemo(()=>{let items=[...allItemsState];if(search.trim()){const q=search.toLowerCase();items=items.filter(it=>it.n.toLowerCase().includes(q)||it.r.toLowerCase().includes(q)||it.cat.toLowerCase().includes(q))}if(filters.minP){const v=Number(filters.minP);if(!isNaN(v))items=items.filter(it=>it.p>=v)}if(filters.maxCal){const v=Number(filters.maxCal);if(!isNaN(v))items=items.filter(it=>it.c<=v)}if(filters.maxSod){const v=Number(filters.maxSod);if(!isNaN(v))items=items.filter(it=>it.so!=null&&it.so<=v)}if(filters.maxSug){const v=Number(filters.maxSug);if(!isNaN(v))items=items.filter(it=>it.su!=null&&it.su<=v)}if(filters.rest)items=items.filter(it=>it.r===filters.rest);if(filters.cats.length>0)items=items.filter(it=>filters.cats.includes(catGroup(it.cat)));if(filters.coreOnly)items=items.filter(it=>it.so!=null);return sortItems(items,filters.sort)},[search,filters,allItemsState]);
    const mainFiltered=useMemo(()=>{if(!search.trim())return modeItems;const q=search.toLowerCase();return modeItems.filter(it=>it.n.toLowerCase().includes(q)||it.r.toLowerCase().includes(q))},[modeItems,search]);
    const savedItems=useMemo(()=>allItemsState.filter(it=>saved.has(ik(it))),[saved,allItemsState]);
    const savedRests=useMemo(()=>restaurantsState.filter(r=>savedR.has(r.name)),[savedR,restaurantsState]);

    // Restaurant view items
    const restItems=useMemo(()=>{if(!selRest)return[];let items=allItemsState.filter(it=>it.r===selRest);if(restFilter!=="All")items=items.filter(it=>it.cat===restFilter);return sortItems(items,"best")},[selRest,restFilter,allItemsState]);
    const restData=restaurantsState.find(r=>r.name===selRest);

    // Similar items for detail view
    const similarItems=useMemo(()=>{if(!selItem)return[];return sortItems(allItemsState.filter(it=>ik(it)!==ik(selItem)&&(it.r===selItem.r||it.cat===selItem.cat)),"best").slice(0,6)},[selItem,allItemsState]);

    const goSearch=()=>{setPrevView(view);setView("search");setExp(null);setFilters({...defFilters})};
    const goGallery=(m)=>{setMode(m);setPrevView(view);setView("gallery");setExp(null);window.scrollTo(0,0)};
    const goMain=()=>{setView("main");setExp(null)};
    const goRest=(name)=>{setSelRest(name);setRestFilter("All");setPrevView(view);setView("restaurant");setExp(null);window.scrollTo(0,0)};
    const goItem=(it)=>{setSelItem(it);setPrevView(view);setView("item");setExp(null);setReportOpen(false);window.scrollTo(0,0)};
    const goBack=()=>{setView(prevView||"main");setExp(null)};

    const afc=[filters.minP,filters.maxCal,filters.maxSod,filters.maxSug,filters.rest].filter(Boolean).length+filters.cats.length+(filters.coreOnly?1:0);
    const isAuth=view==="login"||view==="signup";

    return(
        <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(180deg,#faf9f5,#f3f0e8)",color:"#1a1a17",minHeight:"100vh"}}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Fraunces:wght@700;900&display=swap" rel="stylesheet"/>
            <style>{`@keyframes popIn{0%{transform:scale(0.5)}50%{transform:scale(1.3)}100%{transform:scale(1)}} .save-pop{animation:popIn 0.3s ease}`}</style>
            {!isAuth&&<header style={{position:"sticky",top:0,zIndex:50,background:"rgba(250,249,245,0.88)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(30,30,25,0.06)"}}>
                <div style={{maxWidth:1300,margin:"0 auto",padding:"11px 20px",display:"flex",alignItems:"center",gap:12}}>
                    <div onClick={goMain} style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,cursor:"pointer",flexShrink:0}}>
                        <div style={{width:32,height:32,borderRadius:11,display:"grid",placeItems:"center",color:"white",background:"linear-gradient(135deg,#3a8f5c,#6bbf82)",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:14}}>M</div>
                        <span style={{fontSize:14,fontFamily:"'Fraunces',serif",...(mob?{display:"none"}:{})}}> MacroFinder</span>
                    </div>
                    <div onClick={view!=="search"?goSearch:undefined} style={{flex:1,maxWidth:440,background:"rgba(255,255,255,0.9)",border:"1px solid #e4ddd0",borderRadius:16,padding:"7px 12px",display:"flex",alignItems:"center",gap:8,cursor:view!=="search"?"pointer":"default"}}>
                        <span style={{opacity:0.4,fontSize:12}}>🔎</span>
                        <input value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>{if(view!=="search")goSearch()}} placeholder="Search items or restaurants" style={{border:"none",outline:"none",background:"transparent",width:"100%",fontSize:13,color:"#1a1a17"}}/>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                        {view!=="search"&&<button onClick={goSearch} style={{...pill,padding:"7px 12px",fontSize:11}}>Filters</button>}
                        {currentUser?<>
                            <div onClick={()=>setView(view==="profile"?"main":"profile")} style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg,#3a8f5c,#6bbf82)",display:"grid",placeItems:"center",color:"white",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"'Fraunces',serif"}}>{ini(user.name||user.email)}</div>
                        </>:<button onClick={()=>setView("login")} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c",padding:"7px 12px",fontSize:11}}>Log in</button>}
                    </div>
                </div>
            </header>}
            <main style={{maxWidth:1300,margin:"0 auto",padding:isAuth?"0":"14px 20px 60px"}}>
                {view==="main"&&<MainView mode={mode} setMode={setMode} filtered={mainFiltered} exp={exp} setExp={setExp} goGallery={goGallery} saved={saved} toggleSave={toggleSave} user={currentUser} goLogin={()=>setView("login")} goRest={goRest} goItem={goItem} mob={mob}/>}
                {view==="gallery"&&<GalleryView mode={mode} setMode={setMode} filtered={mainFiltered} exp={exp} setExp={setExp} goMain={goMain} saved={saved} toggleSave={toggleSave} goItem={goItem}/>}
                {view==="search"&&<SearchView results={searchResults} filters={filters} setFilters={setFilters} exp={exp} setExp={setExp} goMain={goMain} afc={afc} search={search} saved={saved} toggleSave={toggleSave} goItem={goItem} mob={mob}/>}
                {view==="login"&&<LoginView onLogin={doLogin} goSignup={()=>setView("signup")} goMain={goMain}/>}
                {view==="signup"&&<SignupView onSignup={doSignup} goLogin={()=>setView("login")} goMain={goMain}/>}
                {view==="profile"&&currentUser&&<ProfileView user={currentUser} goMain={goMain} doLogout={doLogout} saved={saved} savedR={savedR} savedItems={savedItems} savedRests={savedRests} toggleSave={toggleSave} toggleSaveR={toggleSaveR} goRest={goRest} goItem={goItem} exp={exp} setExp={setExp} flash={flash} adminQ={adminQ} setAdminQ={setAdminQ} mob={mob} onCreateRestaurantRequest={createRestaurantRequest} onCreateChangeRequest={createChangeRequest} onCompleteTask={completeOwnerTask} onSendTask={sendOwnerTask}/>}
                {view==="restaurant"&&restData&&<RestaurantView rd={restData} items={restItems} filter={restFilter} setFilter={setRestFilter} goMain={goMain} saved={saved} toggleSave={toggleSave} savedR={savedR} toggleSaveR={toggleSaveR} exp={exp} setExp={setExp} flash={flash} goItem={goItem}/>}
                {view==="item"&&selItem&&<ItemDetailView it={selItem} goBack={goBack} goRest={goRest} goItem={goItem} saved={saved} toggleSave={toggleSave} similar={similarItems} flash={flash} reportOpen={reportOpen} setReportOpen={setReportOpen} user={currentUser} addIssue={addIssue} mob={mob}/>}
            </main>
            {toast&&<div style={{position:"fixed",left:"50%",bottom:24,transform:"translateX(-50%)",background:"rgba(30,30,25,0.9)",color:"white",borderRadius:999,padding:"10px 18px",fontSize:12,fontWeight:700,zIndex:200}}>{toast}</div>}
        </div>
    );
}

// ── RESTAURANT VIEW ──
function RestaurantView({rd,items,filter,setFilter,goMain,saved,toggleSave,savedR,toggleSaveR,exp,setExp,flash,goItem}){
    const isRS=savedR.has(rd.name);
    const topPicks=sortItems(items,"best").slice(0,4);
    const ci=R.indexOf(rd);const cl=C[ci%8];
    const proteins=items.filter(it=>it.p>0).map(it=>it.p);
    const avgP=proteins.length?Math.round(proteins.reduce((a,b)=>a+b,0)/proteins.length*10)/10:0;
    return(<>
        {/* HERO */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,overflow:"hidden",marginBottom:16}}>
            <div style={{background:`linear-gradient(135deg,${cl}18,${cl}08)`,position:"relative",minHeight:200,display:"flex",alignItems:"flex-end"}}>
                <div style={{position:"absolute",top:14,left:14,display:"flex",gap:6}}>{rd.tags.map((t,i)=><span key={i} style={{background:"rgba(255,255,255,0.92)",borderRadius:999,padding:"5px 10px",fontSize:10,fontWeight:800}}>{t}</span>)}<span style={{background:"rgba(255,255,255,0.92)",borderRadius:999,padding:"5px 10px",fontSize:10,fontWeight:800}}>{rd.ic} Items</span></div>
                <div style={{position:"absolute",top:14,right:14}}>
                    <button key={isRS?"s":"u"} onClick={()=>toggleSaveR(rd.name)} className={isRS?"save-pop":""} style={{padding:"8px 14px",borderRadius:999,border:"1px solid #e4ddd0",background:isRS?"#fff1f3":"rgba(255,255,255,0.92)",color:isRS?"#d24d71":"#1a1a17",fontWeight:700,fontSize:12,cursor:"pointer"}}>{isRS?"♥ Saved":"♡ Save Restaurant"}</button>
                </div>
                <div style={{padding:22,width:"100%"}}>
                    <div style={{width:52,height:52,borderRadius:16,background:`linear-gradient(135deg,${cl},${cl}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:22,marginBottom:12}}>{ini(rd.name)}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12}}>
                        <div><h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.6rem,3vw,2.4rem)",margin:"0 0 6px",letterSpacing:"-0.04em"}}>{rd.name}</h1><p style={{color:"#6d6a61",fontSize:12,margin:0,maxWidth:"50ch",lineHeight:1.4}}>{rd.desc}</p></div>
                        <div style={{display:"flex",gap:8}}>
                            <div style={{background:"white",border:"1px solid #e4ddd0",borderRadius:16,padding:"10px 14px",textAlign:"right"}}><div style={{color:"#6d6a61",fontSize:9}}>Avg protein</div><div style={{fontWeight:900,fontSize:15}}>{rd.avgP}g</div></div>
                            <div style={{background:"white",border:"1px solid #e4ddd0",borderRadius:16,padding:"10px 14px",textAlign:"right"}}><div style={{color:"#6d6a61",fontSize:9}}>Avg calories</div><div style={{fontWeight:900,fontSize:15}}>{rd.avgC}</div></div>
                        </div>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:10}}>
                        <span style={{...tag,background:`${cl}12`,color:cl,borderColor:`${cl}22`}}>Avg {avgP}P</span>
                        <span style={tag}>{rd.ic} items tracked</span>
                    </div>
                </div>
            </div>
            {/* SOURCE BAR */}
            <div style={{padding:"12px 18px",borderTop:"1px solid #e4ddd0",background:"linear-gradient(135deg,#f9f7f1,#f5f2ea)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <div><strong style={{fontSize:12}}>Nutrition source PDF</strong><br/><span style={{color:"#6d6a61",fontSize:11}}>{rd.pdf}</span></div>
                <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>flash("PDF viewer would open here — will connect to MongoDB file storage")} style={{...pill,padding:"7px 12px",fontSize:11}}>View PDF</button>
                    <button onClick={()=>flash(`Download: ${rd.pdf} — will serve from MongoDB GridFS`)} style={{...pill,padding:"7px 12px",fontSize:11}}>Download PDF</button>
                </div>
            </div>
        </div>

        <button onClick={goMain} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back to all</button>

        {/* TOP PICKS */}
        <Sec title={`Top picks at ${rd.name}`} sub="Strongest items by protein/calorie ratio">
            <Scroll>{topPicks.map((it,i)=><Card key={i} it={it} rank={i+1} ci={i} exp={exp===`tp${i}`} toggle={()=>setExp(exp===`tp${i}`?null:`tp${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}</Scroll>
        </Sec>

        {/* MENU BROWSER */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16}}>
            <div style={{marginBottom:12}}><h2 style={{margin:0,fontSize:16,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Menu browser</h2><p style={{margin:"2px 0 0",color:"#6d6a61",fontSize:11}}>Filter by category, skim cards fast.</p></div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                <button onClick={()=>setFilter("All")} style={{...chp,fontSize:10,padding:"6px 10px",...(filter==="All"?{background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}:{})}}>All</button>
                {rd.cats.map(c=><button key={c} onClick={()=>setFilter(filter===c?"All":c)} style={{...chp,fontSize:10,padding:"6px 10px",...(filter===c?{background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}:{})}}>{c}</button>)}
            </div>
            <div style={{color:"#6d6a61",fontSize:10,marginBottom:10}}>{items.length} items shown · sorted by protein/calorie</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:12}}>
                {items.map((it,i)=><Card key={i} it={it} rank={i+1} ci={i} exp={exp===`rm${i}`} toggle={()=>setExp(exp===`rm${i}`?null:`rm${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}
            </div>
        </div>
    </>);
}

// ── ITEM DETAIL VIEW ──
function ItemDetailView({it,goBack,goRest,goItem,saved,toggleSave,similar,flash,reportOpen,setReportOpen,user,addIssue,mob}){
    const isSaved=saved.has(ik(it));const ci=R.findIndex(r=>r.name===it.r);const cl=C[(ci>=0?ci:0)%8];const rd=R.find(r=>r.name===it.r);
    const fields=[it.p!=null&&"protein",it.c!=null&&"calories",it.f!=null&&"fat",it.ca!=null&&"carbs",it.so!=null&&"sodium",it.su!=null&&"sugar"].filter(Boolean);
    const missing=["protein","calories","fat","carbs","sodium","sugar"].filter(f=>!fields.includes(f));
    const[rType,setRType]=useState("");const[rNote,setRNote]=useState("");
    const submitReport=()=>{if(!rType){flash("Choose an issue type");return}
        addIssue({id:`issue_${Date.now()}`,user:user?.name||"Guest",item:`${it.r}::${it.n}`,itemKey:it.key||null,reporterUserId:user?.id||"",rest:it.r,type:rType,note:rNote||rType,status:"open",at:new Date().toISOString().slice(0,10)});
        flash("Issue reported — admins will review it.");setReportOpen(false);setRType("");setRNote("")};

    return(<>
        <button onClick={goBack} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:12}}>← Back</button>

        {/* HERO CARD */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,overflow:"hidden",marginBottom:16}}>
            <div style={{background:`linear-gradient(135deg,${cl}18,${cl}06)`,padding:"20px 20px 18px",position:"relative"}}>
                <button key={isSaved?"s":"u"} onClick={()=>toggleSave(it)} className={isSaved?"save-pop":""} style={{position:"absolute",top:14,right:14,width:36,height:36,borderRadius:999,border:"none",background:isSaved?"#fff1f3":"rgba(255,255,255,0.92)",color:isSaved?"#d24d71":"#6d6a61",cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>{isSaved?"♥":"♡"}</button>
                <button onClick={()=>goRest(it.r)} style={{display:"inline-flex",gap:6,alignItems:"center",padding:"5px 10px",background:"rgba(255,255,255,0.8)",borderRadius:999,border:"1px solid #e4ddd0",fontSize:10,fontWeight:700,cursor:"pointer",marginBottom:10}}>
                    <div style={{width:16,height:16,borderRadius:5,background:`linear-gradient(135deg,${cl},${cl}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:7}}>{ini(it.r)}</div>{it.r}
                </button>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.4rem,3vw,2rem)",margin:0,letterSpacing:"-0.04em",fontWeight:900,lineHeight:0.98}}>{it.n}</h1>
                    <div style={{background:"rgba(255,255,255,0.8)",border:"1px solid #e4ddd0",borderRadius:14,padding:"8px 12px",fontWeight:900,fontSize:14}}>{it.price?`$${it.price}`:<span style={{color:"#a86a13",fontSize:11}}>Price TBD</span>}</div>
                </div>
                <p style={{margin:"6px 0 0",color:"#6d6a61",fontSize:11}}>{it.cat} · {it.r}</p>
            </div>

            <div style={{padding:"14px 18px"}}>
                {/* QUICK METRICS */}
                <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:14}}>
                    {[[`${it.p}g`,"Protein"],[`${it.c}`,"Calories"],[`${fpc(it.ppc)}%`,"P / Cal"],[`${fields.length}/6`,"Core fields"]].map(([v,l],i)=>
                        <div key={i} style={{border:"1px solid #e4ddd0",borderRadius:14,padding:"10px 12px"}}>
                            <strong style={{fontSize:15,letterSpacing:"-0.02em",display:"block"}}>{v}</strong>
                            <span style={{color:"#6d6a61",fontSize:10}}>{l}</span>
                        </div>
                    )}
                </div>

                {/* ACTIONS */}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                    <button key={isSaved?"s2":"u2"} onClick={()=>toggleSave(it)} className={isSaved?"save-pop":""} style={{...pill,padding:"9px 14px",fontSize:11,background:isSaved?"#fff1f3":"white",color:isSaved?"#d24d71":"#1a1a17",borderColor:isSaved?"#f5c6d0":"#e4ddd0"}}>{isSaved?"★ Saved":"☆ Save Item"}</button>
                    <button onClick={()=>goRest(it.r)} style={{...pill,padding:"9px 14px",fontSize:11}}>View Restaurant</button>
                    <button onClick={()=>setReportOpen(true)} style={{...pill,padding:"9px 14px",fontSize:11}}>Report issue</button>
                </div>

                {/* NUTRITION TABLE */}
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:15,margin:"0 0 8px"}}>Nutrition breakdown</h2>
                <div style={{border:"1px solid #e4ddd0",borderRadius:14,overflow:"hidden",marginBottom:16}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <tbody>
                        {[["Calories",it.c,null],["Protein",it.p,"g"],["Carbs",it.ca,"g"],["Fat",it.f,"g"],["Sodium",it.so,"mg"],["Sugar",it.su,"g"]].map(([label,val,unit],i)=>
                            <tr key={i} style={{borderBottom:i<5?"1px solid #e4ddd0":"none"}}>
                                <th style={{padding:"10px 14px",textAlign:"left",color:"#6d6a61",fontWeight:700,background:"#fcfbf8",width:"40%"}}>{label}</th>
                                <td style={{padding:"10px 14px",fontWeight:700}}>{val!=null?`${val}${unit||""}`:<span style={{color:"#a86a13"}}>N/A</span>}</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* DATA TRUST + RESTAURANT - inline instead of sidebar */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:16}}>
                    <div style={{background:"#f7f4ec",border:"1px solid #e9e3d6",borderRadius:16,padding:14}}>
                        <h3 style={{fontSize:13,fontWeight:800,margin:"0 0 8px"}}>Data trust</h3>
                        <div style={{display:"grid",gap:6}}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#6d6a61"}}>Listed fields</span><strong style={{textAlign:"right",maxWidth:"60%"}}>{fields.join(", ")}</strong></div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#6d6a61"}}>Missing</span><strong>{missing.length>0?missing.join(", "):"None"}</strong></div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#6d6a61"}}>Source</span><strong>{rd?rd.pdf:"N/A"}</strong></div>
                        </div>
                        <button onClick={()=>setReportOpen(true)} style={{...pill,width:"100%",textAlign:"center",marginTop:8,fontSize:10}}>Something wrong?</button>
                    </div>
                    {rd&&<div style={{background:"#f7f4ec",border:"1px solid #e9e3d6",borderRadius:16,padding:14}}>
                        <h3 style={{fontSize:13,fontWeight:800,margin:"0 0 8px"}}>Restaurant</h3>
                        <div style={{display:"grid",gap:6}}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#6d6a61"}}>Name</span><strong>{rd.name}</strong></div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#6d6a61"}}>Items tracked</span><strong>{rd.ic}</strong></div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#6d6a61"}}>Avg protein</span><strong>{rd.avgP}g</strong></div>
                        </div>
                        <button onClick={()=>goRest(it.r)} style={{...pill,width:"100%",textAlign:"center",marginTop:8,fontSize:10}}>Open menu</button>
                    </div>}
                </div>

                {/* SIMILAR PICKS */}
                {similar.length>0&&<>
                    <h2 style={{fontFamily:"'Fraunces',serif",fontSize:15,margin:"0 0 8px"}}>Similar picks</h2>
                    <Scroll>{similar.map((s,i)=><div key={i} onClick={()=>goItem(s)} style={{background:"white",border:"1px solid #e4ddd0",borderRadius:16,padding:12,minWidth:210,cursor:"pointer",transition:"transform 0.12s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:2}}><strong style={{fontSize:11,lineHeight:1.2}}>{s.n}</strong></div>
                        <div style={{color:"#6d6a61",fontSize:10,marginBottom:5}}>{s.r}</div>
                        <div style={{display:"flex",gap:4}}><span style={tag}>{s.p}P</span><span style={tag}>{s.c}Cal</span></div>
                    </div>)}</Scroll>
                </>}
            </div>
        </div>

        {/* REPORT ISSUE MODAL */}
        {reportOpen&&<div onClick={()=>setReportOpen(false)} style={{position:"fixed",inset:0,background:"rgba(20,20,18,0.35)",backdropFilter:"blur(4px)",display:"grid",placeItems:"center",zIndex:110,padding:16}}>
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"rgba(255,255,255,0.98)",border:"1px solid #e4ddd0",borderRadius:22,padding:20,boxShadow:"0 20px 50px rgba(20,20,16,0.15)"}}>
                <h3 style={{fontFamily:"'Fraunces',serif",fontSize:18,margin:"0 0 6px"}}>Report an issue</h3>
                <p style={{color:"#6d6a61",fontSize:12,margin:"0 0 14px",lineHeight:1.4}}>Pick what looks wrong. The item details are attached automatically.</p>
                <div style={{marginBottom:12}}><label style={{display:"block",fontSize:11,fontWeight:800,marginBottom:4}}>What is wrong?</label>
                    <select value={rType} onChange={e=>setRType(e.target.value)} style={{...inp,padding:"10px 12px",fontSize:12}}>
                        <option value="">Select an issue type</option>
                        <option>Wrong nutrition info</option><option>Wrong price</option><option>Item discontinued</option><option>Wrong category</option><option>Duplicate listing</option><option>Other</option>
                    </select>
                </div>
                <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:800,marginBottom:4}}>Extra note</label>
                    <textarea value={rNote} onChange={e=>setRNote(e.target.value)} placeholder="Optional — describe what's wrong." style={{...inp,minHeight:80,resize:"vertical",fontSize:12,padding:"10px 12px"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:12,borderRadius:14,background:"#f7f4ec",border:"1px solid #e9e3d6",fontSize:10,marginBottom:14}}>
                    <div><span style={{color:"#6d6a61",fontWeight:800,textTransform:"uppercase",fontSize:8}}>Item</span><br/><strong>{it.n}</strong></div>
                    <div><span style={{color:"#6d6a61",fontWeight:800,textTransform:"uppercase",fontSize:8}}>Restaurant</span><br/><strong>{it.r}</strong></div>
                    <div><span style={{color:"#6d6a61",fontWeight:800,textTransform:"uppercase",fontSize:8}}>Category</span><br/><strong>{it.cat}</strong></div>
                    <div><span style={{color:"#6d6a61",fontWeight:800,textTransform:"uppercase",fontSize:8}}>Source</span><br/><strong>{rd?rd.pdf:"N/A"}</strong></div>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setReportOpen(false)} style={pill}>Cancel</button>
                    <button onClick={submitReport} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Submit report</button>
                </div>
            </div>
        </div>}
    </>);
}

// ── AUTH ──
function LoginView({onLogin,goSignup,goMain}){
    const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[err,setErr]=useState("");
    const submit=()=>{if(!email||!pass){setErr("Enter email and password");return}const u=USERS.find(u=>u.email===email&&u.pass===pass);if(!u){setErr("Invalid email or password");return}onLogin(u)};
    return <AuthShell><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#3a8f5c",fontWeight:800,marginBottom:4}}>Macro Finder</div>
        <h1 style={{fontFamily:"'Fraunces',serif",fontSize:28,margin:"0 0 6px",letterSpacing:"-0.04em"}}>Log in</h1>
        <p style={{color:"#6d6a61",fontSize:13,margin:"0 0 20px"}}>Welcome back. Sign in to continue to Macro Finder.</p>
        <AF label="Email" value={email} onChange={setEmail} type="email" ph="Enter your email"/>
        <AF label="Password" value={pass} onChange={setPass} type="password" ph="Enter your password"/>
        {err&&<p style={{color:"#9e4c3b",fontSize:11,margin:"0 0 8px"}}>{err}</p>}
        <button onClick={submit} style={{...bigBtn,marginTop:8}}>Log in</button>
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0"}}><div style={{flex:1,height:1,background:"#e4ddd0"}}/><span style={{color:"#6d6a61",fontSize:11}}>or</span><div style={{flex:1,height:1,background:"#e4ddd0"}}/></div>
        <button onClick={goMain} style={{...bigBtn,background:"white",color:"#1a1a17",border:"1px solid #e4ddd0"}}>Continue as guest</button>
        <p style={{textAlign:"center",fontSize:13,color:"#6d6a61",marginTop:18}}>Don't have an account? <span onClick={goSignup} style={{fontWeight:800,color:"#1a1a17",cursor:"pointer"}}>Create one</span></p>
        <div style={{marginTop:18,padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6"}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#6d6a61",marginBottom:8}}>Demo accounts</div>
            <div style={{display:"grid",gap:6}}>
                {USERS.map((u,i)=><button key={i} onClick={()=>onLogin(u)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:12,border:"1px solid #e4ddd0",background:"white",cursor:"pointer",fontSize:11,textAlign:"left"}}>
                    <div><strong>{u.name}</strong><br/><span style={{color:"#6d6a61",fontSize:9}}>{u.email}</span></div>
                    <span style={{...tag,fontSize:8}}>{u.role==="admin"?"Admin":u.role==="restaurant_owner"?"Owner":"User"}</span>
                </button>)}
            </div>
        </div>
    </AuthShell>;
}
function SignupView({onSignup,goLogin}){
    const[name,setName]=useState("");const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[pass2,setPass2]=useState("");const[agree,setAgree]=useState(false);const[err,setErr]=useState("");
    const submit=()=>{if(!name||!email||!pass){setErr("Fill in all fields");return}if(pass!==pass2){setErr("Passwords don't match");return}if(pass.length<8){setErr("Min 8 characters");return}if(!agree){setErr("Please agree to the privacy policy");return}onSignup({id:"user_new",name,email,pass,role:"user",si:[],sr:[],diet:[]})};
    return <AuthShell><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#3a8f5c",fontWeight:800,marginBottom:4}}>Macro Finder</div>
        <h1 style={{fontFamily:"'Fraunces',serif",fontSize:28,margin:"0 0 6px",letterSpacing:"-0.04em"}}>Create account</h1>
        <p style={{color:"#6d6a61",fontSize:13,margin:"0 0 20px"}}>Join Macro Finder and start comparing meals smarter.</p>
        <AF label="Full name" value={name} onChange={setName} ph="Enter your full name"/>
        <AF label="Email" value={email} onChange={setEmail} type="email" ph="Enter your email"/>
        <AF label="Password" value={pass} onChange={setPass} type="password" ph="Create a password"/>
        <AF label="Confirm password" value={pass2} onChange={setPass2} type="password" ph="Confirm your password"/>
        <label style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px 14px",borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6",cursor:"pointer",margin:"4px 0"}}>
            <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} style={{accentColor:"#3a8f5c",width:18,height:18,marginTop:2,flexShrink:0}}/>
            <span style={{fontSize:11,lineHeight:1.45}}>I agree to the <strong>Privacy Policy</strong> and understand that Macro Finder may collect my name, email, saved meals, and saved restaurants to support meal comparison, account access, and app improvements. No payment or location data is collected.</span>
        </label>
        {err&&<p style={{color:"#9e4c3b",fontSize:11,margin:"4px 0 0"}}>{err}</p>}
        <button onClick={submit} style={{...bigBtn,marginTop:8}}>Create account</button>
        <p style={{textAlign:"center",fontSize:13,color:"#6d6a61",marginTop:18}}>Already have an account? <span onClick={goLogin} style={{fontWeight:800,color:"#1a1a17",cursor:"pointer"}}>Log in</span></p>
    </AuthShell>;
}
function AuthShell({children}){return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"linear-gradient(180deg,#faf9f5,#f0ede4)"}}><div style={{width:"100%",maxWidth:420}}>{children}</div></div>}
function AF({label,value,onChange,type="text",ph}){return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>{label}</label><input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={ph} style={{width:"100%",padding:"12px 16px",borderRadius:18,border:"1px solid #e4ddd0",outline:"none",background:"white",fontSize:13,boxSizing:"border-box"}}/></div>}

// ── PROFILE ──
function ProfileView({user,goMain,doLogout,saved,savedR,savedItems,savedRests,toggleSave,toggleSaveR,goRest,goItem,exp,setExp,flash,adminQ,setAdminQ,mob,onCreateRestaurantRequest,onCreateChangeRequest,onCompleteTask,onSendTask}){
    if(mob&&(user.role==="admin"||user.role==="restaurant_owner")) return <><button onClick={goMain} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back</button><div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:24,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>💻</div><h2 style={{fontFamily:"'Fraunces',serif",fontSize:18,margin:"0 0 8px"}}>Desktop required</h2><p style={{color:"#6d6a61",fontSize:12,margin:"0 0 14px",lineHeight:1.4}}>{user.role==="admin"?"Admin dashboard":"Restaurant owner tools"} requires a desktop browser for the full experience.</p><p style={{color:"#6d6a61",fontSize:11,margin:"0 0 14px"}}>Logged in as <strong>{user.name}</strong> ({user.email})</p><button onClick={doLogout} style={{...pill,padding:"9px 14px",fontSize:11,color:"#9e4c3b"}}>Log out</button></div></>;
    if(user.role==="admin") return <AdminView user={user} goMain={goMain} doLogout={doLogout} flash={flash} adminQ={adminQ} setAdminQ={setAdminQ} onSendTask={onSendTask}/>;
    if(user.role==="restaurant_owner") return <OwnerProfile user={user} goMain={goMain} doLogout={doLogout} goRest={goRest} flash={flash} adminQ={adminQ} setAdminQ={setAdminQ} onCreateRestaurantRequest={onCreateRestaurantRequest} onCreateChangeRequest={onCreateChangeRequest} onCompleteTask={onCompleteTask}/>;
    return <UserProfile user={user} goMain={goMain} doLogout={doLogout} saved={saved} savedR={savedR} savedItems={savedItems} savedRests={savedRests} toggleSave={toggleSave} toggleSaveR={toggleSaveR} goRest={goRest} goItem={goItem} exp={exp} setExp={setExp} flash={flash} adminQ={adminQ} setAdminQ={setAdminQ}/>;
}

// ── USER PROFILE ──
function UserProfile({user,goMain,doLogout,saved,savedR,savedItems,savedRests,toggleSave,toggleSaveR,goRest,goItem,exp,setExp,flash,adminQ,setAdminQ}){
    const[sub,setSub]=useState(null);
    const[reqName,setReqName]=useState("");const[reqRole,setReqRole]=useState("Owner");const[reqEmail,setReqEmail]=useState(user?.email||"");const[reqNote,setReqNote]=useState("");const[reqSent,setReqSent]=useState(()=>adminQ.role.some(r=>r.requesterUserId===user?.id||r.accountEmail===user?.email||r.email===user?.email));
    const pendingRoleReq=adminQ.role.find(r=>r.requesterUserId===user?.id||r.accountEmail===user?.email||r.email===user?.email);
    const submitReq=()=>{if(!reqName||!reqEmail){flash("Fill in restaurant name and email");return}
        setAdminQ(p=>({...p,role:[...p.role,{id:`role_${Date.now()}`,user:user.name,email:reqEmail,accountEmail:user.email,rest:reqName,role:reqRole,note:reqNote,status:"pending",at:new Date().toISOString().slice(0,10),requesterUserId:user.id,source:null}]}));
        setReqSent(true);flash("Request submitted — admins will review.")};
    const previewItems=savedItems.slice(0,2);const previewRests=savedRests.slice(0,2);

    if(sub==="allItems") return <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <button onClick={()=>setSub(null)} style={{...pill,padding:"7px 11px",fontSize:11}}>← Back to profile</button>
            <span style={{...tag,fontSize:11}}>{savedItems.length} saved meals</span>
        </div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:18,margin:"0 0 12px"}}>All saved meals</h2>
        {savedItems.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:12}}>
            {savedItems.map((it,i)=><Card key={i} it={it} rank={i+1} ci={i} exp={exp===`svi${i}`} toggle={()=>setExp(exp===`svi${i}`?null:`svi${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}
        </div>:<div style={{textAlign:"center",padding:30,color:"#6d6a61",fontSize:12}}>No saved items yet.</div>}
    </>;

    if(sub==="allRests") return <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <button onClick={()=>setSub(null)} style={{...pill,padding:"7px 11px",fontSize:11}}>← Back to profile</button>
            <span style={{...tag,fontSize:11}}>{savedRests.length} saved restaurants</span>
        </div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:18,margin:"0 0 12px"}}>All saved restaurants</h2>
        {savedRests.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {savedRests.map((r,i)=>{const cl=C[R.indexOf(r)%8];return <div key={i} onClick={()=>goRest(r.name)} style={{background:"rgba(255,255,255,0.92)",border:"1px solid #e4ddd0",borderRadius:18,overflow:"hidden",cursor:"pointer",transition:"transform 0.12s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                <div style={{height:60,background:`linear-gradient(135deg,${cl}12,${cl}06)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px"}}>
                    <div style={{width:36,height:36,borderRadius:11,background:`linear-gradient(135deg,${cl},${cl}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900}}>{ini(r.name)}</div>
                    <button key={savedR.has(r.name)?"s":"u"} onClick={e=>{e.stopPropagation();toggleSaveR(r.name)}} className="save-pop" style={{width:28,height:28,borderRadius:999,border:"none",background:"#fff1f3",color:"#d24d71",cursor:"pointer",fontSize:12,display:"grid",placeItems:"center"}}>♥</button>
                </div>
                <div style={{padding:12}}><div style={{fontWeight:800,fontSize:13,marginBottom:2}}>{r.name}</div><div style={{color:"#6d6a61",fontSize:11}}>{r.ic} items · avg {r.avgP}g protein</div></div>
            </div>})}
        </div>:<div style={{textAlign:"center",padding:30,color:"#6d6a61",fontSize:12}}>No saved restaurants yet.</div>}
    </>;

    return(<>
        <button onClick={goMain} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back</button>
        <div style={{background:"linear-gradient(135deg,#f0f7f2,#e8f0e3)",border:"1px solid #d5e2d8",borderRadius:22,padding:20,marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"64px 1fr",gap:14,alignItems:"center",marginBottom:12}}>
                <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#3a8f5c,#6bbf82)",display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:24}}>{ini(user.name||user.email)}</div>
                <div><h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.3rem,2.5vw,1.8rem)",margin:0,letterSpacing:"-0.03em"}}>{user.name||"User"}</h1><p style={{margin:"4px 0 0",color:"#6d6a61",fontSize:11}}>{user.email}</p></div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={tag}>{savedItems.length} saved meals</span><span style={tag}>{savedRests.length} saved restaurants</span><span style={tag}>Personal account</span></div>
        </div>
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}><div><h2 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Saved meals</h2></div>{savedItems.length>2&&<button onClick={()=>setSub("allItems")} style={{background:"transparent",border:"none",color:"#3a8f5c",fontWeight:800,fontSize:11,cursor:"pointer"}}>See all →</button>}</div>
            {previewItems.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
                {previewItems.map((it,i)=>{const cl=C[i%8];return <div key={i} style={{borderRadius:18,overflow:"hidden",border:"1px solid #e4ddd0",background:"white"}}>
                    <div style={{height:55,background:`linear-gradient(135deg,${cl}12,${cl}06)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:26,height:26,borderRadius:8,background:`linear-gradient(135deg,${cl},${cl}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:10}}>{ini(it.r)}</div><span style={{...tag,fontSize:9}}>{it.cat}</span></div><button key={saved.has(ik(it))?"s":"u"} onClick={()=>toggleSave(it)} className="save-pop" style={{width:26,height:26,borderRadius:999,border:"none",background:"#fff1f3",color:"#d24d71",cursor:"pointer",fontSize:11,display:"grid",placeItems:"center"}}>♥</button></div>
                    <div style={{padding:12}}><div style={{fontWeight:800,fontSize:12,lineHeight:1.2,marginBottom:2}}>{it.n}</div><div style={{color:"#6d6a61",fontSize:10,marginBottom:6}}>{it.r}</div><div style={{display:"flex",gap:4,marginBottom:8}}><span style={tag}>{it.p}P</span><span style={tag}>{it.c}Cal</span></div><button onClick={()=>goItem(it)} style={{background:"transparent",border:"none",color:"#3a8f5c",fontWeight:800,fontSize:10,cursor:"pointer",padding:0}}>Open item →</button></div>
                </div>})}
            </div>:<div style={{textAlign:"center",padding:20,color:"#6d6a61",fontSize:11}}>No saved meals yet.</div>}
        </div>
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}><div><h2 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Saved restaurants</h2></div>{savedRests.length>2&&<button onClick={()=>setSub("allRests")} style={{background:"transparent",border:"none",color:"#3a8f5c",fontWeight:800,fontSize:11,cursor:"pointer"}}>See all →</button>}</div>
            {previewRests.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
                {previewRests.map((r,i)=>{const cl=C[R.indexOf(r)%8];return <div key={i} onClick={()=>goRest(r.name)} style={{borderRadius:18,overflow:"hidden",border:"1px solid #e4ddd0",background:"white",cursor:"pointer"}}><div style={{height:50,background:`linear-gradient(135deg,${cl}12,${cl}06)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px"}}><div style={{width:30,height:30,borderRadius:10,background:`linear-gradient(135deg,${cl},${cl}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:900}}>{ini(r.name)}</div></div><div style={{padding:12}}><div style={{fontWeight:800,fontSize:12,marginBottom:2}}>{r.name}</div><div style={{color:"#6d6a61",fontSize:10}}>{r.ic} items</div></div></div>})}
            </div>:<div style={{textAlign:"center",padding:20,color:"#6d6a61",fontSize:11}}>No saved restaurants yet.</div>}
        </div>
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <h2 style={{margin:"0 0 10px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Account</h2>
            <div style={{display:"grid",gap:10}}>
                <div style={{padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:pendingRoleReq?0:sub==="requestAccess"?10:0}}>
                        <div><strong style={{fontSize:12}}>{pendingRoleReq?`Request ${pendingRoleReq.status}${pendingRoleReq.status==="approved"?" — log out and back in to access owner tools":""}`:"Request restaurant access"}</strong><br/><span style={{color:"#6d6a61",fontSize:10}}>{pendingRoleReq?`${pendingRoleReq.rest} · ${pendingRoleReq.role}`:"Manage a franchise? Request owner tools."}</span></div>
                        {pendingRoleReq&&<span style={{...tag,...(pendingRoleReq.status==="approved"?{background:"#edf5ef",color:"#274b37"}:pendingRoleReq.status==="denied"?{background:"#fef2f2",color:"#991b1b"}:{background:"#fef3cd",color:"#856404"})}}>{pendingRoleReq.status}</span>}
                        {!pendingRoleReq&&!reqSent&&<button onClick={()=>setSub(sub==="requestAccess"?null:"requestAccess")} style={{...pill,padding:"6px 10px",fontSize:10,flexShrink:0}}>{sub==="requestAccess"?"Close":"Apply"}</button>}
                    </div>
                    {sub==="requestAccess"&&!reqSent&&<div style={{display:"grid",gap:10,marginTop:10,paddingTop:10,borderTop:"1px solid #e4ddd0"}}>
                        <AF label="Restaurant / franchise name" value={reqName} onChange={setReqName} ph="e.g. Freshii"/>
                        <AF label="Your role" value={reqRole} onChange={setReqRole} ph="Owner / Manager"/>
                        <AF label="Business contact email" value={reqEmail} onChange={setReqEmail} type="email" ph="owner@restaurant.com"/>
                        <div style={{marginBottom:0}}><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>What do you need access for?</label><textarea value={reqNote} onChange={e=>setReqNote(e.target.value)} placeholder="Upload nutrition PDFs, update menu items, etc." style={{...inp,minHeight:70,resize:"vertical",fontSize:12,padding:"10px 12px"}}/></div>
                        <p style={{color:"#6d6a61",fontSize:10,margin:0}}>Requests go to admin for review. Franchise-level only, no location data needed.</p>
                        <button onClick={submitReq} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c",textAlign:"center"}}>Submit request</button>
                    </div>}
                </div>
                <div style={{padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><strong style={{fontSize:12}}>What we store</strong><p style={{margin:"4px 0 0",color:"#6d6a61",fontSize:10,lineHeight:1.4}}>Your name, email, saved meals, and saved restaurants. No payment data, no location data.</p></div>
                <button onClick={doLogout} style={{...pill,width:"100%",textAlign:"center",padding:"11px 16px",fontSize:12,color:"#9e4c3b"}}>Log out</button>
            </div>
        </div>
    </>);
}

// ── OWNER PROFILE ──
function OwnerProfile({user,goMain,doLogout,goRest,flash,adminQ,setAdminQ,onCreateRestaurantRequest,onCreateChangeRequest,onCompleteTask}){
    const[sub,setSub]=useState(null);
    const todos=user.todos||[];
    const[activeTask,setActiveTask]=useState(null);
    const[taskInput,setTaskInput]=useState("");
    // Add restaurant form
    const[arName,setArName]=useState("");const[arRole,setArRole]=useState("Owner");const[arEmail,setArEmail]=useState(user?.email||"");const[arPhone,setArPhone]=useState(user?.phone||"");const[arWeb,setArWeb]=useState("");const[arMenuUrl,setArMenuUrl]=useState("");const[arNote,setArNote]=useState("");const[arSubmitted,setArSubmitted]=useState(false);
    const[arCheck1,setArCheck1]=useState(false);const[arCheck2,setArCheck2]=useState(false);
    const[s1,setS1]=useState({name:"",cat:"Burgers",price:"",protein:"",cal:"",sodium:""});
    const[s2,setS2]=useState({name:"",cat:"Bowls",price:"",protein:"",cal:"",sodium:""});
    const submitAddRest=()=>{if(!arName){flash("Enter restaurant name");return}if(!arCheck1||!arCheck2){flash("Please confirm both checkboxes");return}onCreateRestaurantRequest?.({restaurantName:arName,ownerRole:arRole,restaurantEmail:arEmail,phone:arPhone,websiteUrl:arWeb,menuUrl:arMenuUrl,ownerNote:arNote,sampleItems:[s1,s2],hasImage:true});setArSubmitted(true);flash(`${arName} submitted for review!`);setSub(null)};
    // Change requests
    const[crType,setCrType]=useState("rest_url");const[crDesc,setCrDesc]=useState("");const[crItemName,setCrItemName]=useState("");
    const myRequests=useMemo(()=>(adminQ.cr||[]).filter(r=>(user.rests||[]).some(x=>x.name===r.rest)),[adminQ.cr,user.rests]);

    const pendingTodos=todos.filter(t=>t.status==="pending");
    const completeTask=(taskId)=>{onCompleteTask?.(taskId);setActiveTask(null);setTaskInput("");flash("Task completed — PDF submitted to admin for review.")};

    // Task detail sub-view
    if(activeTask){
        const t=todos.find(t=>t.id===activeTask);
        if(!t)return null;
        return <>
            <button onClick={()=>setActiveTask(null)} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back to profile</button>
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:20,maxWidth:560}}>
                <span style={{display:"inline-block",...tag,marginBottom:10,fontSize:9}}>{t.item?"Item task":"Restaurant task"}</span>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,margin:"0 0 6px"}}>{t.desc}</h2>
                {t.item&&<p style={{color:"#6d6a61",fontSize:12,margin:"0 0 4px"}}>Item: {t.item}{t.cat?` · ${t.cat}`:""}</p>}
                <p style={{color:"#6d6a61",fontSize:11,margin:"0 0 16px"}}>{t.item?"This is a menu item request.":"This is a restaurant-level request."}</p>

                {t.adminNote&&<div style={{padding:10,borderRadius:12,background:"#edf5ef",border:"1px solid #d2e5d7",marginBottom:14}}>
                    <div style={{fontSize:9,fontWeight:800,color:"#274b37",textTransform:"uppercase",marginBottom:2}}>Admin note</div>
                    <p style={{fontSize:11,margin:0,color:"#274b37"}}>{t.adminNote}</p>
                </div>}

                <div style={{border:"2px dashed #e4ddd0",borderRadius:16,padding:24,textAlign:"center",background:"#fcfbf8",marginBottom:12}}>
                    <div style={{fontSize:28,marginBottom:6}}>📄</div>
                    <strong style={{fontSize:12}}>Upload PDF</strong>
                    <p style={{color:"#6d6a61",fontSize:10,margin:"4px 0 0"}}>Attach the relevant document for admin review.</p>
                    <button onClick={()=>flash("PDF upload → MongoDB GridFS")} style={{...pill,marginTop:10,padding:"8px 14px",fontSize:11}}>Choose PDF</button>
                </div>
                <button onClick={()=>completeTask(t.id)} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c",textAlign:"center",padding:"11px 16px",width:"100%"}}>Submit to admin</button>
            </div>
        </>;
    }

    // Add restaurant form
    if(sub==="addRestaurant"){
        const catOpts=["Burgers","Bowls","Wraps","Salads","Steaks","Chicken","Pasta","Sides","Smoothies","Sandwiches","Breakfast","Desserts","Appetizers","Seafood","Other"];
        const us=(setter,field)=>v=>setter(p=>({...p,[field]:v}));
        return <>
            <button onClick={()=>setSub(null)} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back to profile</button>
            <div style={{background:"linear-gradient(135deg,#f8fbf8,#edf5ef)",border:"1px solid #d5e2d8",borderRadius:22,padding:20,marginBottom:14}}>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,margin:"0 0 6px",letterSpacing:"-0.03em"}}>Restaurant request form</h2>
                <p style={{color:"#6d6a61",fontSize:12,margin:0,lineHeight:1.4}}>Keep this focused on the details needed to review and build a clean restaurant listing.</p>
            </div>

            {/* BUSINESS DETAILS */}
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:18,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 4px"}}>Business details</h3>
                <p style={{color:"#6d6a61",fontSize:11,margin:"0 0 14px"}}>Contact details needed to review a new restaurant request.</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <AF label="Restaurant name" value={arName} onChange={setArName} ph="e.g. Pacific Protein Kitchen"/>
                    <AF label="Owner full name" value={user.name} onChange={()=>{}} ph="Auto-filled"/>
                    <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Role</label>
                        <select value={arRole} onChange={e=>setArRole(e.target.value)} style={{...inp,padding:"12px 14px",fontSize:12}}><option>Owner</option><option>General Manager</option><option>Operations Lead</option><option>Marketing Lead</option></select>
                    </div>
                    <AF label="Restaurant email" value={arEmail} onChange={setArEmail} type="email" ph="owner@restaurant.ca"/>
                    <AF label="Phone" value={arPhone} onChange={setArPhone} ph="(403) 555-0176"/>
                    <AF label="Official website" value={arWeb} onChange={setArWeb} ph="https://restaurant.ca"/>
                </div>
                <div style={{marginTop:2}}><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Short note about your menu</label>
                    <textarea value={arNote} onChange={e=>setArNote(e.target.value)} placeholder="We focus on bowls, wraps, and smaller portable items. Protein and calories are available on all core menu items." style={{...inp,minHeight:80,resize:"vertical",fontSize:12,padding:"12px 14px"}}/></div>
            </div>

            {/* SOURCES & IMAGES */}
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:18,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 4px"}}>Official sources and images</h3>
                <p style={{color:"#6d6a61",fontSize:11,margin:"0 0 14px"}}>These files help the team verify the listing before anything goes live.</p>
                <div style={{display:"grid",gap:12}}>
                    <div>
                        <label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Nutrition PDF</label>
                        <div style={{border:"2px dashed #e4ddd0",borderRadius:16,padding:18,background:"#fcfbf8",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                            <button onClick={()=>flash("PDF upload → MongoDB GridFS")} style={{...pill,padding:"8px 14px",fontSize:11}}>📄 Upload PDF</button>
                            <span style={{color:"#6d6a61",fontSize:10}}>No PDF selected</span>
                        </div>
                        <p style={{color:"#6d6a61",fontSize:10,margin:"4px 0 0"}}>Use the latest official nutrition sheet or menu PDF.</p>
                    </div>
                    <AF label="Menu URL" value={arMenuUrl} onChange={setArMenuUrl} ph="https://restaurant.ca/menu"/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                            <label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Restaurant image</label>
                            <div style={{border:"2px dashed #e4ddd0",borderRadius:16,padding:16,background:"#fcfbf8",textAlign:"center"}}>
                                <button onClick={()=>flash("Image upload → MongoDB GridFS")} style={{...pill,padding:"7px 12px",fontSize:10}}>📷 Upload image</button>
                                <p style={{color:"#6d6a61",fontSize:9,margin:"4px 0 0"}}>No image selected</p>
                            </div>
                        </div>
                        <div>
                            <label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Optional menu CSV or sheet</label>
                            <div style={{border:"2px dashed #e4ddd0",borderRadius:16,padding:16,background:"#fcfbf8",textAlign:"center"}}>
                                <button onClick={()=>flash("File upload → MongoDB")} style={{...pill,padding:"7px 12px",fontSize:10}}>📊 Upload file</button>
                                <p style={{color:"#6d6a61",fontSize:9,margin:"4px 0 0"}}>No file selected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* REPRESENTATIVE ITEMS */}
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:18,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 4px"}}>Representative items</h3>
                <p style={{color:"#6d6a61",fontSize:11,margin:"0 0 14px"}}>Two example items are enough to understand how your restaurant fits the app.</p>
                {[["Item 1","Default pick",s1,setS1],["Item 2","Lighter option",s2,setS2]].map(([title,badge,s,setS],idx)=>
                    <div key={idx} style={{padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6",marginBottom:idx===0?10:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><strong style={{fontSize:12}}>{title}</strong><span style={tag}>{badge}</span></div>
                        <p style={{color:"#6d6a61",fontSize:10,margin:"0 0 10px"}}>{idx===0?"Use a strong representative item that might appear as a top pick.":"A lighter or secondary item to show range."}</p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            <div style={{gridColumn:"1/-1"}}><AF label="Item name" value={s.name} onChange={us(setS,"name")} ph={idx===0?"e.g. Signature Chicken Wrap":"e.g. Green Power Bowl"}/></div>
                            <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Category</label>
                                <select value={s.cat} onChange={e=>setS(p=>({...p,cat:e.target.value}))} style={{...inp,padding:"10px 12px",fontSize:11}}>{catOpts.map(c=><option key={c}>{c}</option>)}</select></div>
                            <AF label="Price ($)" value={s.price} onChange={us(setS,"price")} ph="14.99"/>
                            <AF label="Protein (g)" value={s.protein} onChange={us(setS,"protein")} ph="38"/>
                            <AF label="Calories" value={s.cal} onChange={us(setS,"cal")} ph="520"/>
                            <AF label="Sodium (mg)" value={s.sodium} onChange={us(setS,"sodium")} ph="890"/>
                        </div>
                        <div style={{marginTop:6}}>
                            <button onClick={()=>flash("Image upload → GridFS")} style={{...pill,padding:"6px 10px",fontSize:10}}>📷 Upload item image</button>
                        </div>
                    </div>
                )}
            </div>

            {/* BEFORE YOU SUBMIT */}
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:18,marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:800,margin:"0 0 4px"}}>Before you submit</h3>
                <p style={{color:"#6d6a61",fontSize:11,margin:"0 0 14px"}}>These checks keep the flow clear and set the admin-reviewed expectation.</p>
                <div style={{display:"grid",gap:8}}>
                    <label style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px 14px",borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6",cursor:"pointer"}}>
                        <input type="checkbox" checked={arCheck1} onChange={e=>setArCheck1(e.target.checked)} style={{accentColor:"#3a8f5c",width:18,height:18,marginTop:2,flexShrink:0}}/>
                        <span><strong style={{fontSize:12}}>I can provide an official source for current menu data</strong><br/><span style={{color:"#6d6a61",fontSize:10}}>This can be a nutrition PDF, menu link, or official export.</span></span>
                    </label>
                    <label style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px 14px",borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6",cursor:"pointer"}}>
                        <input type="checkbox" checked={arCheck2} onChange={e=>setArCheck2(e.target.checked)} style={{accentColor:"#3a8f5c",width:18,height:18,marginTop:2,flexShrink:0}}/>
                        <span><strong style={{fontSize:12}}>I understand this is reviewed before launch</strong><br/><span style={{color:"#6d6a61",fontSize:10}}>Nothing goes live directly from this request page.</span></span>
                    </label>
                </div>
                <div style={{display:"flex",gap:8,marginTop:14}}>
                    <button onClick={submitAddRest} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c",padding:"12px 20px",fontSize:12,width:"100%",textAlign:"center"}}>Request review</button>
                </div>
            </div>
        </>;}

    // Main owner profile
    return(<>
        <button onClick={goMain} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back</button>

        {/* IDENTITY */}
        <div style={{background:"linear-gradient(135deg,#f7f0e4,#f3ede0)",border:"1px solid #e0d5c0",borderRadius:22,padding:20,marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"64px 1fr",gap:14,alignItems:"center",marginBottom:12}}>
                <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#a86a13,#d4923c)",display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:24}}>{ini(user.name||user.email)}</div>
                <div><h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.3rem,2.5vw,1.8rem)",margin:0,letterSpacing:"-0.03em"}}>{user.name}</h1><p style={{margin:"4px 0 0",color:"#6d6a61",fontSize:11}}>{user.email}{user.phone?` · ${user.phone}`:""}</p></div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{...tag,background:"#fef3cd",borderColor:"#fde68a",color:"#92400e"}}>Restaurant owner</span>
                {(user.rests||[]).map((r,i)=><span key={i} style={{...tag,...(r.verified?{background:"#edf5ef",color:"#274b37"}:{background:"#fef3cd",color:"#856404"})}}>{r.name}: {r.verified?"Verified":"Pending"}</span>)}
                <span style={tag}>{pendingTodos.length} tasks pending</span>
            </div>
        </div>

        {/* MANAGED RESTAURANTS */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
                <h2 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Your restaurants</h2>
                <button onClick={()=>setSub("addRestaurant")} style={{...pill,padding:"6px 10px",fontSize:10,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>+ Add restaurant</button>
            </div>
            {arSubmitted&&<div style={{padding:10,borderRadius:12,background:"#fef3cd",border:"1px solid #fde68a",fontSize:11,marginBottom:10}}><strong>Pending:</strong> {arName} — submitted for admin review.</div>}
            <div style={{display:"grid",gap:10}}>
                {(user.rests||[]).map((r,i)=>{const rd=R.find(x=>x.name===r.name);return <div key={i} style={{padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div><strong style={{fontSize:14}}>{r.name}</strong><br/><span style={{color:"#6d6a61",fontSize:10}}>{r.type} · {(r.tags||[]).join(", ")}</span></div>
                        <span style={{...tag,...(r.verified?{background:"#edf5ef",color:"#274b37"}:{background:"#fef3cd",color:"#856404"})}}>{r.verified?"Verified":"Pending review"}</span>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                        <span style={tag}>{r.ic} items</span>
                        <span style={tag}>PDF: {r.pdfStatus}</span>
                        <span style={tag}>{r.pt} tasks pending</span>
                        {r.ct>0&&<span style={{...tag,background:"#edf5ef",color:"#274b37"}}>{r.ct} completed</span>}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                        {rd&&<button onClick={()=>goRest(r.name)} style={{...pill,padding:"7px 12px",fontSize:10}}>View menu</button>}
                        {(user.perms||[]).map((p,j)=><span key={j} style={{...tag,fontSize:8,textTransform:"uppercase"}}>{p.replace(/_/g," ")}</span>)}
                    </div>
                </div>})}
            </div>
        </div>

        {/* TO-DO LIST */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>To-do</h2>
            <p style={{margin:"0 0 12px",color:"#6d6a61",fontSize:10}}>{pendingTodos.length} tasks from admin</p>

            {pendingTodos.length>0?<div style={{display:"grid",gap:8}}>
                {pendingTodos.map(t=><div key={t.id} style={{padding:"10px 14px",borderRadius:14,background:"#fef8ee",border:"1px solid #fde68a"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                            <span style={{fontSize:14,flexShrink:0}}>{t.item?"🍽️":"🏪"}</span>
                            <div style={{minWidth:0}}>
                                <div style={{fontWeight:700,fontSize:11,lineHeight:1.2}}>{t.desc}</div>
                                <div style={{color:"#6d6a61",fontSize:10,marginTop:1}}>{t.item?`Item: ${t.item}${t.cat?` · ${t.cat}`:""}`:"Restaurant-level request"}</div>
                            </div>
                        </div>
                        <span style={{...tag,fontSize:8,flexShrink:0}}>{t.item?"Item":"Restaurant"}</span>
                    </div>
                    {t.adminNote&&<p style={{fontSize:10,color:"#3a8f5c",margin:"4px 0 0",fontStyle:"italic",padding:"6px 8px",borderRadius:8,background:"#edf5ef"}}>Admin: {t.adminNote}</p>}
                    <button onClick={()=>setActiveTask(t.id)} style={{...pill,padding:"6px 10px",fontSize:10,marginTop:6,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Complete — upload PDF</button>
                </div>)}
            </div>:<div style={{textAlign:"center",padding:16,color:"#6d6a61",fontSize:11}}>No tasks from admin. You're up to date.</div>}
        </div>

        {/* YOUR REQUESTS — status of submitted change requests */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
                <h2 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Your requests</h2>
                <button onClick={()=>setSub("changeRequest")} style={{...pill,padding:"6px 10px",fontSize:10}}>+ New request</button>
            </div>
            {sub==="changeRequest"&&<div style={{padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6",marginBottom:10}}>
                <h4 style={{margin:"0 0 8px",fontSize:12}}>Request a change</h4>
                <div style={{display:"grid",gap:8}}>
                    <div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>What do you want to change?</label>
                        <select value={crType} onChange={e=>setCrType(e.target.value)} style={{...inp,padding:"10px 12px",fontSize:11}}>
                            <optgroup label="Restaurant">
                                <option value="rest_url">Restaurant URL source</option>
                                <option value="rest_description">Restaurant description</option>
                                <option value="rest_image">Restaurant image</option>
                                <option value="rest_pdf">Restaurant nutritional PDF</option>
                            </optgroup>
                            <optgroup label="Menu item">
                                <option value="item_image">Menu item image</option>
                                <option value="item_nutrition">Menu item nutritional data</option>
                            </optgroup>
                        </select></div>
                    {crType.startsWith("item_")&&<div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Which item?</label>
                        <input value={crItemName} onChange={e=>setCrItemName(e.target.value)} placeholder="e.g. Steak Frites" style={{...inp,padding:"10px 12px",fontSize:11}}/></div>}
                    <div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Details</label>
                        <textarea value={crDesc} onChange={e=>setCrDesc(e.target.value)} placeholder="Describe the change and why it's needed." style={{...inp,minHeight:60,resize:"vertical",fontSize:12,padding:"10px 12px"}}/></div>
                    <div style={{border:"2px dashed #e4ddd0",borderRadius:14,padding:14,background:"#fcfbf8",display:"flex",alignItems:"center",gap:10}}>
                        <button onClick={()=>flash("PDF upload → MongoDB GridFS")} style={{...pill,padding:"7px 12px",fontSize:10}}>📄 Attach PDF</button>
                        <span style={{color:"#6d6a61",fontSize:10}}>Required — all change requests must include a PDF.</span>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setSub(null)} style={pill}>Cancel</button>
                        <button onClick={()=>{if(!crDesc){flash("Add a description");return}onCreateChangeRequest?.({restaurantName:(user.rests||[])[0]?.name||"",type:crType,itemName:crItemName,note:crDesc});setCrDesc("");setCrItemName("");setSub(null);flash("Request submitted — admin will review.")}} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Submit request</button>
                    </div>
                </div>
            </div>}
            {myRequests.length>0?<div style={{display:"grid",gap:6}}>
                {myRequests.map((r,i)=><div key={i} style={{padding:"10px 14px",borderRadius:14,border:"1px solid #e4ddd0",background:"white"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                        <div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:11}}>{r.desc.length>70?r.desc.slice(0,70)+"...":r.desc}</div><div style={{color:"#6d6a61",fontSize:10,marginTop:1}}>{r.type.replace(/_/g," ")}</div></div>
                        <span style={{...tag,flexShrink:0,...(r.status==="approved"?{background:"#edf5ef",color:"#274b37"}:r.status==="denied"?{background:"#fef2f2",color:"#991b1b"}:{background:"#fef3cd",color:"#856404"})}}>{r.status}</span>
                    </div>
                    {r.adminNote&&<p style={{fontSize:10,color:"#3a8f5c",margin:"4px 0 0",fontStyle:"italic"}}>Admin: {r.adminNote}</p>}
                </div>)}
            </div>:<div style={{color:"#6d6a61",fontSize:11,textAlign:"center",padding:12}}>No requests yet.</div>}
        </div>

        {/* ACCOUNT */}
        <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
            <h2 style={{margin:"0 0 10px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Account details</h2>
            <div style={{display:"grid",gap:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{padding:12,borderRadius:14,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800,textTransform:"uppercase"}}>Name</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{user.name}</div></div>
                    <div style={{padding:12,borderRadius:14,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800,textTransform:"uppercase"}}>Email</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{user.email}</div></div>
                    <div style={{padding:12,borderRadius:14,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800,textTransform:"uppercase"}}>Phone</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{user.phone||"Not set"}</div></div>
                    <div style={{padding:12,borderRadius:14,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800,textTransform:"uppercase"}}>Role</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>Restaurant owner</div></div>
                </div>
                <div style={{padding:12,borderRadius:14,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><strong style={{fontSize:11}}>What we store</strong><p style={{margin:"4px 0 0",color:"#6d6a61",fontSize:10,lineHeight:1.4}}>Your name, email, phone, managed restaurants, submitted PDFs, and item edits. No payment or location data.</p></div>
                <button onClick={doLogout} style={{...pill,width:"100%",textAlign:"center",padding:"11px 16px",fontSize:12,color:"#9e4c3b"}}>Log out</button>
            </div>
        </div>
    </>);
}

// ── ADMIN VIEW ──
function AdminView({user,goMain,doLogout,flash,adminQ,setAdminQ,onSendTask}){
    const[tab,setTab]=useState("requests");
    const queue=adminQ;
    const setQueue=setAdminQ;
    // Send task form state
    const[showSendTask,setShowSendTask]=useState(false);
    const[stRest,setStRest]=useState("");const[stItem,setStItem]=useState("");const[stType,setStType]=useState("");const[stNote,setStNote]=useState("");
    const stItems=useMemo(()=>stRest?ALL.filter(it=>it.r===stRest).map(it=>it.n):[], [stRest]);
    const restTypes=["Request restaurant image","Request restaurant description","Request website source","Request nutritional PDF"];
    const itemTypes=["Request item image","Request nutritional PDF","Request item description"];

    const updateStatus=(section,id,status)=>{
        setQueue(p=>({...p,[section]:p[section].map(r=>r.id===id?{...r,status,reviewedAt:new Date().toISOString(),reviewedBy:user.id||user.userId}:r)}));
        flash(status==="approved"?"Approved!":status==="denied"?"Denied.":"Updated.");
    };
    const sendTask=()=>{
        if(!stRest||!stType){flash("Pick a restaurant and request type");return}
        onSendTask?.({restaurantName:stRest,itemName:stItem,requestType:stType,note:stNote});
        flash(`Task sent to ${stRest} owner${stItem?` for ${stItem}`:""}: ${stType}`);
        setShowSendTask(false);setStRest("");setStItem("");setStType("");setStNote("");
    };

    const tabs=[["requests","Requests",queue.rr.filter(r=>r.status==="pending").length+queue.role.filter(r=>r.status==="pending").length],
        ["changes","Changes",queue.cr.filter(r=>r.status==="pending").length],
        ["issues","Issues",queue.issues.filter(r=>r.status==="open").length],
        ["send","Send task",0],
        ["all","History",0]];

    const SB=({s})=><span style={{...tag,fontSize:8,...(s==="approved"||s==="resolved"?{background:"#edf5ef",color:"#274b37"}:s==="denied"?{background:"#fef2f2",color:"#991b1b"}:{background:"#fef3cd",color:"#856404"})}}>{s}</span>;

    return(<>
        <button onClick={goMain} style={{...pill,padding:"7px 11px",fontSize:11,marginBottom:14}}>← Back</button>
        {/* HEADER */}
        <div style={{background:"linear-gradient(135deg,#1b2a20,#2d4a36)",borderRadius:22,padding:20,marginBottom:16,color:"white"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                    <div style={{width:56,height:56,borderRadius:18,background:"rgba(255,255,255,0.15)",display:"grid",placeItems:"center",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:22}}>{ini(user.name)}</div>
                    <div><h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.3rem,2.5vw,1.8rem)",margin:0}}>{user.name}</h1><p style={{margin:"4px 0 0",opacity:0.7,fontSize:11}}>{user.email} · Admin</p></div>
                </div>
                <button onClick={doLogout} style={{padding:"8px 14px",borderRadius:999,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",color:"white",fontWeight:700,fontSize:11,cursor:"pointer"}}>Log out</button>
            </div>
        </div>
        {/* TABS */}
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
            {tabs.map(([k,label,count])=><button key={k} onClick={()=>setTab(k)} style={{...chp,fontSize:10,padding:"7px 12px",...(tab===k?{background:"#1b2a20",color:"white",borderColor:"#1b2a20"}:{})}}>{label}{count>0?` (${count})`:""}</button>)}
        </div>

        {/* ── REQUESTS TAB ── */}
        {tab==="requests"&&<>
            {/* RESTAURANT REQUESTS */}
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
                <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Restaurant requests</h2>
                <p style={{margin:"0 0 12px",color:"#6d6a61",fontSize:10}}>Owners requesting to add a new restaurant.</p>
                {queue.rr.filter(r=>r.status==="pending").length===0&&<p style={{color:"#6d6a61",fontSize:11,textAlign:"center",padding:12}}>No pending requests.</p>}
                <div style={{display:"grid",gap:14}}>
                    {queue.rr.filter(r=>r.status==="pending").map(r=><div key={r.id} style={{borderRadius:18,border:"1px solid #fde68a",background:"#fef8ee",overflow:"hidden"}}>
                        {/* Header */}
                        <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #fde68a"}}>
                            <h3 style={{margin:0,fontSize:16,fontFamily:"'Fraunces',serif"}}>{r.rest}</h3>
                            <SB s={r.status}/>
                        </div>
                        <div style={{padding:16}}>
                            {/* Business details grid */}
                            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#6d6a61",marginBottom:6}}>Business details</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Owner</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.owner}</div></div>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Role</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.role}</div></div>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Email</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.email}</div></div>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Phone</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.phone||"—"}</div></div>
                                {r.web&&<div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6",gridColumn:"1/-1"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Website</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.web}</div></div>}
                            </div>
                            {/* Menu note */}
                            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#6d6a61",marginBottom:6}}>Menu description</div>
                            <p style={{fontSize:12,margin:"0 0 14px",padding:12,borderRadius:12,background:"white",border:"1px solid #e9e3d6",lineHeight:1.4}}>{r.note}</p>
                            {/* Sources */}
                            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#6d6a61",marginBottom:6}}>Official sources & images</div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                                <button onClick={()=>flash(`Opening PDF: ${r.pdf}`)} style={{...pill,padding:"8px 12px",fontSize:10}}>📄 Open nutrition PDF</button>
                                {r.menuUrl&&<button onClick={()=>flash(`Opening: ${r.menuUrl}`)} style={{...pill,padding:"8px 12px",fontSize:10}}>🔗 Menu URL</button>}
                                {r.hasImage&&<button onClick={()=>flash("Opening restaurant image")} style={{...pill,padding:"8px 12px",fontSize:10}}>📷 View image</button>}
                            </div>
                            {/* Sample items */}
                            {r.samples&&r.samples.length>0&&<>
                                <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#6d6a61",marginBottom:6}}>Sample items</div>
                                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:14}}>
                                    {r.samples.map((s,i)=><div key={i} style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}>
                                        <div style={{fontWeight:800,fontSize:12,marginBottom:2}}>{s.name}</div>
                                        <div style={{color:"#6d6a61",fontSize:10,marginBottom:4}}>{s.cat}{s.price?` · $${s.price}`:""}</div>
                                        <div style={{display:"flex",gap:4}}><span style={tag}>{s.protein}P</span><span style={tag}>{s.cal}Cal</span></div>
                                    </div>)}
                                </div>
                            </>}
                            <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid #e9e3d6"}}>
                                <button onClick={()=>updateStatus("rr",r.id,"approved")} style={{...pill,padding:"9px 16px",fontSize:11,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Approve</button>
                                <button onClick={()=>updateStatus("rr",r.id,"denied")} style={{...pill,padding:"9px 16px",fontSize:11,color:"#991b1b"}}>Deny</button>
                            </div>
                        </div>
                    </div>)}
                </div>
            </div>

            {/* ROLE REQUESTS */}
            <div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16,marginBottom:14}}>
                <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Role requests</h2>
                <p style={{margin:"0 0 12px",color:"#6d6a61",fontSize:10}}>Users requesting restaurant owner access.</p>
                {queue.role.filter(r=>r.status==="pending").length===0&&<p style={{color:"#6d6a61",fontSize:11,textAlign:"center",padding:12}}>No pending.</p>}
                <div style={{display:"grid",gap:10}}>
                    {queue.role.filter(r=>r.status==="pending").map(r=><div key={r.id} style={{borderRadius:16,border:"1px solid #fde68a",background:"#fef8ee",overflow:"hidden"}}>
                        <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #fde68a"}}>
                            <h3 style={{margin:0,fontSize:14}}>{r.user} — {r.rest}</h3>
                            <SB s={r.status}/>
                        </div>
                        <div style={{padding:16}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Name</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.user}</div></div>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Email</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.email}</div></div>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Franchise</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.rest}</div></div>
                                <div style={{padding:10,borderRadius:12,background:"white",border:"1px solid #e9e3d6"}}><div style={{color:"#6d6a61",fontSize:9,fontWeight:800}}>Role claimed</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{r.role}</div></div>
                            </div>
                            <p style={{fontSize:12,margin:"0 0 12px",padding:12,borderRadius:12,background:"white",border:"1px solid #e9e3d6",lineHeight:1.4}}>{r.note}</p>
                            <div style={{display:"flex",gap:6}}>
                                <button onClick={()=>updateStatus("role",r.id,"approved")} style={{...pill,padding:"9px 16px",fontSize:11,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Approve</button>
                                <button onClick={()=>updateStatus("role",r.id,"denied")} style={{...pill,padding:"9px 16px",fontSize:11,color:"#991b1b"}}>Deny</button>
                            </div>
                        </div>
                    </div>)}
                </div>
            </div>
        </>}

        {/* ── CHANGES TAB ── */}
        {tab==="changes"&&<div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16}}>
            <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Owner change requests</h2>
            <p style={{margin:"0 0 12px",color:"#6d6a61",fontSize:10}}>Owners requesting changes to their listing. Each includes a PDF.</p>
            {queue.cr.length===0&&<p style={{color:"#6d6a61",fontSize:11,textAlign:"center",padding:12}}>No change requests.</p>}
            <div style={{display:"grid",gap:10}}>
                {queue.cr.map(r=><div key={r.id} style={{padding:14,borderRadius:16,border:"1px solid #e4ddd0",background:r.status==="pending"?"#fef8ee":"white"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div><strong style={{fontSize:13}}>{r.rest}</strong> · <span style={{color:"#6d6a61",fontSize:10}}>{r.type.replace(/_/g," ")} · {r.owner}</span></div>
                        <SB s={r.status}/>
                    </div>
                    <p style={{fontSize:11,margin:"0 0 8px",lineHeight:1.4}}>{r.desc}</p>
                    <div style={{display:"flex",gap:6,marginBottom:r.status==="pending"?10:0}}>
                        {r.pdf&&<button onClick={()=>flash(`Opening: ${r.pdf}`)} style={{...pill,padding:"7px 12px",fontSize:10}}>📄 Open PDF</button>}
                    </div>
                    {r.status==="pending"&&<div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid #e9e3d6"}}>
                        <button onClick={()=>updateStatus("cr",r.id,"approved")} style={{...pill,padding:"9px 16px",fontSize:11,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Approve</button>
                        <button onClick={()=>updateStatus("cr",r.id,"denied")} style={{...pill,padding:"9px 16px",fontSize:11,color:"#991b1b"}}>Deny</button>
                    </div>}
                </div>)}
            </div>
        </div>}

        {/* ── SEND TASK TAB ── */}
        {tab==="send"&&<div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:18}}>
            <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Send task to owner</h2>
            <p style={{margin:"0 0 16px",color:"#6d6a61",fontSize:10}}>Pick a franchise, optionally a menu item, then choose what you need from the owner.</p>
            <div style={{display:"grid",gap:12}}>
                {/* Step 1: Franchise */}
                <div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Franchise</label>
                    <select value={stRest} onChange={e=>{setStRest(e.target.value);setStItem("");setStType("")}} style={{...inp,padding:"12px 14px",fontSize:12}}>
                        <option value="">Select a franchise...</option>
                        {RNAMES.map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                {/* Step 2: Optional item */}
                {stRest&&<div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Menu item <span style={{fontWeight:400,color:"#6d6a61"}}>(optional — leave blank for restaurant-level request)</span></label>
                    <select value={stItem} onChange={e=>{setStItem(e.target.value);setStType("")}} style={{...inp,padding:"12px 14px",fontSize:12}}>
                        <option value="">No item — restaurant-level request</option>
                        {stItems.map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                </div>}

                {/* Step 3: Request type (changes based on item selection) */}
                {stRest&&<div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>What do you need?</label>
                    <div style={{display:"grid",gap:6}}>
                        {(stItem?itemTypes:restTypes).map(t=><label key={t} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 14px",borderRadius:14,border:"1px solid "+(stType===t?"#3a8f5c":"#e4ddd0"),background:stType===t?"#edf5ef":"white",cursor:"pointer"}}>
                            <input type="radio" name="taskType" checked={stType===t} onChange={()=>setStType(t)} style={{accentColor:"#3a8f5c"}}/>
                            <span style={{fontSize:12,fontWeight:stType===t?700:400}}>{t}</span>
                        </label>)}
                    </div>
                </div>}

                {/* Step 4: Notes */}
                {stType&&<div><label style={{display:"block",fontSize:12,fontWeight:800,marginBottom:5}}>Admin notes <span style={{fontWeight:400,color:"#6d6a61"}}>(visible to the owner)</span></label>
                    <textarea value={stNote} onChange={e=>setStNote(e.target.value)} placeholder="e.g. The current protein value for Rib Eye looks too high at 100g — please verify against your nutrition sheet and send the relevant PDF page." style={{...inp,minHeight:80,resize:"vertical",fontSize:12,padding:"12px 14px"}}/>
                </div>}

                {/* Summary + send */}
                {stType&&<div style={{padding:14,borderRadius:16,background:"#f7f4ec",border:"1px solid #e9e3d6"}}>
                    <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#6d6a61",marginBottom:6}}>Task summary</div>
                    <div style={{display:"grid",gap:4,fontSize:12}}>
                        <div><span style={{color:"#6d6a61"}}>Franchise:</span> <strong>{stRest}</strong></div>
                        {stItem&&<div><span style={{color:"#6d6a61"}}>Item:</span> <strong>{stItem}</strong></div>}
                        <div><span style={{color:"#6d6a61"}}>Request:</span> <strong>{stType}</strong></div>
                        {stNote&&<div><span style={{color:"#6d6a61"}}>Note:</span> {stNote}</div>}
                    </div>
                </div>}

                {stType&&<button onClick={sendTask} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c",padding:"12px 20px",fontSize:12,width:"100%",textAlign:"center"}}>Send task to {stRest} owner</button>}
            </div>
        </div>}

        {/* ── ISSUES TAB ── */}
        {tab==="issues"&&<div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16}}>
            <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Reported issues</h2>
            <p style={{margin:"0 0 12px",color:"#6d6a61",fontSize:10}}>User-reported problems. Review, add notes, then send fix tasks to owners via the Send task tab.</p>
            <div style={{display:"grid",gap:10}}>
                {queue.issues.map(r=><div key={r.id} style={{padding:14,borderRadius:16,border:"1px solid #e4ddd0",background:r.status==="open"?"#fef8ee":"white"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div><strong style={{fontSize:12}}>{r.item}</strong><br/><span style={{color:"#6d6a61",fontSize:10}}>{r.type} · {r.user} · {r.rest}</span></div><SB s={r.status}/></div>
                    <p style={{fontSize:11,margin:"0 0 6px",padding:8,borderRadius:10,background:"#f7f4ec",border:"1px solid #e9e3d6"}}>"{r.note}"</p>
                    {r.adminNote&&<p style={{fontSize:10,color:"#3a8f5c",margin:"0 0 4px",fontStyle:"italic"}}>Admin: {r.adminNote}</p>}
                    {r.status==="open"&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
                        <button onClick={()=>updateStatus("issues",r.id,"resolved")} style={{...pill,padding:"6px 10px",fontSize:9,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}}>Mark resolved</button>
                        <button onClick={()=>{setTab("send");setStRest(r.rest);setStItem(r.item?r.item.split("::")[1]||"":"")}} style={{...pill,padding:"6px 10px",fontSize:9}}>Create task for owner →</button>
                    </div>}

                </div>)}
            </div>
        </div>}

        {/* ── HISTORY TAB ── */}
        {tab==="all"&&<div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:22,padding:16}}>
            <h2 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>All activity</h2>
            <p style={{margin:"0 0 12px",color:"#6d6a61",fontSize:10}}>Complete history of processed requests.</p>
            <div style={{display:"grid",gap:6}}>
                {[...queue.rr.filter(r=>r.status!=="pending").map(r=>({...r,_t:"Restaurant",_w:r.owner,_n:r.rest})),
                    ...queue.role.filter(r=>r.status!=="pending").map(r=>({...r,_t:"Role",_w:r.user||r.owner,_n:r.rest})),
                    ...queue.cr.filter(r=>r.status!=="pending").map(r=>({...r,_t:"Change",_w:r.owner,_n:r.rest})),
                    ...queue.issues.filter(r=>r.status==="resolved").map(r=>({...r,_t:"Issue",_w:r.user,_n:r.item}))
                ].map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:12,border:"1px solid #e4ddd0",fontSize:11}}>
                    <div><strong>{r._t}:</strong> {r._n} <span style={{color:"#6d6a61"}}>· {r._w}</span>{r.adminNote&&<span style={{color:"#3a8f5c",fontSize:10}}> — {r.adminNote}</span>}</div>
                    <SB s={r.status}/>
                </div>)}
            </div>
        </div>}
    </>);
}

// ── MAIN / GALLERY / SEARCH ──
const ML={best:"Best Value",protein:"Protein",lowCal:"Low Cal",lowSodium:"Low Sodium"};
const MD={best:"Highest protein per calorie.",protein:"Raw protein leaders.",lowCal:"Most protein, fewest calories.",lowSodium:"Lowest sodium picks."};
const MODES=["best","protein","lowCal","lowSodium"];
function Chips({mode,setMode,setExp}){return <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:3}}>{MODES.map(m=><button key={m} onClick={()=>{setMode(m);setExp?.(null)}} style={{...chp,...(m===mode?{background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}:{})}}>{ML[m]}</button>)}</div>}

function MainView({mode,setMode,filtered,exp,setExp,goGallery,saved,toggleSave,user,goLogin,goRest,goItem,mob}){
    const hero=filtered[0];const qp=filtered.slice(1,4);const r1=filtered.slice(0,6);const r2=filtered.slice(6,12);
    return(<><Chips mode={mode} setMode={setMode} setExp={setExp}/>
        {hero&&<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1.4fr 1fr",gap:12,marginBottom:18}}>
            <div style={{background:"linear-gradient(135deg,#1b2a20,#2d4a36)",borderRadius:22,padding:22,color:"white",display:"flex",flexDirection:"column",justifyContent:"flex-end",minHeight:260,position:"relative"}}>
                <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.1)",borderRadius:999,padding:"5px 9px",fontSize:10,fontWeight:800}}>{ML[mode]} Pick</div>
                <div style={{marginTop:"auto"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",opacity:0.65,marginBottom:4}}>{hero.cat} · {hero.r}</div>
                    <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.4rem,3vw,2rem)",lineHeight:0.98,margin:"0 0 8px",letterSpacing:"-0.04em",fontWeight:900}}>{hero.n}</h1>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{[`${hero.p}P`,`${hero.c} Cal`,`${fpc(hero.ppc)}% P/Cal`].map((s,i)=><span key={i} style={{background:"rgba(255,255,255,0.1)",borderRadius:999,padding:"5px 9px",fontSize:10,fontWeight:700}}>{s}</span>)}</div>
                    <p style={{fontSize:11,opacity:0.7,lineHeight:1.35,margin:0}}>{MD[mode]}</p>
                </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.92)",border:"1px solid #e4ddd0",borderRadius:22,padding:14,display:"flex",flexDirection:"column",gap:8}}>
                <h2 style={{margin:0,fontSize:13,fontWeight:800}}>Quick picks</h2>
                {qp.map((it,i)=><QP key={i} it={it} i={i}/>)}
            </div>
        </div>}
        <Sec title={ML[mode]+" Rankings"} sub="Top items across 8 franchises" onSeeAll={()=>goGallery(mode)}>
            <Scroll>{r1.map((it,i)=><Card key={i} it={it} rank={i+1} ci={i} exp={exp===`a${i}`} toggle={()=>setExp(exp===`a${i}`?null:`a${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}</Scroll>
        </Sec>
        {r2.length>0&&<Sec title="More picks" onSeeAll={()=>goGallery(mode)}>
            <Scroll>{r2.map((it,i)=><Card key={i} it={it} rank={i+7} ci={i+4} exp={exp===`b${i}`} toggle={()=>setExp(exp===`b${i}`?null:`b${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}</Scroll>
        </Sec>}
        <Sec title="Restaurants" sub={`${R.length} franchises · ${R.reduce((a,r)=>a+r.ic,0)} items`}>
            <Scroll>{R.map((r,i)=><div key={i} onClick={()=>goRest(r.name)} style={{background:"rgba(255,255,255,0.92)",border:"1px solid #e4ddd0",borderRadius:18,overflow:"hidden",minWidth:200,cursor:"pointer",transition:"transform 0.12s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                <div style={{height:60,background:`linear-gradient(135deg,${C[i%8]}12,${C[i%8]}06)`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:36,height:36,borderRadius:11,background:`linear-gradient(135deg,${C[i%8]},${C[i%8]}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900}}>{ini(r.name)}</div></div>
                <div style={{padding:10}}><div style={{fontWeight:800,fontSize:12,marginBottom:2}}>{r.name}</div><div style={{color:"#6d6a61",fontSize:10}}>{r.ic} items · avg {r.avgP}g protein</div></div>
            </div>)}</Scroll>
        </Sec>
        {!user&&<div style={{background:"linear-gradient(135deg,#f0f7f2,#e8f0e3)",border:"1px solid #d5e2d8",borderRadius:22,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap",marginTop:14}}>
            <div><h3 style={{margin:0,fontSize:14,fontWeight:800}}>Save meals you like</h3><p style={{margin:"3px 0 0",color:"#6d6a61",fontSize:12}}>Log in to keep favorites and come back later.</p></div>
            <button onClick={goLogin} style={{...pill,background:"#3a8f5c",color:"white",borderColor:"#3a8f5c",padding:"9px 16px",fontSize:12}}>Log in</button>
        </div>}
    </>);
}
function GalleryView({mode,setMode,filtered,exp,setExp,goMain,saved,toggleSave,goItem}){
    return(<><Chips mode={mode} setMode={setMode} setExp={setExp}/>
        <div style={{background:"rgba(255,255,255,0.92)",border:"1px solid #e4ddd0",borderRadius:20,padding:16,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><button onClick={goMain} style={{...pill,padding:"7px 11px",fontSize:11}}>← Back</button><span style={{...tag,fontSize:11}}>{filtered.length} items</span></div>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:"clamp(1.2rem,2vw,1.6rem)",margin:"0 0 2px"}}>{ML[mode]} Rankings</h1><p style={{margin:0,color:"#6d6a61",fontSize:11}}>{MD[mode]}</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:12}}>{filtered.map((it,i)=><Card key={i} it={it} rank={i+1} ci={i} exp={exp===`g${i}`} toggle={()=>setExp(exp===`g${i}`?null:`g${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}</div>
    </>);
}
function SearchView({results,filters,setFilters,exp,setExp,goMain,afc,search,saved,toggleSave,goItem,mob}){
    const uf=(k,v)=>setFilters(p=>({...p,[k]:v}));const toggleCat=(c)=>setFilters(p=>({...p,cats:p.cats.includes(c)?p.cats.filter(x=>x!==c):[...p.cats,c]}));const clearAll=()=>setFilters({...defFilters});
    const sL={best:"Best Value",protein:"Highest Protein",lowCal:"Lowest Calories",lowSodium:"Lowest Sodium"};
    return(<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"260px 1fr",gap:14,alignItems:"start"}}>
        <aside style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:20,padding:14,position:"sticky",top:60}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h2 style={{margin:0,fontSize:13,fontWeight:800,fontFamily:"'Fraunces',serif"}}>Filters</h2><button onClick={clearAll} style={{...pill,padding:"4px 9px",fontSize:9,color:"#9e4c3b"}}>Clear all</button></div>
            <FG title="Sort by"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(sL).map(([k,v])=><button key={k} onClick={()=>uf("sort",filters.sort===k?"":k)} style={{...chp,fontSize:9,padding:"5px 8px",...(filters.sort===k?{background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}:{})}}>{v}</button>)}</div></FG>
            <FG title="Macros"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}><Fl label="Min protein (g)" value={filters.minP} onChange={v=>uf("minP",v)}/><Fl label="Max calories" value={filters.maxCal} onChange={v=>uf("maxCal",v)}/><Fl label="Max sodium (mg)" value={filters.maxSod} onChange={v=>uf("maxSod",v)}/><Fl label="Max sugar (g)" value={filters.maxSug} onChange={v=>uf("maxSug",v)}/></div></FG>
            <FG title="Restaurant"><select value={filters.rest} onChange={e=>uf("rest",e.target.value)} style={{...inp,padding:"6px 9px",fontSize:10}}><option value="">All</option>{RNAMES.map(n=><option key={n} value={n}>{n}</option>)}</select></FG>
            <FG title="Categories"><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{GCATS.map(c=><button key={c} onClick={()=>toggleCat(c)} style={{...chp,fontSize:9,padding:"4px 8px",...(filters.cats.includes(c)?{background:"#3a8f5c",color:"white",borderColor:"#3a8f5c"}:{})}}>{c}</button>)}</div></FG>
            <FG title="Data"><label style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:11,background:"#f7f4ec",border:"1px solid #e9e3d6",cursor:"pointer",fontSize:10}}><input type="checkbox" checked={filters.coreOnly} onChange={e=>uf("coreOnly",e.target.checked)} style={{accentColor:"#3a8f5c",width:15,height:15}}/><strong>Require sodium</strong></label></FG>
        </aside>
        <div>
            <div style={{background:"rgba(255,255,255,0.92)",border:"1px solid #e4ddd0",borderRadius:20,padding:12,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:8}}><button onClick={goMain} style={{...pill,padding:"6px 10px",fontSize:10}}>← Back</button><h2 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>{results.length} results</h2></div><span style={{...tag,fontSize:9}}>Sorted by {sL[filters.sort]||"Default"}</span></div>
                {afc>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>{filters.minP&&<AC l={`Min ${filters.minP}g P`} x={()=>uf("minP","")}/>}{filters.maxCal&&<AC l={`Max ${filters.maxCal} cal`} x={()=>uf("maxCal","")}/>}{filters.maxSod&&<AC l={`Max ${filters.maxSod}mg Na`} x={()=>uf("maxSod","")}/>}{filters.maxSug&&<AC l={`Max ${filters.maxSug}g sugar`} x={()=>uf("maxSug","")}/>}{filters.rest&&<AC l={filters.rest} x={()=>uf("rest","")}/>}{filters.cats.map(c=><AC key={c} l={c} x={()=>toggleCat(c)}/>)}{filters.coreOnly&&<AC l="Na required" x={()=>uf("coreOnly",false)}/>}</div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:12}}>{results.slice(0,80).map((it,i)=><Card key={i} it={it} rank={i+1} ci={i} exp={exp===`s${i}`} toggle={()=>setExp(exp===`s${i}`?null:`s${i}`)} saved={saved} toggleSave={toggleSave} goItem={goItem}/>)}</div>
            {results.length===0&&<div style={{textAlign:"center",padding:40,color:"#6d6a61",fontSize:13}}>No items match.</div>}
        </div>
    </div>);
}

// ── SHARED ──
function AC({l,x}){return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:999,fontSize:9,fontWeight:800,background:"#edf5ef",color:"#274b37"}}>{l}<span onClick={x} style={{cursor:"pointer",opacity:0.5}}>✕</span></span>}
function FG({title,children}){return <div style={{paddingTop:10,marginTop:10,borderTop:"1px solid #e9e3d6"}}><div style={{fontSize:10,fontWeight:800,marginBottom:5}}>{title}</div>{children}</div>}
function Fl({label,value,onChange}){return <div><label style={{fontSize:8,fontWeight:800,color:"#6d6a61",display:"block",marginBottom:2}}>{label}</label><input value={value} onChange={e=>onChange(e.target.value)} style={{...inp,fontSize:10,padding:"6px 8px"}} type="number"/></div>}
function QP({it,i}){return <div style={{display:"grid",gridTemplateColumns:"40px 1fr",gap:8,alignItems:"center",padding:6,borderRadius:12,background:"#f7f4ec",border:"1px solid #e9e3d6"}}><div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${C[i%8]}22,${C[i%8]}11)`,display:"grid",placeItems:"center",fontSize:14,fontWeight:900,color:C[i%8],fontFamily:"'Fraunces',serif"}}>{ini(it.r)}</div><div><div style={{fontWeight:700,fontSize:11,lineHeight:1.2,marginBottom:1}}>{it.n}</div><div style={{color:"#6d6a61",fontSize:10,marginBottom:3}}>{it.r}</div><div style={{display:"flex",gap:4}}><span style={tag}>{it.p}P</span><span style={tag}>{it.c}Cal</span></div></div></div>}

function Card({it,rank,ci,exp,toggle,saved,toggleSave,goItem}){
    const cl=C[ci%8];const isSaved=saved?.has(ik(it));
    return(<div style={{background:"rgba(255,255,255,0.94)",border:"1px solid #e4ddd0",borderRadius:18,overflow:"hidden",cursor:"pointer",transition:"transform 0.12s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
        <div style={{height:exp?40:70,background:`linear-gradient(135deg,${cl}10,${cl}05)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 11px",transition:"height 0.15s"}}>
            <span style={{background:"rgba(30,30,25,0.5)",color:"white",borderRadius:999,padding:"3px 7px",fontSize:9,fontWeight:800}}>#{rank}</span>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
                {toggleSave&&<button key={isSaved?"s":"u"} onClick={e=>{e.stopPropagation();toggleSave(it)}} className={isSaved?"save-pop":""} style={{width:28,height:28,borderRadius:999,border:"none",background:isSaved?"#fff1f3":"rgba(255,255,255,0.9)",color:isSaved?"#d24d71":"#6d6a61",cursor:"pointer",fontSize:12,display:"grid",placeItems:"center",transition:"all 0.15s"}}>{isSaved?"♥":"♡"}</button>}
                <div style={{width:28,height:28,borderRadius:9,background:`linear-gradient(135deg,${cl},${cl}cc)`,display:"grid",placeItems:"center",color:"white",fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:12}}>{ini(it.r)}</div>
            </div>
        </div>
        <div style={{padding:10}} onClick={toggle}>
            <div onClick={e=>{if(goItem){e.stopPropagation();goItem(it)}}} style={{fontWeight:800,fontSize:12,lineHeight:1.2,marginBottom:2,cursor:goItem?"pointer":"default"}}>{it.n}{goItem&&<span style={{color:"#3a8f5c",fontSize:9,marginLeft:4}}>→</span>}</div>
            <div style={{color:"#6d6a61",fontSize:10,marginBottom:6}}>{it.r} · {it.cat}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}><span style={{...tag,background:`${cl}10`,color:cl,borderColor:`${cl}20`}}>{it.p}P</span><span style={tag}>{it.c}Cal</span><span style={tag}>{fpc(it.ppc)}%</span></div>
            {exp&&<div style={{marginTop:5,padding:8,borderRadius:10,background:"#f7f4ec",border:"1px solid #e9e3d6",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:10}}>
                <div><span style={{color:"#6d6a61"}}>Fat </span><strong>{it.f}g</strong></div><div><span style={{color:"#6d6a61"}}>Carbs </span><strong>{it.ca}g</strong></div>
                <div><span style={{color:"#6d6a61"}}>Na </span><strong>{it.so?`${it.so}mg`:"N/A"}</strong></div><div><span style={{color:"#6d6a61"}}>Sugar </span><strong>{it.su!=null?`${it.su}g`:"N/A"}</strong></div>
                <div style={{gridColumn:"1/-1"}}><span style={{color:"#6d6a61"}}>Price </span><strong style={{color:"#a86a13"}}>Coming soon</strong></div>
            </div>}
        </div>
    </div>);
}

function Sec({title,sub,onSeeAll,children}){return <section style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8,gap:6}}><div><h2 style={{margin:0,fontSize:15,fontWeight:800,fontFamily:"'Fraunces',serif"}}>{title}</h2>{sub&&<p style={{margin:"2px 0 0",color:"#6d6a61",fontSize:10}}>{sub}</p>}</div>{onSeeAll&&<button onClick={e=>{e.stopPropagation();onSeeAll()}} style={{background:"transparent",border:"none",color:"#3a8f5c",fontWeight:800,fontSize:11,cursor:"pointer"}}>See all →</button>}</div>{children}</section>}
function Scroll({children}){return <div style={{display:"grid",gridAutoFlow:"column",gridAutoColumns:"minmax(230px,270px)",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>{children}</div>}

const pill={border:"1px solid #e4ddd0",background:"rgba(255,255,255,0.88)",color:"#1a1a17",borderRadius:999,padding:"8px 13px",fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"};
const chp={...pill,padding:"7px 11px",fontSize:11,transition:"all 0.1s"};
const tag={background:"#f0ede4",border:"1px solid #e4ddd0",borderRadius:999,padding:"4px 7px",fontSize:9,fontWeight:700,color:"#34312b"};
const inp={width:"100%",padding:"8px 10px",borderRadius:12,border:"1px solid #e4ddd0",outline:"none",background:"white",color:"#1a1a17",fontSize:12,boxSizing:"border-box"};
const bigBtn={width:"100%",padding:"14px 20px",borderRadius:22,border:"none",background:"#3a8f5c",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",textAlign:"center"};
