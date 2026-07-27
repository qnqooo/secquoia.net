import {ml_kem768_x25519} from '@noble/post-quantum/hybrid.js';
import {ml_dsa65} from '@noble/post-quantum/ml-dsa.js';
import {gcm} from '@noble/ciphers/aes.js';
import {xchacha20poly1305} from '@noble/ciphers/chacha.js';
import {hkdf} from '@noble/hashes/hkdf.js';
import {sha512,sha256} from '@noble/hashes/sha2.js';
import {randomBytes} from '@noble/hashes/utils.js';

const te=new TextEncoder(),td=new TextDecoder();
const PROFILE='secquoia.aggy.quvault-e2ee-pqc.v1';
const CRYPTO_PROFILE='E2EE/PQC';
const ALG=Object.freeze({
  kem:'ML-KEM-768+X25519',
  signature:'ML-DSA-65',
  kdf:'HKDF-SHA-512',
  inner:'AES-256-GCM',
  outer:'XChaCha20-Poly1305'
});

const b64=bytes=>{
  let value='';
  for(let i=0;i<bytes.length;i+=0x8000)value+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(value).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
};
const unb64=value=>{
  const normalized=String(value).replaceAll('-','+').replaceAll('_','/');
  const raw=atob(normalized+'='.repeat((4-normalized.length%4)%4));
  return Uint8Array.from(raw,char=>char.charCodeAt(0));
};
const canonical=value=>{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
};
const digest=value=>b64(sha256(typeof value==='string'?te.encode(value):value));
const publicBundleDigest=bundle=>{
  const unsigned={...bundle};
  delete unsigned.fingerprint;
  return digest(canonical(unsigned));
};
const wipe=(...items)=>items.forEach(item=>item instanceof Uint8Array&&item.fill(0));

function createDeviceKeys(){
  const kem=ml_kem768_x25519.keygen();
  const signature=ml_dsa65.keygen();
  const deviceId=crypto.randomUUID();
  const bundle={
    schema:'secquoia.aggy.device-public-bundle.v1',
    cryptoProfile:CRYPTO_PROFILE,
    deviceId,
    kemPublicKey:b64(kem.publicKey),
    signaturePublicKey:b64(signature.publicKey),
    algorithms:ALG,
    createdAt:new Date().toISOString()
  };
  bundle.fingerprint=publicBundleDigest(bundle);
  return {
    publicBundle:bundle,
    privateBundle:{
      schema:'secquoia.aggy.device-private-bundle.v1',
      deviceId,
      kemSecretKey:b64(kem.secretKey),
      signatureSecretKey:b64(signature.secretKey)
    }
  };
}

function encryptMessage({roomId,text,admissionReceipt,sender,recipient}){
  if(!roomId||!text||!admissionReceipt?.admissionAuthorized)throw new Error('admission_receipt_required');
  if(sender?.publicBundle?.deviceId!==sender?.privateBundle?.deviceId)throw new Error('sender_key_mismatch');
  const encapsulated=ml_kem768_x25519.encapsulate(unb64(recipient.kemPublicKey));
  const salt=sha256(te.encode(`Aggy|${roomId}|${sender.publicBundle.deviceId}|${recipient.deviceId}`));
  const keyMaterial=hkdf(sha512,encapsulated.sharedSecret,salt,te.encode(PROFILE),64);
  const innerNonce=randomBytes(12),outerNonce=randomBytes(24);
  const header={
    schema:PROFILE,
    cryptoProfile:CRYPTO_PROFILE,
    recordId:crypto.randomUUID(),
    roomId,
    senderDeviceId:sender.publicBundle.deviceId,
    senderFingerprint:sender.publicBundle.fingerprint,
    recipientDeviceId:recipient.deviceId,
    recipientFingerprint:recipient.fingerprint,
    createdAt:new Date().toISOString(),
    algorithms:ALG,
    admissionReceiptHash:digest(canonical(admissionReceipt))
  };
  const aad=te.encode(canonical(header));
  const inner=gcm(keyMaterial.subarray(0,32),innerNonce,aad).encrypt(te.encode(text));
  const outer=xchacha20poly1305(keyMaterial.subarray(32,64),outerNonce,aad).encrypt(inner);
  const unsigned={
    header,
    kemCiphertext:b64(encapsulated.cipherText),
    innerNonce:b64(innerNonce),
    outerNonce:b64(outerNonce),
    ciphertext:b64(outer),
    senderPublicBundle:sender.publicBundle,
    admissionReceipt
  };
  const signature=ml_dsa65.sign(te.encode(canonical(unsigned)),unb64(sender.privateBundle.signatureSecretKey));
  wipe(encapsulated.sharedSecret,keyMaterial,inner);
  return {...unsigned,signature:b64(signature)};
}

