export default function Factory() {
    let typeHandler={
        init: init,
        remove: remove
    };
    
    let typeList=global.componentManager.componentType;
    if(typeList.has("single-led")) console.warn("[MqttSingleLed] single-led has been registered.");
    else {
        typeList.set("single-led", typeHandler);
    }
}

let map=new Map();

export function list() {
    return map.keys();
}

export function set(uuid, status) {
    if(map.has(uuid)) {
        let handler=global.componentManager.getComponentById(uuid).funcHandler;
        return handler(uuid, "single-led/set", [status])===true;
    }
    return false;
}
let status=false;

function init(uuid) {
    map.set(uuid, false);
    
    setInterval(
        function() {
            set(uuid, !status);
            status=!status;
        }
    ,1000);
}

function remove(uuid) {
    map.delete(uuid);
}