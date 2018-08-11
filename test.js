const expect = require('chai').expect;
const del = require('del');

const Blockchain = require('./simpleChain').Blockchain;
const Block = require('./simpleChain').Block;
let blockchain;

describe('Private Blockchain tests', () => {
  before(() => {
    blockchain = new Blockchain();
    this.timeout
  });

  describe('level db', () => {

    it('should add genesis block as first block', async () => {
      let genesis = await blockchain.getBlock(0);
      expect(genesis.body).to.equal('First block in the chain - Genesis block');
      expect(genesis.height).to.equal(0);
    });

    it('genesis block should have no previous hash', async () => {
      let genesis = await blockchain.getBlock(0);
      expect(genesis.previousBlockHash).to.equal('');
    });

    it('validates a valid block', async () => {
      await blockchain.addBlock(new Block('Random Block'));
      let valid = await blockchain.validateBlock(await blockchain.getBlockHeight() - 1);
      expect(valid).to.equal(true);
    });

    it('second block will have genesis block as previous hash', async () => {
      let genesis = await blockchain.getBlock(0);
      let secondBlock = await blockchain.getBlock(1);
      expect(secondBlock.previousBlockHash).to.equal(genesis.hash);
    });

    it('should validate the chain', async () => {
      expect(await blockchain.validateChain()).to.equal(true);
    });

  });

  after(() => {
  });
});