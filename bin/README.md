# merkle
Merkle tree and other data structures.

## Install
```bash
$ npm install --save @gow/merkle
```

## Example
```TypeScript
import { MerkleTree } from '@gow/merkle';

// create an array of values to put into the tree
const values = [
    Buffer.from('a'),
    Buffer.from('b'),
    Buffer.from('c'),
    Buffer.from('d')
];

// create a Merkle tree
const tree = MerkleTree.create(values, 'sha256');

// create a proof for the second index in the tree (value 'b')
const proof = tree.prove(2);

// verify the proof
const result = MerkleTree.verify(tree.root, 2, proof, 'sha256');
console.log(result); // true
```

## API
You can find complete API definitions in [merkle.d.ts](/merkle.d.ts). Here is a quick overview of the most common tasks:

### Creating Merkle trees
You can use two methods to create a Merkle Tree from a list of values:

* `MerkleTree.create(values: Buffer[], hashAlgorithm: string): MerkleTree`
* `MerkleTree.createAsync(values: Buffer[], hashAlgorithm: string): Promise<MerkleTree>`

Both methods take an array of `Buffer` objects and a name of the hash algorithm to use when building the tree. Currently, only 2 hash algorithms are supported: `sha256` and `blake2s256`.

**Note:** async method is currently just a placeholder. All it does is call the sync version and returns the result.

### Creating Merkle proofs
Once you have a tree, you can use it to prove that an element is located at a certain index like so:

* `tree.prove(index: number): Buffer[]`

The returned proof is an array which has the element at the specified index as the first value, and nodes comprising the proof at all other indexes.

You can also create a proof for many indexes at the same time:

* `tree.proveBatch(indexes: number[]): BatchMerkleProof`

The resulting proof is compressed. So, if you need to prove membership of multiple elements, this is a much more efficient approach. The batch proof has the following form:

```TypeScript
interface BatchMerkleProof {
    values  : Buffer[];
    nodes   : Buffer[][];
    depth   : number;
}
```
where, `values` are the node leafs located at the indexes covered by the proof, `nodes` are the internal nodes that form the actual proof, and `depth` is the depth of the source tree.

### Verifying Merkle proofs
Once you have a proof, you can verify it against a tree root like so:

* `MerkleTree.verify(root: Buffer, index: number, proof: Buffer[], hashAlgorithm: HashAlgorithm): boolean`

This will return `true` if the value located at the first position in the `proof` array is indeed located at the specified `index`.

For the batched version use:
* `verifyBatch(root: Buffer, indexes: number[], proof: BatchMerkleProof, hashAlgorithm: HashAlgorithm): boolean`

Similarly to single-index version, this will return `true` if the values in `proof.values` are indeed located at the specified `indexes`.

## References

* Wikipedia article on [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree).
* Batch proof/verification use a variation of the Octopus algorithm from [this paper](https://eprint.iacr.org/2017/933.pdf).