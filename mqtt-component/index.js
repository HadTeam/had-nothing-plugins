import {waitFor} from "wait-for-event";
import crypto from "crypto";
import pTimeout from "p-timeout";

export default function Factory() {
    return new MqttComponent();
}

class MqttComponent {
    constructor() {
        global.plugins.mqttClient.addHandler("panel/regId", this.regId);
    }
    
    async regId(arg) {
        let uuid = arg["params"][0];
        
        const genJsonrpc2Req = (action, params, id) => {
            return JSON.stringify({
                "jsonrpc": 2.0,
                "method": action,
                "params": params,
                "id": id
            });
        }
        
        const componentHandler = async (uuid, action, param) => {
            if (!global.plugins.mqttClient.connected) return undefined;
            
            let reqId = crypto.randomBytes(8).toString('hex');
            let req = genJsonrpc2Req(action, param, reqId);
            let eventName = "rpc/panel/component/response/" + uuid + "/" + reqId;
            let ret = {};
            
            global.plugins.mqttClient.subscribe("panel/component/response/" + uuid + "/" + reqId);
            global.events.once(eventName, (res) => {
                ret = res.result;
            });
            global.plugins.mqttClient.publish("panel/component/" + uuid, req);
            try {
                await pTimeout(waitFor(eventName, global.events), 2000);
            } catch (err) {
                console.warn("[MqttComponent]Request" + JSON.stringify({id: reqId, action: action}) + " timeout.");
            }
            global.plugins.mqttClient.unsubscribe("panel/component/response/" + uuid + "/" + reqId);
            
            return ret;
        }
        
        await global.componentManager.register(uuid, componentHandler);
    }
}