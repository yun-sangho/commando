"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type Rank = '이병' | '일병' | '상병' | '병장' | '하사' | '중사' | '상사' | '원사' | '소위' | '중위' | '대위' | '소령' | '중령' | '대령';

export interface SoldierIdentityNFTMeta {
  tokenId: string;          // On-chain token id (mock)
  contract: string;         // Contract address (mock)
  chainId: number;          // Mock chain/network id
  issuedAt: number;         // Timestamp of issuance
  txHash: string;           // Mint transaction hash (mock)
  ownerWallet: string;      // Wallet address (mock)
  metadataCid: string;      // IPFS / Arweave CID placeholder
  fingerprint: string;      // Deterministic hash of core fields
}

export interface SoldierIdentityCore {
  serviceNumber: string; // 군번
  name: string;
  rank: Rank;
  unit?: string;
}

export interface SoldierIdentity extends SoldierIdentityCore {
  nft: SoldierIdentityNFTMeta;
  verified: boolean;       // Local verification flag
  lastVerifiedAt?: number;
}

export interface SignatureRecord {
  id: string;
  payload: string; // canonical string that was signed
  signature: string; // mock signature
  createdAt: number;
  valid: boolean;
}

interface IdentityState {
  identity?: SoldierIdentity;
  signatures: SignatureRecord[];
  mint: (core: SoldierIdentityCore) => void;
  verify: () => void;
  revoke: () => void;
  signProof: (message: string) => void;
  verifySignature: (id: string) => void;
  deleteSignature: (id: string) => void;
}

function toBase64Utf8(str: string) {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  // Encode UTF-8 safely for browser
  return btoa(unescape(encodeURIComponent(str)));
}

function fingerprint(core: SoldierIdentityCore) {
  return toBase64Utf8(`${core.serviceNumber}|${core.name}|${core.rank}`).replace(/=+$/,'');
}

export const useIdentityStore = create<IdentityState>()(persist((set, get) => ({
  identity: undefined,
  signatures: [],
  mint: (core) => {
    if (get().identity) return; // Prevent double mint
    const tokenId = Math.floor(Math.random()*1e9).toString(16);
    const issuedAt = Date.now();
    const nft: SoldierIdentityNFTMeta = {
      tokenId,
      contract: '0xIDCARDDEMO000000000000000000000000000001',
      chainId: 7777,
      issuedAt,
      txHash: '0x' + nanoid(32),
      ownerWallet: '0xWALLET' + nanoid(8),
      metadataCid: 'bafy-' + nanoid(10),
      fingerprint: fingerprint(core)
    };
    set({ identity: { ...core, nft, verified: false }, signatures: [] });
  },
  verify: () => set(s => s.identity ? ({ identity: { ...s.identity, verified: true, lastVerifiedAt: Date.now() }}) : s),
  revoke: () => set({ identity: undefined, signatures: [] }),
  signProof: (message) => {
    const idState = get().identity;
    if (!idState) return;
    const canonical = `ID:${idState.nft.tokenId}|${idState.nft.fingerprint}|MSG:${message}`;
    // Mock signature = base64 of canonical + txHash slice
  const sig = toBase64Utf8(canonical + '|' + idState.nft.txHash.slice(0,12)).replace(/=+$/,'');
    const rec: SignatureRecord = { id: nanoid(), payload: canonical, signature: sig, createdAt: Date.now(), valid: true };
    set(s => ({ signatures: [rec, ...s.signatures].slice(0,25) }));
  },
  verifySignature: (id) => {
    set(s => ({ signatures: s.signatures.map(r => r.id === id ? { ...r, valid: r.signature.length > 10 } : r) }));
  },
  deleteSignature: (id) => set(s => ({ signatures: s.signatures.filter(r => r.id !== id) }))
}), { name: 'identity-store' }));