function decryptMessage({roomId,envelope,recipient,expectedSenderFingerprint}){
  const unsigned={...envelope};
  delete unsigned.signature;
  if(envelope?.header?.schema!==PROFILE||envelope.header.cryptoProfile!==CRYPTO_PROFILE||envelope.header.roomId!==roomId)throw new Error('invalid_envelope_profile');
  if(envelope.header.recipientDeviceId!==recipient.privateBundle.deviceId)throw new Error('wrong_recipient');
  if(expectedSenderFingerprint&&envelope.senderPublicBundle?.fingerprint!==expectedSenderFingerprint)throw new Error('sender_fingerprint_mismatch');
  if(publicBundleDigest(envelope.senderPublicBundle)!==envelope.senderPublicBundle.fingerprint)throw new Error('sender_bundle_tampered');
  if(digest(canonical(envelope.admissionReceipt))!==envelope.header.admissionReceiptHash)throw new Error('admission_receipt_tampered');
  const verified=ml_dsa65.verify(
    unb64(envelope.signature),
    te.encode(canonical(unsigned)),
    unb64(envelope.senderPublicBundle.signaturePublicKey)
  );
  if(!verified)throw new Error('signature_invalid');
  const shared=ml_kem768_x25519.decapsulate(
    unb64(envelope.kemCiphertext),
    unb64(recipient.privateBundle.kemSecretKey)
  );
  const salt=sha256(te.encode(`Aggy|${roomId}|${envelope.header.senderDeviceId}|${recipient.privateBundle.deviceId}`));
  const keyMaterial=hkdf(sha512,shared,salt,te.encode(PROFILE),64);
  const aad=te.encode(canonical(envelope.header));
  const inner=xchacha20poly1305(keyMaterial.subarray(32,64),unb64(envelope.outerNonce),aad).decrypt(unb64(envelope.ciphertext));
  const clear=gcm(keyMaterial.subarray(0,32),unb64(envelope.innerNonce),aad).decrypt(inner);
  const text=td.decode(clear);
  wipe(shared,keyMaterial,inner,clear);
  return {
    text,
    recordId:envelope.header.recordId,
    createdAt:envelope.header.createdAt,
    senderDeviceId:envelope.header.senderDeviceId,
    senderFingerprint:envelope.senderPublicBundle.fingerprint,
    evidence:{
      signatureVerified:true,
      admissionReceiptVerified:true,
      cryptoProfile:CRYPTO_PROFILE,
      algorithms:ALG
    }
  };
}

function createRoomSecret(){
  const secret=randomBytes(32);
  return deriveRoomSecret(b64(secret));
}
function deriveRoomSecret(encodedSecret){
  const secret=unb64(encodedSecret);
  if(secret.length!==32)throw new Error('invalid_room_secret');
  return {
    secret:b64(secret),
    roomId:digest(new Uint8Array([...te.encode('AggyRoom|'),...secret])),
    capability:digest(new Uint8Array([...te.encode('AggyCapability|'),...secret]))
  };
}

export {ALG,PROFILE,CRYPTO_PROFILE,b64,unb64,canonical,digest,createDeviceKeys,encryptMessage,decryptMessage,createRoomSecret,deriveRoomSecret};
