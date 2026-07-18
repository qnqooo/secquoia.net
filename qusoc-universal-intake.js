(function(global){
  'use strict';
  const MAX_FILE_BYTES=12*1024*1024,MAX_LOCAL_TEXT_BYTES=5*1024*1024;
  const TEXT_EXTENSIONS=new Set(['txt','csv','json','log','md','yaml','yml']);
  const BLOCKED_EXTENSIONS=new Set(['exe','dll','msi','bat','cmd','ps1','scr','com','jar','apk','dmg','iso','zip','rar','7z','tar','gz','docm','xlsm','pptm']);
  const REQUIRED_ADMISSION_STAGES=['quarantine','antimalware','sandbox','cdr','verification'];
  const hex=buffer=>[...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  const sha256=async bytes=>hex(await global.crypto.subtle.digest('SHA-256',bytes));
  const extension=name=>String(name||'').toLowerCase().split('.').pop();
  const starts=(bytes,signature)=>signature.every((value,index)=>bytes[index]===value);
  function classifyMagic(bytes){if(starts(bytes,[0x4d,0x5a]))return 'WINDOWS_EXECUTABLE';if(starts(bytes,[0x7f,0x45,0x4c,0x46]))return 'ELF_EXECUTABLE';if(starts(bytes,[0x50,0x4b,0x03,0x04]))return 'ZIP_CONTAINER';if(starts(bytes,[0x25,0x50,0x44,0x46]))return 'PDF';return 'UNRECOGNIZED'}
  function baseReceipt(file,sha,magic){return {schema:'secquoia.qusoc.local-preflight.v1',fileName:String(file.name||'unnamed'),size:Number(file.size||0),mimeType:String(file.type||'application/octet-stream'),originalSha256:sha,magic,admissionAuthorized:false,quvaultAuthorized:false,stages:{quarantine:'PASS',localStructure:'PENDING',antimalware:'NOT_EXECUTED_BACKEND_REQUIRED',sandbox:'NOT_EXECUTED_BACKEND_REQUIRED',cdr:'NOT_EXECUTED_BACKEND_REQUIRED',verification:'LOCAL_ONLY'}}}
  async function preflight(file){
    if(!file||typeof file.arrayBuffer!=='function')throw new TypeError('qusoc_file_required');
    if(!file.size)return {...baseReceipt(file,'','EMPTY'),verdict:'BLOCKED',reason:'empty_file'};
    if(file.size>MAX_FILE_BYTES)return {...baseReceipt(file,'','SIZE_LIMIT'),verdict:'BLOCKED',reason:'file_size_limit'};
    const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer),sha=await sha256(buffer),magic=classifyMagic(bytes),ext=extension(file.name),receipt=baseReceipt(file,sha,magic);
    if(BLOCKED_EXTENSIONS.has(ext)||['WINDOWS_EXECUTABLE','ELF_EXECUTABLE','ZIP_CONTAINER'].includes(magic))return {...receipt,verdict:'BLOCKED',reason:'dangerous_or_unsupported_container',stages:{...receipt.stages,localStructure:'BLOCKED'}};
    return {...receipt,verdict:'QUARANTINED_PENDING_QUSOC',reason:'backend_antimalware_sandbox_cdr_required',stages:{...receipt.stages,localStructure:'PASS'}};
  }
  async function inspectLocalText(file){
    const initial=await preflight(file);if(initial.verdict==='BLOCKED')return initial;
    const ext=extension(file.name);if(!TEXT_EXTENSIONS.has(ext)||file.size>MAX_LOCAL_TEXT_BYTES)return {...initial,verdict:'QUARANTINED_PENDING_QUSOC',reason:'local_text_preflight_not_supported'};
    const raw=new Uint8Array(await file.arrayBuffer());if(raw.includes(0))return {...initial,verdict:'BLOCKED',reason:'binary_or_null_byte_detected',stages:{...initial.stages,localStructure:'BLOCKED'}};
    let input;try{input=new TextDecoder('utf-8',{fatal:true}).decode(raw)}catch{return {...initial,verdict:'BLOCKED',reason:'invalid_utf8',stages:{...initial.stages,localStructure:'BLOCKED'}}}
    const suspicious=/<script\b|javascript\s*:|powershell(?:\.exe)?\s+[^\r\n]*(?:-enc|-encodedcommand)|(?:^|[\r\n])\s*(?:cmd(?:\.exe)?|wscript|cscript|rundll32)\b/i;
    if(suspicious.test(input))return {...initial,verdict:'BLOCKED',reason:'active_or_command_content_detected',stages:{...initial.stages,localStructure:'BLOCKED'}};
    const sanitizedText=input.normalize('NFKC').replace(/[\u202A-\u202E\u2066-\u2069]/g,'').replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'');
    if(ext==='json'){try{JSON.parse(sanitizedText)}catch{return {...initial,verdict:'BLOCKED',reason:'invalid_json',stages:{...initial.stages,localStructure:'BLOCKED'}}}}
    const sanitizedBytes=new TextEncoder().encode(sanitizedText);
    return {...initial,verdict:'LOCAL_PREFLIGHT',reason:'local_normalization_only_backend_admission_required',sanitizedText,sanitizedSha256:await sha256(sanitizedBytes),stages:{...initial.stages,localStructure:'PASS',textNormalization:'PASS',cdr:'LOCAL_TEXT_NORMALIZATION_ONLY'}};
  }
  async function assertAdmission(receipt,expectedSha256){if(!receipt||receipt.verdict!=='ADMITTED'||receipt.admissionAuthorized!==true||receipt.quvaultAuthorized!==true)throw new Error('qusoc_admission_required');for(const stage of REQUIRED_ADMISSION_STAGES)if(receipt.stages?.[stage]!=='PASS')throw new Error(`qusoc_stage_not_passed:${stage}`);if(!expectedSha256||receipt.sanitizedSha256!==expectedSha256)throw new Error('qusoc_sanitized_hash_mismatch');return true}
  global.QuSOCIntake=Object.freeze({preflight,inspectLocalText,assertAdmission,MAX_FILE_BYTES,MAX_LOCAL_TEXT_BYTES});
})(window);
