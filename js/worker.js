self.addEventListener('message',  function(event)
{
    var zones;
    var items;
    var results_table;
    var first_ascend = event.data.ascensionsFirst;
    var ascend_seed = event.data.zoneSeed;
    
    //Account for fake ascensions and ascensions from relics (each relic 'ascends' once)
    for(var i=0;i<first_ascend+event.data.rubyRelic;i++){
        ascend_seed = nextAscensionSeed(ascend_seed);
    }
    
    //If there's a fake ascension then the seed is no longer offset
    if(first_ascend>0){
        event.data.itemReceived = false;
    }
    
    //find all spawn zones
    zones = findSeveralStartZones(event.data.SZ,event.data.HZE,ascend_seed,event.data.numZones);
    
    items = findItems(event.data.ascensionSeed,zones,event.data.itemReceived,event.data.rubyRelic,event.data.HZE,event.data.highestLevelItem);
    
    results_table = createTable(event.data.ascensions+first_ascend,zones, items,event.data.rubyRelic);

    if(event.data.writeToFile){
        var csvRows = [['Ascension','Spawn Zone','Level','Rarity','Ability 1','Ability 2','Ability 3','Ability 4','Rarity_num']];
        
        for(var i=0;i<results_table.length;++i){
            csvRows.push(results_table[i].join(','));
        }

        var csvString = csvRows.join("\r\n");
        postMessage(csvString);
    }else{
        postMessage(results_table);
    }
});

