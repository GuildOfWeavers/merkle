declare module '@guildofweavers/merkle' {

    /** Algorithms that can be used to hash internal tree nodes */
    export type HashAlgorithm = 'sha256' | 'blake2s256' | 'wasmBlake2s256';
    
    /** Returns digest size (in bytes) for the specified hash algorithm */
    export function getHashDigestSize(hashAlgorithm: HashAlgorithm): number;

    /** Returns a hash function for the specified algorithm */
    export function getHashFunction(hashAlgorithm: HashAlgorithm): HashFunction;

    export class MerkleTree {

        /**
         * Returns a Merkle tree created from the specified values
         * @param values Values that form the leaves of the tree
         * @param hashAlgorithm Algorithm to use for hashing of internal nodes
         */
        static create(values: Buffer[] | WasmArray, hashAlgorithm: HashAlgorithm): MerkleTree;

        /**
         * Returns a Promise for a Merkle tree created from the specified values
         * @param values Values that form the leaves of the tree
         * @param hashAlgorithm Algorithm to use for hashing of internal nodes
         */
        static createAsync(values: Buffer[], hashAlgorithm: HashAlgorithm): Promise<MerkleTree>;

        /** Root of the tree */
        readonly root: Buffer;

        /** Leaves of the tree */
        readonly values: Buffer[];

        /** Returns a Merkle proof for a single leaf at the specified index */
        prove(index: number): Buffer[];

        /** Returns a compressed Merkle proof for leaves at the specified indexes */
        proveBatch(indexes: number[]): BatchMerkleProof;

        /**
         * Verifies Merkle proof for a single index
         * @param root Root of the Merkle tree
         * @param index Index of a leaf to verify
         * @param proof Merkle proof for the leaf at the specified index
         * @param hashAlgorithm Algorithm used for hashing of internal nodes
         */
        static verify(root: Buffer, index: number, proof: Buffer[], hashAlgorithm: HashAlgorithm): boolean;

        /**
         * Verifies Merkle proof for a list of indexes
         * @param root Root of the Merkle tree
         * @param index Indexes of leaves to verify
         * @param proof Compressed Merkle proof for the leaves at the specified indexes
         * @param hashAlgorithm Algorithm used for hashing of internal nodes
         */
        static verifyBatch(root: Buffer, indexes: number[], proof: BatchMerkleProof, hashAlgorithm: HashAlgorithm): boolean;
    }

    export interface BatchMerkleProof {
        /** leaf nodes located at the indexes covered by the proof */
        values: Buffer[];

        /** Internal nodes that form the actual proof */
        nodes: Buffer[][];

        /** Depth of the source Merkle tree */
        depth: number;
    }

    export interface HashFunction {
        (v1: Buffer, v2?: Buffer): Buffer;
    }

    export interface WasmArray {
        readonly length         : number;
        readonly byteLength     : number;
        readonly elementSize    : number;

        toBuffer(offset?: number, byteLength?: number): Buffer;
    }

    export interface Hash {
        readonly algorithm  : HashAlgorithm;
        readonly digestSize : number;

        digest(value: Buffer): Buffer;
        merge(a: Buffer, b: Buffer): Buffer;

        buildMerkleNodes(depth: number, leaves: Buffer[]): Buffer;
    }
}