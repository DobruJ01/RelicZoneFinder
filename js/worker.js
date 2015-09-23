importScripts("commonworker.js");

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
        if(level > highest_level_item){
            highest_level_item = level;
        }
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
function createTable(ascension_counter, zones, items,relics_purchased)
{
    var dataset = [];
    
    for(var i=0;i<relics_purchased;i++){
        dataset.push(
                [0,
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

var item_points = [0,1,5,5,5,50,1,40,70,1,1,1,90,1,5,1,100,5,80,0,0,1,1,1000000,60,1];
