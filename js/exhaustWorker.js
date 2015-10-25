importScripts("commonvars.js");
importScripts("commonworker.js");

self.addEventListener('message',  function(event)
{
    
//    worker_data = {"constraints":cons_holder,"level":50,"maxRelics":12,"zoneSeed":zone_seed,
//                   "ascensionSeed":ascension_seed,"itemReceived":item_received,"highestLevelItem":getHighestLevelItem(data),
//                   "minRarity":0,"HZE":HZE};

    var item_seed = event.data.ascensionSeed;
    var zone_seed = event.data.zoneSeed;
    var max_ruby_relics = 0; //event.data.maxRelics;
    var highest_level_item = event.data.highestLevelItem;
    var constraints = {"rarity":event.data.minRarity,"level":event.data.level,"abilities":event.data.constraints};
    var counter = 0;
    var best = 10000;
    var stack = [];
    var items;
    var seed = item_seed;
    var start = 0;
    var ruby = 0;
    var start_ruby;
    var HLI = event.data.highestLevelItem;
    var tracker = [];
    var HZE = event.data.HZE;
    var result;
    //Initial exhaust to get best
    //result = exhaustiveSearchItem(item_seed,0,best,constraints);
    stack.push(item_seed);
    stack.push(0);
    stack.push(0);
    stack.push(0);
    stack.push(highest_level_item);
    stack.push(tracker);
    do{
        if(start < best){
            for(var i=ruby;i<max_ruby_relics;++i){ // i -> relics_to_buy
                //buy 3 relics, return any that fit criteria, store seed
                for(var j=i+3;i<j;++i){
                    result = buyRubyRelic(seed,HLI,constraints,HZE);
                    if(result.success == true){
                        console.log("you had purchase success");
                        result.tracker = tracker;
                        postMessage(result);
                        //best = result.iterations;
                    }
                }
                seed = result.seed;
                 //Push state onto stack
                stack.push(seed);
                stack.push(start);
                stack.push(max_ruby_relics);
                stack.push(i);
                stack.push(highest_level_item);
                stack.push(tracker);
            }

            console.log("about to pop");
            tracker = [];
            tracker.push(stack.pop());
            HLI = stack.pop();
            start_ruby = stack.pop();
            ruby = stack.pop();
            start = stack.pop();
            seed = stack.pop();
            //grab item
            result = exhaustiveSearchItem(seed,start,start+1,constraints);
            if(result.success == true){
                console.log("relics bought " + ruby);
                result.tracker = tracker;
                postMessage(result);
                best = result.iterations;
            }
            seed = result.seed;
            ++start;
            //exhaust search on current state (only run til best)
            result = exhaustiveSearchItem(seed,start,best,constraints);
            
            if(result.success == true){
                //console.log(" " + ruby);
                console.log("relics bought " + ruby);
                result.tracker = tracker;
                
                //[relic_level, rarity_conv[rarity],ab_arr[0],ab_arr[1],ab_arr[2],ab_arr[3],rarity]
                postMessage(result);
                best = result.iterations;
            }
            console.log("start " + start + " best " + best);
        }
        console.log("Should be stopping: stack length: " + stack.length);
    }while(stack.length>0)

    postMessage("complete");
});
function buyRubyRelic(s,highest_level_item,constraints,HZE){
    var items = [];
    var level;
    var seed = s;
    var item;
    var result;
    
    //Relics bought with rubies
    level = Math.ceil(50 * (1 - Math.pow(1.2,-((HZE - 100) / 100))));
    level = Math.max(1,level);
    level = Math.min(highest_level_item + 5,level);
    seed = randNum(seed);
    level = range(Math.ceil(level*.75),level,seed);
    seed = generateRawItems(level,seed,items);
    if(level > highest_level_item){
        highest_level_item = level;
    }
    item = items.pop();
    if(compareItem(item,constraints)){
        result = {"success":true,"item":convertRawItemToPretty(item),"iterations":0,"purchased":true,"HLI":highest_level_item,"seed":seed,"tracker":1};
    }else{
        result = {"success":false,"item":convertRawItemToPretty(item),"iterations":0,"purchased":true,"HLI":highest_level_item,"seed":seed,"tracker":1};
    }
    return result;
}
function exhaustiveSearchItem(s,start,best,constraints)
{
    //console.log("seed: " + s);
    if(s == undefined){
        s = s;
    }
    var seed = s;
    var j = 0;
    var items = [];
    var level;
    var success = false;
    var result;
    var item;

    //Relics from relic ooze
    for (var j=start;j<best;++j){
        level = constraints.level; //Math.ceil(Math.max(50*(1-Math.pow(1.2,(-(zones[j]-1)/100+1))),1));
        seed = generateRawItems(level,seed,items);
        item = items.pop();
        if(compareItem(item,constraints)){
            return {"success":true,"item":convertRawItemToPretty(item),"iterations":j,"purchased":false,"HLI":"","seed":s,"tracker":1};
        }
    }
    
   return {"success":false,"seed":seed};
}
function compareItem(item,constraints)
{
    var success = false;
    var num_abilites = item[2].length;
    var num_constraints = 0;
    for(var i=0;i<constraints.abilities.length;i++){
        if(constraints.abilities[i].length > 0){
            
        }
    }
    //constrained item
    //constraints = {"rarity":event.data.minRarity,"level":event.data.level,"abilities":event.data.constraints};
    if(item[0] >= constraints.level){ //check level
        if(item[1] >= constraints.rarity){ //check rarity
            var item_counter = 0;
            var constraint_counter = 0;
            success = false;
            
            for(var i=0;i<constraints.abilities[0].length;i++){
                if(item[2][0] == constraints.abilities[0][i].ability){ //compare ability
                    console.log(item[2][item_counter] + "==" + constraints.abilities[0][i].ability);
                    if(item[3][0] >= constraints.abilities[0][i].level){ //compare level
                        success = true;
                        break;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }
            
            for(var i=0;i<constraints.abilities[1].length;i++){
                if(item[2][1] == constraints.abilities[1][i].ability){ //compare ability
                    console.log(item[2][item_counter] + "==" + constraints.abilities[1][i].ability);
                    if(item[3][1] >= constraints.abilities[1][i].level){ //compare level
                        success = true;
                        break;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }
            for(var i=0;i<constraints.abilities[2].length;i++){
                if(item[2][2] == constraints.abilities[2][i].ability){ //compare ability
                    console.log(item[2][2] + "==" + constraints.abilities[2][i].ability);
                    if(item[3][2] >= constraints.abilities[2][i].level){ //compare level
                        success = true;
                        break;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }
            for(var i=0;i<constraints.abilities[3].length;i++){
                if(item[2][3] == constraints.abilities[3][i].ability){ //compare ability
                    console.log(item[2][3] + "==" + constraints.abilities[3][i].ability);
                    if(item[3][3] >= constraints.abilities[3][i].level){ //compare level
                        success = true;
                        break;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }
        }
    }
    if(success)
        console.log("success: " + success + " item:  " + JSON.stringify(item) + "constraints: " + JSON.stringify(constraints));
    return success;
    
}