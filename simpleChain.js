/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB, { valueEncoding: 'json' });

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/
class Block {
  constructor(data) {
    this.hash = "",
      this.height = 0,
      this.body = data,
      this.time = 0,
      this.previousBlockHash = ""
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    (async () => {
      if (await this.getBlockHeight() == 0) {
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }
    })();
  }

  // Add new block
  addBlock(newBlock) {
    (async () => {
      // Block height
      newBlock.height = await this.getBlockHeight() + 1
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0, -3);

      //previous hash
      if (newBlock.height > 0) {
        const prevBlock = await this.getBlock(newBlock.height - 1);
        //console.log(prevBlock)
        newBlock.previousBlockHash = prevBlock.hash
      }

      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      await this.addDataToLevelDB(newBlock);
    })();
  }

  // Get block height
  getBlockHeight() {
    let i = 0;

    return new Promise((resolve, reject) => {
      db.createKeyStream().on('data', data => {
        i++;
      }).on('error', err => {
        reject('Unable to read data stream!', err);
      }).on('close', () => {
        resolve(i-=1);
      });
    })
  }

  // get block
  async getBlock(blockHeight) {
    // return object as a single string
    const data = await getLevelDBData(blockHeight);
    return data;
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [];
    const height = await this.getBlockHeight();

    for (var i = 0; i < height; i++) {
      // console.log(await this.getBlock(i));
      // validate block
      if (await !this.validateBlock(i)) errorLog.push(i);
      if (i > 0) {
        const block = await this.getBlock(i);
        const prevBlock = await this.getBlock(i - 1)

        // compare blocks hash link
        if (prevBlock.hash !== block.previousBlockHash) {
          errorLog.push(i);
        }
      }
    }
    if (errorLog.length > 0) {
      // console.log('Block errors = ' + errorLog.length);
      // console.log('Blocks: ' + errorLog);
      return false;
    } else {
      //console.log('No errors detected');
      return true;
    }
  }

  // Add data to levelDB with value
  addDataToLevelDB(value) {
    let i = 0;
    return new Promise((resolve, reject) => {
      db.createReadStream().on('data', function (data) {
        //console.log(data)
        i++;
      }).on('error', (err) => {
        reject('Unable to read data stream!', err);
      }).on('close', async () => {

        await addLevelDBData(i, value);
        resolve();
      });
    });
  }

  viewChain() {

    console.log('\n\n------------Entire Chain---------\n\n');
    return new Promise((resolve, reject) => {
      db.createReadStream().on('data', data => {
        console.log(data);
      }).on('error', err => {
        reject('Unable to read data stream!', err);
      }).on('close', () => {
        resolve();
      });
    })
  }
}

// Add data to levelDB with key/value pair
function addLevelDBData(key, value) {
  return db.put(key, value);
}

// Get data from levelDB with key
function getLevelDBData(key) {
  return db.get(key);
}

module.exports = {
  Blockchain, Block
}
