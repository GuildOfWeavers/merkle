import { expect } from 'chai';

import { MerkleTree } from '../lib/MerkleTree';
import { createHash } from '../lib/hash';

const hash = createHash('sha256');

const leafCount = 8;
const elements = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];
const bElements = elements.map(e => Buffer.from(e));

const h12 = hash.digest(Buffer.from(elements[0] + elements[1]));
const h34 = hash.digest(Buffer.from(elements[2] + elements[3]));
const h56 = hash.digest(Buffer.from(elements[4] + elements[5]));
const h78 = hash.digest(Buffer.from(elements[6] + elements[7]));

const h1234 = hash.merge(h12, h34);
const h5678 = hash.merge(h56, h78);

const hRoot = hash.merge(h1234, h5678);

const root = hRoot.toString();

let tree: MerkleTree;

describe('MerkleTree;', () => {
    describe('create();', () => {
        it('should create new tree', () => {
            const tree = MerkleTree.create(bElements, hash);

            expect(tree.depth).to.equal(3);
            expect(tree.values).to.have.length(elements.length);
            expect(tree.root.toString()).to.equal(root);
        });
    });

    describe('prove();', () => {
        beforeEach(() => {
            tree = MerkleTree.create(bElements, hash);
        });

        describe('should return correct proof for element with index', () => {
            [
                {
                    index: 0,
                    result: [ elements[0], elements[1], h34, h5678 ]
                },
                {
                    index: 1,
                    result: [ elements[1], elements[0], h34, h5678 ]
                },
                {
                    index: 3,
                    result: [ elements[3], elements[2], h12, h5678 ]
                },
                {
                    index: 6,
                    result: [ elements[6], elements[7], h56, h1234 ]
                },
                {
                    index: 7,
                    result: [ elements[7], elements[6], h56, h1234 ]
                }
            ].forEach(({ index, result }) => {
                it(String(index), () => {
                    const proof = tree.prove(index);

                    expect(proof[0].toString()).to.equal(result[0]);
                    expect(proof[1].toString()).to.equal(result[1]);
                    expect(proof[2].toString('hex')).to.equal(result[2].toString('hex'));
                    expect(proof[3].toString('hex')).to.equal(result[3].toString('hex'));
                });
            });
        });

        describe('should return error for nonexistent index', () => {
            [ -1, 20, 1000 ].forEach(index => {
                it(String(index), () => {
                    expect(() => tree.prove(index)).to.throw(`Invalid index: ${index}`);
                });
            });
        });
    });

    describe('verify();', () => {
        beforeEach(() => {
            tree = MerkleTree.create(bElements, hash);
        });

        describe('should verify proof for index', () => {
            [ 0, 1, 3, 6, 7 ].forEach(index => {
                it(String(index), () => {
                    const proof = tree.prove(index);

                    expect(MerkleTree.verify(tree.root, index, proof, hash)).to.be.true;
                });
            });
        });

        describe('should not verify proof', () => {
            [
                [0, 1], [6, 7],
                [1, -1], [1, 8]
            ].forEach(([index, fIndex]) => {
                it(`created for index ${index} but verified for ${fIndex}`, () => {
                    const proof = tree.prove(index);

                    expect(MerkleTree.verify(tree.root, fIndex, proof, hash)).to.be.false;
                });
            });
        });
    });

    describe('proveBatch();', () => {
        beforeEach(() => {
            tree = MerkleTree.create(bElements, hash);
        });

        describe('should return correct proof for indexes', () => {
            [
                {
                    indexes: [3],
                    nodes  : [[bElements[2], h12, h5678]]
                },
                {
                    indexes: [0, 1],
                    nodes  : [[h34, h5678]]
                },
                {
                    indexes: [0, 1, 7],
                    nodes  : [[h34], [bElements[6], h56]]
                },
                {
                    indexes: [0, 1, 6, 7],
                    nodes  : [[h34], [h56]]
                },
                {
                    indexes: [0, 1, 6, 7, 3],
                    nodes  : [[], [bElements[2]], [h56]]
                },
                {
                    indexes: [0, 1, 2, 3, 6, 7],
                    nodes  : [[], [], [h56]]
                },
                {
                    indexes: [0, 1, 6, 7, 4, 5, 2, 3],
                    nodes  : [[], [], [], []]
                }
            ].forEach(({ indexes, nodes }) => {
                it(String(indexes), () => {
                    const proof = tree.proveBatch(indexes);

                    indexes.forEach((index, vIndex) => {
                        expect(proof.values[vIndex].toString()).to.equal(elements[index]);
                    });

                    expect(proof.nodes).to.deep.equal(nodes);

                    expect(proof.depth).to.equal(3);
                });
            });
        });

        describe('should return error for indexes', () => {
            [
                [-1],
                [8],
                [0, 8],
                [8, 0, 1],
                [0, 10, 1],
                [0, 3, -1]
            ].forEach((indexes) => {
                it(String(indexes), () => {
                    expect(() => tree.proveBatch(indexes)).to.throw('Invalid index');
                });
            });
        });
    });

    describe('verifyBatch();', () => {
        beforeEach(() => {
            tree = MerkleTree.create(bElements, hash);
        });

        describe('should verify proof for indexes', () => {
            [
                [3],
                [0, 1],
                [0, 1, 7],
                [0, 1, 6, 7],
                [0, 1, 6, 7, 3],
                [0, 1, 2, 3, 6, 7],
                [0, 1, 6, 7, 4, 5, 2, 3]
            ].forEach(indexes => {
                it(`[${indexes}]`, () => {
                    const proof = tree.proveBatch(indexes);

                    expect(MerkleTree.verifyBatch(tree.root, indexes, proof, hash)).to.be.true;
                });
            });
        });

        describe('should not verify proof', () => {
            [
                [[3],                      []],
                [[3],                      [2]],
                [[0, 1],                   [1]],
                [[0, 1, 7],                [0, 7, 1]],
                [[0, 1, 6, 7],             [0, 1, 2]],
                [[0, 1, 6, 7, 3],          [0, 1, 7, 3]],
                [[0, 1, 2, 3, 6, 7],       [2, 3, 6, 7]],
                [[0, 1, 6, 7, 4, 5, 2, 3], [1, 2, 3, 4]]
            ].forEach(([indexes, fIndexes]) => {
                it(`created for indexes [${indexes}] but verified for [${fIndexes}]`, () => {
                    const proof = tree.proveBatch(indexes);

                    expect(MerkleTree.verifyBatch(tree.root, fIndexes, proof, hash)).to.be.false;
                });
            });
        });
    });
});
