declare module '@guildofweavers/merkle' {

    // HASHING
    // --------------------------------------------------------------------------------------------
    export type HashAlgorithm = 'sha256' | 'blake2s256';

    /**
     * Creates a Hash object for the specified algorithm; if useWasm is set to true, will use a
     * WebAssembly-optimized version of the algorithm. If WASM-optimization is not available for
     * the specified algorithm, throws an error.
     */
    export function createHash(algorithm: HashAlgorithm, useWasm?: boolean): Hash;

    /**
     * Creates a WebAssembly-optimized Hash object for the specified algorithm and passes provided
     * options to it. If WASM-optimization is not available for the specified algorithm, throws
     * an error.
     */
    export function createHash(algorithm: HashAlgorithm, options: Partial<WasmOptions>): Hash;

    export interface WasmOptions {
        readonly memory: WebAssembly.Memory;
    }

    export interface Hash {
        readonly algorithm  : HashAlgorithm;
        readonly digestSize : number;

        /** Hashes the provided value */
        digest(value: Buffer): Buffer;

        /** Hashes a concatenation of a and b */
        merge(a: Buffer, b: Buffer): Buffer;

        buildMerkleNodes(depth: number, leaves: Vector): ArrayBuffer;
    }

    // MERKLE TREE
    // --------------------------------------------------------------------------------------------
    export class MerkleTree {

        /**
         * Returns a Merkle tree created from the specified values
         * @param values Values that form the leaves of the tree
         * @param hash Hash object to use for hashing of internal nodes
         */
        static create(values: Buffer[] | Vector, hash: Hash): MerkleTree;

        /**
         * Returns a Promise for a Merkle tree created from the specified values
         * @param values Values that form the leaves of the tree
         * @param hash Hash object to use for hashing of internal nodes
         */
        static createAsync(values: Buffer[] | Vector, hash: Hash): Promise<MerkleTree>;

        /** Root of the tree */
        readonly root: Buffer;

        /** Returns a leaf node located at the specified index */
        getLeaf(index: number): Buffer;

        /** Returns all leaf nodes of the tree */
        getLeaves(): Buffer[];

        /** Returns a Merkle proof for a single leaf at the specified index */
        prove(index: number): Buffer[];

        /** Returns a compressed Merkle proof for leaves at the specified indexes */
        proveBatch(indexes: number[]): BatchMerkleProof;

        /**
         * Verifies Merkle proof for a single index
         * @param root Root of the Merkle tree
         * @param index Index of a leaf to verify
         * @param proof Merkle proof for the leaf at the specified index
         * @param hash Hash object to use for hashing of internal nodes
         */
        static verify(root: Buffer, index: number, proof: Buffer[], hash: Hash): boolean;

        /**
         * Verifies Merkle proof for a list of indexes
         * @param root Root of the Merkle tree
         * @param index Indexes of leaves to verify
         * @param proof Compressed Merkle proof for the leaves at the specified indexes
         * @param hash Hash object to use for hashing of internal nodes
         */
        static verifyBatch(root: Buffer, indexes: number[], proof: BatchMerkleProof, hash: Hash): boolean;
    }

    export interface BatchMerkleProof {
        /** leaf nodes located at the indexes covered by the proof */
        values: Buffer[];

        /** Internal nodes that form the actual proof */
        nodes: Buffer[][];

        /** Depth of the source Merkle tree */
        depth: number;
    }

    // INTERNAL DATA STRUCTURES
    // --------------------------------------------------------------------------------------------
    export interface Vector {
        readonly length         : number;
        readonly byteLength     : number;
        readonly elementSize    : number;

        toBuffer(startIdx?: number, elementCount?: number): Buffer;
    }
}