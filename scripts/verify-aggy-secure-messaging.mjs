import {
  createDeviceKeys,
  createRoomSecret,
  decryptMessage,
  encryptMessage
} from '../src/aggy-secure-chat-crypto.js';

const origin=process.argv[2]||'https://aggy.secquoia.group';
const browserOrigin='https://secquoia.net';
const alice=createDeviceKeys(),bob=createDeviceKeys(),room=createRoomSecret();

const call=async(path,{method='GET',body}={})=>{
  const response=await fetch(`${origin}${path}`,{
    method,
    headers:{
      Origin:browserOrigin,
      Authorization:`Bearer ${room.capability}`,
      ...(body?{'Content-Type':'application/json'}:{})
    },
    body:body?JSON.stringify(body):undefined
  });
  const payload=await response.json();
  if(!response.ok)throw new Error(`${path}: ${response.status} ${payload.error||'unknown'}`);
  return payload;
};

const health=await call('/api/aggy/messages/health');
await call(`/api/aggy/messages/rooms/${room.roomId}/bundles`,{method:'PUT',body:{bundle:alice.publicBundle}});
await call(`/api/aggy/messages/rooms/${room.roomId}/bundles`,{method:'PUT',body:{bundle:bob.publicBundle}});
const sanitized=await call('/api/aggy/messages/sanitize',{method:'POST',body:{text:'Prueba RC.10 limpia'}});
const envelope=encryptMessage({
  roomId:room.roomId,
  text:sanitized.sanitizedText,
  admissionReceipt:sanitized.receipt,
  sender:alice,
  recipient:bob.publicBundle
});
await call(`/api/aggy/messages/rooms/${room.roomId}/messages`,{method:'POST',body:{envelope}});
const page=await call(`/api/aggy/messages/rooms/${room.roomId}/messages?deviceId=${bob.publicBundle.deviceId}&after=0`);
const clear=decryptMessage({
  roomId:room.roomId,
  envelope:page.messages[0].envelope,
  recipient:bob,
  expectedSenderFingerprint:alice.publicBundle.fingerprint
});

if(clear.text!=='Prueba RC.10 limpia')throw new Error('plaintext_mismatch');
console.log(JSON.stringify({
  ok:true,
  serviceStatus:health.status,
  version:health.release.version,
  roomIdPrefix:room.roomId.slice(0,8),
  envelopesRetrieved:page.messages.length,
  signatureVerified:clear.evidence.signatureVerified,
  admissionReceiptVerified:clear.evidence.admissionReceiptVerified,
  glasswall:health.attachments
},null,2));
