import { MerkleTree, createHash } from '../index';

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

console.log(tree.getLeaves().map(v => v.toString()));