importScripts("commonvars.js");
importScripts("commonworker.js");

self.addEventListener('message',  function(event)
{
    
    //worker_data = {"constraints":cons_holder,"level":50,"maxRelics":12,"zoneSeed":zone_seed,
    //               "ascensionSeed":ascension_seed,"itemReceived":item_received,"minRarity":0,"HZE":HZE};
    var item_seed = event.data.ascensionSeed;
    var zone_seed = event.data.zoneSeed;
    var max_ruby_relics = event.data.maxRelics;
    var highest_level_item = event.data.highestLevelItem;
    var constraints = {"rarity":event.data.minRarity,"level":event.data.level,"abilities":event.data.constraints};
    var counter = 0;
    var best = 10000;
    var stack = [];
    var items;
    var seed;
    var start;
    var ruby;
    var start_ruby;
    var HLI;
    var tracker = [];
    var HZE = event.data.HZE;
    
    stack.push(item_seed);
    stack.push(0);
    stack.push(0);
    stack.push(0);
    stack.push(highest_level_item);
    stack.push(tracker);
    
    while(stack.length > 0){
        console.log("about to pop");
        tracker = [];
        tracker.push(stack.pop());
        HLI = stack.pop();
        start_ruby = stack.pop();
        ruby = stack.pop();
        start = stack.pop();
        seed = stack.pop();
        
        //push search with no rubies
        //console.log("exhaust item");
        if(ruby-start_ruby>0){
            console.log("creating ruby item");
        }else{
            console.log("exhaust item");
        }
        var result = exhaustiveSearchItem(seed,start,best,ruby-start_ruby,HLI,constraints,HZE);
        
        if(result.success == true){
            result.tracker = tracker;
            postMessage(result);
            best = result.iterations;
        }
        //DO YOU REALLY NEED AN IF HERE???
        if(ruby > start_ruby){
            start_ruby = ruby;
            console.log("result he seed:" + result.seed);
            seed = result.seed;
        }
        if(ruby < max_ruby_relics){
            stack.push(seed);
            stack.push(start);
            stack.push(ruby+3);
            stack.push(start_ruby);
            stack.push(HLI);
            tracker.push(-3);
            stack.push(tracker);
        }
        if(start < best){
            ++start;
            seed = generateRawItems(constraints.level,seed,[]); //Get item, trash it to offset seed
            stack.push(seed);
            stack.push(start);
            stack.push(ruby);
            stack.push(start_ruby);
            stack.push(HLI);
            tracker.push(1);
            stack.push(tracker);
        }
    }
    
    postMessage("complete");
});
function exhaustiveSearchItem(s,start,best,relics_to_buy,highest_level_item,constraints,HZE)
{
    console.log("seed: " + s + "HZE: " + HZE);
    if(s == undefined){
        s = s;
    }
    var seed = s;
    var j = 0;
    var items = [];
    var level;
    var success = false;
    var result;// = {"success":false,"item":items,"iterations":0,"purchased":true,"HLI":highest_level_item,"seed":123};
    var item;
    //Relics bought with rubies
    for(var i=0;i<relics_to_buy;i++){
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
            success=true;
            result = {"success":true,"item":convertRawItemToPretty(item),"iterations":0,"purchased":true,"HLI":highest_level_item,"seed":seed,"tracker":1};
        }
    }
    //result.seed = seed;
    if(success){
        result.seed = seed;
        return result;
    }
    //Relics from relic ooze
    for (var j=start;j<best;++j){
        level = constraints.level; //Math.ceil(Math.max(50*(1-Math.pow(1.2,(-(zones[j]-1)/100+1))),1));
        seed = generateRawItems(level,seed,items);
        item = items.pop();
        if(compareItem(item,constraints)){
            return {"success":true,"item":convertRawItemToPretty(item),"iterations":j,"purchased":false,"HLI":highest_level_item,"seed":s,"tracker":1};
        }
    }
    
   return {"success":false,"seed":seed}; //,"item":convertRawItemToPretty(item),"iterations":j,"purchased":false,"HLI":highest_level_item,"seed":s,"tracker":1};
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
    //raw item
    //items.push([relic_level, rarity,abilities,ability_levels]);
    //constrained item
    //constraints = {"rarity":event.data.minRarity,"level":event.data.level,"abilities":event.data.constraints};
    if(item[0] >= constraints.level){ //check level
        if(item[1] >= constraints.rarity){ //check rarity
            var item_counter = 0;
            var constraint_counter = 0;
            success = false;
//            while(item_counter < item[2].length){ //compare levels and abilities to contraints
//                for(var i=0;i<constraints.abilities[constraint_counter].length;++i){
//                    success = false;
//                    if(item[2][item_counter] == constraints.abilities[constraint_counter][i].ability){ //compare ability
//                        console.log(item[2][item_counter] + "==" + constraints.abilities[constraint_counter][i].ability);
//                        if(item[3][item_counter] >= constraints.abilities[constraint_counter][i].level){ //compare level
//                            success = true;
//                            break;
//                        }
//                    }
//                }
//                ++item_counter;
//                ++constraint_counter;
//            }
            
            
            //second stab at it, actually third maybe
//            while(constraint_counter < constraints.abilities.length){ //compare levels and abilities to contraints
//                for(var i=0;i<constraints.abilities[constraint_counter].length;++i){
//                    if(constraints.abilities[constraint_counter].length == 0){
//                        continue;
//                    }
//                    success=false;
//                    if(item[2][item_counter] == constraints.abilities[constraint_counter][i].ability){ //compare ability
//                        console.log(item[2][item_counter] + "==" + constraints.abilities[constraint_counter][i].ability);
//                        if(item[3][item_counter] >= constraints.abilities[constraint_counter][i].level){ //compare level
//                            success = true;
//                            break;
//                        }
//                    }
//                    if(!success){
//                        return false;
//                    }
//                }
//                ++item_counter;
//                ++constraint_counter;
//            }

//fourth attempt
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