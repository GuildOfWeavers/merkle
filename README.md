# Merkle
Merkle tree and other data structures.

## Install
```bash
$ npm install @guildofweavers/merkle --save
```

## Example
```TypeScript
import { MerkleTree, createHash } from '@guildofweavers/merkle';

// create an array of values to put into a tree
const values = [
    Buffer.from('a'),
    Buffer.from('b'),
    Buffer.from('c'),
    Buffer.from('d')
];

// create a Merkle tree
const hash = createHash('sha256');
const tree = MerkleTree.create(values, hash);

// create a proof for the second position in the tree (value 'b')
const proof = tree.prove(1);
console.log(proof[0].toString()); // 'b'

// verify the proof
const result = MerkleTree.verify(tree.root, 1, proof, hash);
console.log(result); // true
```

## API
You can find complete API definitions in [merkle.d.ts](/merkle.d.ts). Here is a quick overview of the provided functionality:

### Creating Merkle trees
You can use two methods to create a Merkle Tree from a list of values:

* static **create**(values: `Buffer[]` | `Vector`, hash: `Hash`): `MerkleTree`
* static **createAsync**(values: `Buffer[]` | `Vector`, hash: `Hash`): `Promise<MerkleTree>`

The meaning of the parameters is as follows:

| Parameter | Description |
| --------- | ----------- |
| values    | Values that will form the leaves of the Merkle tree. If provided as an array of `Buffer` objects, all buffers are assumed to have the same length (otherwise, bad things will happen). Can also be provided as an object that complies with `Vector` interface. |
| hash      | A [hash](#Hash) object that will be used to hash values and internal nodes. |

**Note:** async method is currently just a placeholder. All it does is call the sync version and returns the result.

### Creating Merkle proofs
Once you have a tree, you can use it to prove that a value is located at a certain index like so:

* **prove**(index: `number`): `Buffer[]`<br />
  The returned proof is an array which has the values as the first element, and nodes comprising the proof as all other elements.

You can also create a proof for many indexes at the same time:

* **proveBatch**(indexes: `number[]`): `BatchMerkleProof`<br />
  The resulting proof is compressed. So, if you need to prove membership of multiple values, this is a much more efficient approach.
  
Batch proof has the following form:

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

* static **verify**(root: `Buffer`, index: `number`, proof: `Buffer[]`, hash: `Hash`): `boolean`<br />
  This will return `true` if the value located at the first position in the `proof` array is indeed located at the specified `index` in the tree.

For the batched version use:

* static **verifyBatch**(root: `Buffer`, indexes: `number[]`, proof: `BatchMerkleProof`, hash: `Hash`): `boolean`<br />
  Similarly to single-index version, this will return `true` if the values in `proof.values` are indeed located at the specified `indexes` in the tree.

### Hash
A `Hash` object is required when creating Merkle trees and when verifying Merkle proofs. Internally, it is used for hashing of all values and tree nodes. To create a Hash object, you can use `createHash()` function:

* **createHash**(algorithm: `string`, useWasm?: `boolean`): `Hash`<br />
  Creates a Hash object for the specified `algorithm`. If the optional `useWasm` parameter is set to _true_, will use a WebAssembly-optimized version of the algorithm. If WASM-optimization is not available for the specified algorithm, throws an error.

* **createHash**(algorithm: `string`, wasmOptions: `WasmOptions`): `Hash`<br />
  Creates a WebAssembly-optimized Hash object for the specified `algorithm` and passes the provided options to it. If WASM-optimization is not available for the specified algorithm, throws an error.

Currently, the following hash algorithms are supported:

| Algorithm  | WASM-optimized |
| ---------- | :------------: |
| sha256     | no             |
| blake2s256 | yes            |

Hash objects returned from `createHash()` function will have the following form:
```TypeScript
interface Hash {
    readonly algorithm  : HashAlgorithm;
    readonly digestSize : number;

    digest(value: Buffer): Buffer;
    merge(a: Buffer, b: Buffer): Buffer;
}
```
where, `digest(value)` hashes the provided value, and `merge(a,b)` hashes a concatenation of values `a` and `b`.

## Performance
Some very informal benchmarks run on Intel Core i5-7300U @ 2.60GHz (single thread) for generating a tree out of 2<sup>20</sup> values:

| Hash Algorithm | Native JS | WASM (external) | WASM (internal)  |
| -------------- | --------- | --------------- | ---------------- |
| sha256         | 3.5 sec   |  N/A            | N/A              |
| blake2s256     | 3.2 sec   | 750 ms          | 650 ms           |

The difference between _external_ and _internal_ cases for WASM is that in the internal case, values from which the tree is to be built are already in WASM memory, while in the external case, they need to be copied into WASM memory.

**Note:** while WebAssembly-optimized version of Blake2s algorithm is much faster at hashing small values (i.e. 32-64 bytes), it is slower at hashing large values. For example, when hashing 1KB values, Node's native implementation is about 30% faster.

## References

* Wikipedia article on [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree).
* Batch proof/verification use a variation of the Octopus algorithm from [this paper](https://eprint.iacr.org/2017/933.pdf).

# License
[MIT](/LICENSE) © 2019 Guild of Weavers