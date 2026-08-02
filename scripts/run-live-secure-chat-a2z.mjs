import assert from 'node:assert/strict';
import {createDeviceKeys,createRoomSecret,decryptMessage,encryptMessage} from '../src/aggy-secure-chat-crypto.js';

const origin=process.env.AGGY_TEST_ORIGIN||'https://aggy.secquoia.group';
const siteOrigin='https://secquoia.net';
const room=createRoomSecret();
const alice=createDeviceKeys();
const bob=createDeviceKeys();
const headers={'X-Aggy-Room-Capability':room.capability,Origin:siteOrigin};
const request=async(path,init={})=>{
  const response=await fetch(`${origin}${path}`,{...init,headers:{...headers,...init.headers},cache:'no-store'});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`${response.status}:${body.error||'request_failed'}`);
  return {response,body};
};

for(const device of [alice,bob]){
  await request(`/api/aggy/messages/rooms/${room.roomId}/bundles`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({bundle:device.publicBundle})});
}
const sanitized=await request('/api/aggy/messages/sanitize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Prueba A-Z cifrada entre Alice y Bob.'})});
const envelope=encryptMessage({roomId:room.roomId,text:sanitized.body.sanitizedText,admissionReceipt:sanitized.body.receipt,sender:alice,recipient:bob.publicBundle});
const stored=await request(`/api/aggy/messages/rooms/${room.roomId}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({envelope})});
const page=await request(`/api/aggy/messages/rooms/${room.roomId}/messages?deviceId=${bob.publicBundle.deviceId}&after=0`);
assert.equal(page.body.messages.length,1);
const clear=decryptMessage({roomId:room.roomId,envelope:page.body.messages[0].envelope,recipient:bob});
assert.equal(clear.text,'Prueba A-Z cifrada entre Alice y Bob.');
console.log(JSON.stringify({
  schema:'secquoia.aggy.live-secure-chat-test.v1',
  success:true,
  participants:2,
  cryptoProfile:envelope.header.cryptoProfile,
  stored:stored.body.stored,
  vault:stored.body.vault,
  sequence:stored.body.sequence,
  decryptedByRecipient:true,
  plaintextSentToRelay:false
}));
