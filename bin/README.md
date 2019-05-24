# Merkle
Merkle tree and other data structures.

## Install
```bash
$ npm install @gow/merkle --save
```

## Example
```TypeScript
import { MerkleTree } from '@gow/merkle';

// create an array of values to put into a tree
const values = [
    Buffer.from('a'),
    Buffer.from('b'),
    Buffer.from('c'),
    Buffer.from('d')
];

// create a Merkle tree
const tree = MerkleTree.create(values, 'sha256');

// create a proof for the second position in the tree (value 'b')
const proof = tree.prove(1);
console.log(proof[0].toString()); // 'b'

// verify the proof
const result = MerkleTree.verify(tree.root, 1, proof, 'sha256');
console.log(result); // true
```

## API
You can find complete API definitions in [merkle.d.ts](/merkle.d.ts). Here is a quick overview of the most common tasks:

### Creating Merkle trees
You can use two methods to create a Merkle Tree from a list of values:

```TypeScript
MerkleTree.create(values: Buffer[], hashAlgorithm: string): MerkleTree
MerkleTree.createAsync(values: Buffer[], hashAlgorithm: string): Promise<MerkleTree>
```

Both methods take an array of `Buffer` objects and a name of the hash algorithm to use when building the tree. Currently, only 2 hash algorithms are supported: `sha256` and `blake2s256`.

**Note:** async method is currently just a placeholder. All it does is call the sync version and returns the result.

### Creating Merkle proofs
Once you have a tree, you can use it to prove that a value is located at a certain index like so:

```TypeScript
tree.prove(index: number): Buffer[]
```

The returned proof is an array which has the values as the first element, and nodes comprising the proof as all other elements.

You can also create a proof for many indexes at the same time:

```TypeScript
tree.proveBatch(indexes: number[]): BatchMerkleProof
```

The resulting proof is compressed. So, if you need to prove membership of multiple values, this is a much more efficient approach. The batch proof has the following form:

```TypeScript
interface BatchMerkleProof {
    values  : Buffer[];
    nodes   : Buffer[][];
    depth   : number;
}
```
where, `values` are the leaves located at the indexes covered by the proof, `nodes` are the internal nodes that form the actual proof, and `depth` is the depth of the source tree.

### Verifying Merkle proofs
Once you have a proof, you can verify it against a tree root like so:

```TypeScript
MerkleTree.verify(root: Buffer, index: number, proof: Buffer[], hashAlgorithm: string): boolean
```

This will return `true` if the value located at the first position in the `proof` array is indeed located at the specified `index` in the tree.

For the batched version use:

```TypeScript
MerkleTree.verifyBatch(root: Buffer, indexes: number[], proof: BatchMerkleProof, hashAlgorithm: string): boolean
```

Similarly to single-index version, this will return `true` if the values in `proof.values` are indeed located at the specified `indexes` in the tree.

## References

* Wikipedia article on [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree).
* Batch proof/verification use a variation of the Octopus algorithm from [this paper](https://eprint.iacr.org/2017/933.pdf).