self.addEventListener('message',  function(event)
{
    var zones;
    var items;
    var results_table;
    
    zones = findSeveralStartZones(event.data.SZ,event.data.HZE,event.data.zoneSeed,event.data.numZones);
    items = findItems(event.data.ascensionSeed,zones,event.data.itemReceived);
    
    results_table = createTable(event.data.ascensions,zones, items);

    postMessage(results_table);
});

function createTable(counter, data, items)
{
    var dataset = [];

    for (var i=0; i<data.length; i++) {
        dataset.push(
                [i+counter,
                data[i],
                items[i][0],
                items[i][1],
                items[i][2],
                items[i][3],
                items[i][4],
                items[i][5]]);
    }

    return dataset;
}
function findSeveralStartZones(start, HZE, s, num)
{
    var zones = new Array();
    var previous_seed = 0;
    for(var i=0;i<num;i++) {
        zones[i] = getBonusItemZone(start, HZE, s);
        s = randNum(randNum(randNum(randNum(s))));

    }
    return zones;
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
function findItems(s, zones,got_item)
{
    var seed = s;
    var ability_odds = [6,5,4,3];
    var rarity_odds = [5000,2000,800,300,100,25,8,1];
    var ability_conv = [1,2,3,4];
    var rarity_conv = ["Common","Uncommon","Rare","Epic","Fabled","Mythical","Legendary","Transcendent"];
    var j = 0;
    var items = [];
    if(got_item ){
        items[0] = ["the", "seed", "already", "changed", "cannot", "predict"];
        j=1;
    }
    for (;j<zones.length;j++){
       var num_abilities = 0;
       var abilities = [];
       var rarity = "";
       var ability_levels = [];
       var relic_level = 0;
       var level_counter = 0;
       var ability_choices = [];

       relic_level = Math.ceil(Math.max(50*(1-Math.pow(1.2,(-zones[j]/100+1))),1));

       //find rarity    
       seed = randNum(seed);
       rarity =  rarity_conv[weightedChoice(rarity_odds,seed)];

       //find num abilities
       seed = randNum(seed);
       num_abilities = ability_conv[weightedChoice(ability_odds,seed)];

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
        items[j] = [relic_level, rarity,"-","-","-","-"];
        for(var i=0;i<ability_levels.length;i++){
            items[j][i+2] = applyLevelFormula(item_data[abilities[i]].effectDescription,
                                item_data[abilities[i]].levelAmountFormula,
                                ability_levels[i]);
        }
        seed = randNum(seed);
   }
   return items;
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