function createTable(ascension_counter, zones, items,relics_purchased)
{
    var dataset = [];
    
    for(var i=0;i<relics_purchased;i++){
        dataset.push(
                [i+1,
                "purchased",
                items[i][0],
                items[i][1],
                items[i][2],
                items[i][3],
                items[i][4],
                items[i][5],
                items[i][6]]);
    }
    for (var i=0; i<zones.length; i++) {
        dataset.push(
                [i+ascension_counter,
                zones[i],
                items[i+relics_purchased][0],
                items[i+relics_purchased][1],
                items[i+relics_purchased][2],
                items[i+relics_purchased][3],
                items[i+relics_purchased][4],
                items[i+relics_purchased][5],
                items[i+relics_purchased][6]]);
    }

    return dataset;
}
function findSeveralStartZones(start, HZE, s, num)
{
    var zones = new Array();
    var previous_seed = 0;
    for(var i=0;i<num;i++) {
        zones[i] = getBonusItemZone(start, HZE, s);
        s = nextAscensionSeed(s);

    }
    return zones;
}
function nextAscensionSeed(seed)
{
    return randNum(randNum(randNum(randNum(seed))));
}
function getBonusItemZone(start, HZE, s)
{
    var tt = 0;
    var seed = 0;
    var zone = 0;
    seed = s;
    tt = Math.ceil(HZE * 0.66);

    if (tt - start <= Math.ceil(tt * 0.3)) {
       tt = start + Math.ceil(tt * 0.3);
    }
    start = Math.max(99, start);
    tt = Math.max(101, tt);
    do {
        seed = randNum(seed);
        zone = range(start, tt, seed);
    }while (zone % 5 == 0);

    return zone;

}
function range(start, finish, seed)
{
    return seed % (finish - start + 1) + start;
}
function randNum(seed) 
{
    return (seed * 16807) % (2147483647);
}
function findItems(s, zones,got_item,relics_to_buy,HZE,highest_level_item)
{
    var seed = s;
    var j = 0;
    var items = [];
    var level;
   
    //Relics bought with rubies
    for(var i=0;i<relics_to_buy;i++){
        level = Math.ceil(50 * (1 - Math.pow(1.2,-((HZE - 100) / 100))));
        level = Math.max(1,level);
        level = Math.min(highest_level_item + 5,level);
        seed = randNum(seed);
        level = range(Math.ceil(level*.75),level,seed);
        seed = generateItem(level,seed,items);
    }
    if(got_item ){
        items.push(["the", "seed", "already", "changed", "cannot", "predict", 99]);
        j=1;
    }

    //Relics from relic ooze
    for (;j<zones.length;j++){
        level = Math.ceil(Math.max(50*(1-Math.pow(1.2,(-(zones[j]-1)/100+1))),1));
        seed = generateItem(level,seed,items);
    }
    
   return items;
}
function generateItem(level, s,items)
{
    var ability_odds = [[6,5,4,3],[6,5,4],[6,5]];
    var rarity_odds = [5000,2000,800,300,100,25,8,1];
    var ability_conv = [1,2,3,4];
    var rarity_conv = ["Common","Uncommon","Rare","Epic","Fabled","Mythical","Legendary","Transcendent"];
    var num_abilities = 0;
    var abilities = [];
    var rarity = "";
    var ability_levels = [];
    var relic_level = 0;
    var level_counter = 0;
    var ability_choices = [];
    var seed = s;

    relic_level = level;

    //find rarity    
    seed = randNum(seed);
    rarity =  weightedChoice(rarity_odds,seed);

    //find num abilities
    seed = randNum(seed);
    num_abilities = relic_level === 1 ? 1 : ability_conv[weightedChoice(ability_odds[Math.max(0,4-relic_level)],seed)];

    //find which abilities
    for(var i=0;i<24;i++){
        ability_choices[i] = i+1 > 22 ? i+2 : i+1;
    }
    for(var i=0;i<num_abilities;i++){
        var choice = 0;
        seed = randNum(seed);
        choice = seed % (24-i);
        abilities[i] = ability_choices[choice];
        ability_choices.splice(choice,1);

    }

    //find level of each ability
    level_counter = relic_level;
    for(var i=0;i<abilities.length-1;i++){
        seed = randNum(seed);
        ability_levels[i] = range(1,level_counter - (abilities.length - i) + 1,seed);
        level_counter -= ability_levels[i];
    }
    ability_levels[abilities.length-1] = level_counter;
    //Scale abilities as necessary
    ability_levels.sort(sortNumbers);
    for(var i=0;i<ability_levels.length;i++){
        if(item_data[abilities[i]].scaling == "cubic"){
            ability_levels[i] = Math.ceil(Math.pow(ability_levels[i],1/3));
        }
    }

    //assemble item
     var ab_arr = ["-","-","-","-"];
     for(var i=0;i<ability_levels.length;i++){
         ab_arr[i] = applyLevelFormula(item_data[abilities[i]].effectDescription,
                             item_data[abilities[i]].levelAmountFormula,
                             ability_levels[i]);
     }
     items.push([relic_level, rarity_conv[rarity],ab_arr[0],ab_arr[1],ab_arr[2],ab_arr[3],rarity]);
     //item type (not stored but randomize to account for it)
     seed = randNum(seed);

     return seed;
}
function applyLevelFormula(e,formula,lvl)
{
    var expression = e;
    var siyLib = [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 249, 273, 297, 321, 345, 369, 393, 417, 441, 465, 488, 511, 534, 557, 580, 603, 626, 649, 672, 695, 717, 739, 761, 783, 805, 827, 849, 871, 893, 915, 936, 957, 978, 999, 1020, 1041, 1062, 1083, 1104, 1125, 1145, 1165, 1185, 1205, 1225, 1245, 1265, 1285, 1305, 1325, 1344, 1363, 1382, 1401, 1420, 1439, 1458, 1477, 1496, 1515, 1533, 1551, 1569, 1587, 1605, 1623, 1641, 1659, 1677, 1695, 1712, 1729, 1746, 1763, 1780, 1797, 1814, 1831, 1848, 1865, 1881, 1897, 1913, 1929, 1945, 1961, 1977, 1993, 2009, 2025];

    formula == "linear1" ? expression = expression.replace("%1",lvl) :
    formula == "linear5" ? expression = expression.replace("%1",lvl*5) :
    formula == "linear0_25" ? expression = expression.replace("%1",lvl*.25) :
    formula == "linear10" ? expression = expression.replace("%1",lvl*10) :
    formula == "linear15" ? expression = expression.replace("%1",lvl*15) :
    formula == "linear25" ? expression = expression.replace("%1",lvl*25) :
    formula == "solomonRewards" ? expression = expression.replace("%1",lvl*5) :
    formula == "linear10" ? expression = expression.replace("%1",lvl*10) :
    expression = expression.replace("%1",siyLib[lvl]);

    return expression;
}
function sortNumbers(a,b)
{
    return b - a;
}
function weightedChoice(choices, s)
{
    var weights = 0;
    var ran_num = 0;
    var seed = s;
    var counter = 0;
    var total = 0;

    for(var i=0; i< choices.length;i++){
        weights += choices[i];
    }
    ran_num = seed % weights + 1;
    do{
        total += choices[counter];
        counter++;
    }while (ran_num > total)

    return counter-1;
}
function getBonusTypes()
{
    return '{"itemBonusTypes":{"1":{"name":"Abandonment","levelAmountFormula":"linear10","effectDescription":"+%1% DPS when idle (no clicks for 60 seconds)","id":1,"maxLevel":0,"scaling":"linear"},"2":{"name":"Wrath","levelAmountFormula":"linear10","effectDescription":"+%1% Click Damage","id":2,"maxLevel":0,"scaling":"linear"},"3":{"name":"Time","levelAmountFormula":"linear5","effectDescription":"+%1 seconds to Boss Fight timers","id":3,"maxLevel":0,"scaling":"cubic"},"4":{"name":"Agitation","levelAmountFormula":"linear1","effectDescription":"+%1 seconds to duration of Clickstorm","id":4,"maxLevel":0,"scaling":"linear"},"5":{"name":"Luck","levelAmountFormula":"linear1","effectDescription":"+%1% Chance of double rubies from clickable treasures, when you get a ruby.","id":5,"maxLevel":7,"scaling":"cubic"},"6":{"name":"Vision","levelAmountFormula":"linear1","effectDescription":"+%1 to starting zone after Ascension","id":6,"maxLevel":0,"scaling":"cubic"},"7":{"name":"Enhancement","levelAmountFormula":"linear1","effectDescription":"+%1% to Gilded damage bonus (per Gild)","id":7,"maxLevel":0,"scaling":"linear"},"8":{"name":"Battery Life","levelAmountFormula":"linear1","effectDescription":"+%1 seconds to duration of Metal Detector","id":8,"maxLevel":0,"scaling":"linear"},"9":{"name":"Thieves","levelAmountFormula":"linear1","effectDescription":"+%1 seconds to duration of Golden Clicks","id":9,"maxLevel":0,"scaling":"linear"},"10":{"name":"Accuracy","levelAmountFormula":"linear1","effectDescription":"+%1 seconds to duration of Lucky Strikes","id":10,"maxLevel":0,"scaling":"linear"},"11":{"name":"Rage","levelAmountFormula":"linear1","effectDescription":"+%1 seconds to duration of Powersurge","id":11,"maxLevel":0,"scaling":"linear"},"12":{"name":"Wallops","levelAmountFormula":"linear1","effectDescription":"+%1 seconds to duration of Super Clicks","id":12,"maxLevel":0,"scaling":"linear"},"13":{"name":"Diseases","levelAmountFormula":"linear1","effectDescription":"-%1% Boss Life","id":13,"maxLevel":7,"scaling":"cubic"},"14":{"name":"Death","levelAmountFormula":"linear10","effectDescription":"+%1% to Hero Soul DPS (additive)","id":14,"maxLevel":0,"scaling":"linear"},"15":{"name":"Murder","levelAmountFormula":"linear1","effectDescription":"+%1% damage to Critical Clicks","id":15,"maxLevel":0,"scaling":"linear"},"16":{"name":"Discovery","levelAmountFormula":"linear10","effectDescription":"+%1% more Treasure Chests","id":16,"maxLevel":7,"scaling":"cubic"},"17":{"name":"Souls","levelAmountFormula":"linear1","effectDescription":"+%1% Chance of Primal Bosses","id":17,"maxLevel":7,"scaling":"cubic"},"18":{"name":"Chance","levelAmountFormula":"linear0_25","effectDescription":"+%1% Chance of 10x Gold","id":18,"maxLevel":7,"scaling":"cubic"},"19":{"name":"Thrift","levelAmountFormula":"linear1","effectDescription":"-%1% Hero Hiring and Level-Up cost","id":19,"maxLevel":7,"scaling":"cubic"},"20":{"name":"Wealth","levelAmountFormula":"linear15","effectDescription":"+%1% Gold from Golden Clicks","id":20,"maxLevel":0,"scaling":"linear"},"21":{"name":"Riches","levelAmountFormula":"linear25","effectDescription":"+%1% Gold From Treasure Chests","id":21,"maxLevel":0,"scaling":"linear"},"22":{"name":"Greed","levelAmountFormula":"linear5","effectDescription":"+%1% Gold Dropped","id":22,"maxLevel":0,"scaling":"linear"},"24":{"name":"Freedom","levelAmountFormula":"libAndSiy","effectDescription":"+%1% Gold gained from monsters when idle (no clicks for 60 seconds)","id":24,"maxLevel":0,"scaling":"linear"},"25":{"name":"Wisdom","levelAmountFormula":"solomonRewards","effectDescription":"+%1% Primal Hero Souls","id":25,"maxLevel":0,"scaling":"cubic"}}}';
}
var item_data = {
    1:{"name":"Abandonment","levelAmountFormula":"linear10","effectDescription":"+%1% Idle DPS","id":1,"maxLevel":0,"scaling":"linear"},
    2:{"name":"Wrath","levelAmountFormula":"linear10","effectDescription":"+%1% Click Damage","id":2,"maxLevel":0,"scaling":"linear"},
    3:{"name":"Time","levelAmountFormula":"linear5","effectDescription":"+%1 Sec Boss timers","id":3,"maxLevel":0,"scaling":"cubic"},
    4:{"name":"Agitation","levelAmountFormula":"linear1","effectDescription":"+%1 Sec Clickstorm","id":4,"maxLevel":0,"scaling":"linear"},
    5:{"name":"Luck","levelAmountFormula":"linear1","effectDescription":"+%1% Double Rubies Chance","id":5,"maxLevel":7,"scaling":"cubic"},
    6:{"name":"Vision","levelAmountFormula":"linear1","effectDescription":"+%1 Starting Zone","id":6,"maxLevel":0,"scaling":"cubic"},
    7:{"name":"Enhancement","levelAmountFormula":"linear1","effectDescription":"+%1% Gild Damage","id":7,"maxLevel":0,"scaling":"linear"},
    8:{"name":"Battery Life","levelAmountFormula":"linear1","effectDescription":"+%1 Sec Metal Detector","id":8,"maxLevel":0,"scaling":"linear"},
    9:{"name":"Thieves","levelAmountFormula":"linear1","effectDescription":"+%1 Sec Golden Clicks","id":9,"maxLevel":0,"scaling":"linear"},
    10:{"name":"Accuracy","levelAmountFormula":"linear1","effectDescription":"+%1 Sec Lucky Strikes","id":10,"maxLevel":0,"scaling":"linear"},
    11:{"name":"Rage","levelAmountFormula":"linear1","effectDescription":"+%1 Sec Powersurge","id":11,"maxLevel":0,"scaling":"linear"},
    12:{"name":"Wallops","levelAmountFormula":"linear1","effectDescription":"+%1 Sec Super Clicks","id":12,"maxLevel":0,"scaling":"linear"},
    13:{"name":"Diseases","levelAmountFormula":"linear1","effectDescription":"-%1% Boss Life","id":13,"maxLevel":7,"scaling":"cubic"},
    14:{"name":"Death","levelAmountFormula":"linear10","effectDescription":"+%1% Hero Soul DPS","id":14,"maxLevel":0,"scaling":"linear"},
    15:{"name":"Murder","levelAmountFormula":"linear1","effectDescription":"+%1% Critical Click Damage","id":15,"maxLevel":0,"scaling":"linear"},
    16:{"name":"Discovery","levelAmountFormula":"linear10","effectDescription":"+%1% Treasure Chests","id":16,"maxLevel":7,"scaling":"cubic"},
    17:{"name":"Souls","levelAmountFormula":"linear1","effectDescription":"+%1% Primal Boss Chance","id":17,"maxLevel":7,"scaling":"cubic"},
    18:{"name":"Chance","levelAmountFormula":"linear0_25","effectDescription":"+%1% 10x Gold Chance","id":18,"maxLevel":7,"scaling":"cubic"},
    19:{"name":"Thrift","levelAmountFormula":"linear1","effectDescription":"-%1% Hero Cost","id":19,"maxLevel":7,"scaling":"cubic"},
    20:{"name":"Wealth","levelAmountFormula":"linear15","effectDescription":"+%1% Golden Clicks Gold","id":20,"maxLevel":0,"scaling":"linear"},
    21:{"name":"Riches","levelAmountFormula":"linear25","effectDescription":"+%1% Treasure Chest Gold","id":21,"maxLevel":0,"scaling":"linear"},
    22:{"name":"Greed","levelAmountFormula":"linear5","effectDescription":"+%1% Gold Dropped","id":22,"maxLevel":0,"scaling":"linear"},
    24:{"name":"Freedom","levelAmountFormula":"libAndSiy","effectDescription":"+%1% Idle Gold","id":24,"maxLevel":0,"scaling":"linear"},
    25:{"name":"Wisdom","levelAmountFormula":"solomonRewards","effectDescription":"+%1% Primal Hero Souls","id":25,"maxLevel":0,"scaling":"cubic"}
};