declare module '@gow/merkle' {

    export type HashAlgorithm = 'sha256' | 'blake2s256';
    
    export interface HashFunction {
        (v1: Buffer, v2?: Buffer): Buffer;
    }

    export function getHashDigestSize(hashAlgorithm: HashAlgorithm): number;

    export interface BatchMerkleProof {
        values  : Buffer[];
        nodes   : Buffer[][];
        depth   : number;
    }
    
    export class MerkleTree {

        static create(values: Buffer[], hashAlgorithm: HashAlgorithm): MerkleTree;
        static createAsync(values: Buffer[], hashAlgorithm: HashAlgorithm): Promise<MerkleTree>;

        readonly root   : Buffer;
        readonly values : Buffer[];

        prove(index: number): Buffer[];
        proveBatch(indexes: number[]): BatchMerkleProof;

        static verify(root: Buffer, index: number, proof: Buffer[], hashAlgorithm: HashAlgorithm): boolean;
        static verifyBatch(root: Buffer, indexes: number[], proof: BatchMerkleProof, hashAlgorithm: HashAlgorithm): boolean;
    }

}