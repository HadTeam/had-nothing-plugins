import * as mqtt from "mqtt";
import {waitFor} from "wait-for-event";

let pathHandler=new Map();

export default async function Factory() {
    let client;
    try {
        client=mqtt.connect(global.config["mqtt"]["brokerUrl"]);
    }
    catch (err) {
        console.error("[MqttClient]Connection error, err: ",err);
    }
    client.on('connect', () => {
        console.log("[MqttClient]Connection built, listening...");
    });
    client.on('message',(topic, message)=>{
        let messageJson=JSON.parse(message.toString());
        // console.debug("[MqttClient]Message arrived, topic:",topic,",message:",messageJson);
        if(pathHandler.has(topic)) {
            let handlers=pathHandler.get(topic);
            handlers.forEach((handler)=>{
                handler(messageJson);
            })
        }
        else if(messageJson["jsonrpc"]===2.0) {
            let eventName="rpc/"+topic;
            global.events.emit(eventName, messageJson);
        }
    });
    client.addHandler=(topic, cb)=>{
        if(!pathHandler.has(topic)) {
            pathHandler.set(topic, []);
            client.subscribe(topic);
        }
        pathHandler.get(topic).push(cb);
    }
    client.removeHandler=(topic, cb)=>{
        if(!pathHandler.has(topic)) return false;
        let cbs=pathHandler.get(topic);
        if(cbs.includes(cb)) {
            cbs.remove(cb);
        }
    }
    await waitFor('connect', client);
    return client;
}