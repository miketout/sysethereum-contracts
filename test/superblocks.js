const truffleAssert = require('truffle-assertions');

const { TestHelper } = require('@openzeppelin/cli');
const { Contracts, ZWeb3 } = require('@openzeppelin/upgrades');

/* Initialize OpenZeppelin's Web3 provider. */
ZWeb3.initialize(web3.currentProvider);

const crypto = require('crypto');
const keccak256 = require('js-sha3').keccak256;
const utils = require('./utils');
const SyscoinSuperblocks = Contracts.getFromLocal('SyscoinSuperblocks');

contract('SyscoinSuperblocks', (accounts) => {
  let superblocks;

  const randomAddress = accounts[0];
  const proxyAdmin = accounts[9];
  const claimManager = accounts[1];
  const erc20Manager = accounts[3];
  const user = accounts[2];
  describe('Utils', () => {
    let hash;
    const oneHash = [
      "0x57a8a9a8de6131bf61f5d385318c10e29a5d826eed6adbdbeedc3a0539908ed4"
    ];
    const twoHashes = [
      "0x2e6e9539f02088efe5abb7082bb6e8ba8df68e1cca543af48f5cc93523bf7209",
      "0x5db4c5556edb6dffe30eb26811327678a54f74b7a3072f2834472ea30ee17360"
    ];
    const threeHashes = [
      "0x6bbe42a26ec5af04eb16da92131ddcd87df55d629d940eaa8f88c0ceb0b9ede6",
      "0xc2213074ba6cf84780030f9dc261fa31999c039811516aaf0fb8fd1e1a9fa0c3",
      "0xde3d260197746a0b509ffa4e05cc8b042f0a0ce472c20d75e17bf58815d395e1"
    ];
    const manyHashes = [
      "0xb2d645742da1443e2439dfe1ee5901aa74680ddd2f11be203595673be5cfc396",
      "0x75520841e64a8acdd669e453d0a55caa7082a35ec6406cf5e73b30cdf34ad0b6",
      "0x6a4a7fdf807e56a39ca842d3e3807e6639af4cf1d05cf6da6154a0b5170f7690",
      "0xde3d260197746a0b509ffa4e05cc8b042f0a0ce472c20d75e17bf58815d395e1",
      "0x6bbe42a26ec5af04eb16da92131ddcd87df55d629d940eaa8f88c0ceb0b9ede6",
      "0x50ab8816b4a1ffa5700ff26bb1fbacce5e3cb93978e57410cfabbe8819a45a4e",
      "0x2e6e9539f02088efe5abb7082bb6e8ba8df68e1cca543af48f5cc93523bf7209",
      "0x57a8a9a8de6131bf61f5d385318c10e29a5d826eed6adbdbeedc3a0539908ed4",
      "0xceace0419d93c9789498de2ed1e75db53143b730f18cff88660297759c719231",
      "0x0ce3bcd684f4f795e549a2ddd1f4c539e8d80813b232a448c56d6b28b74fe3ed",
      "0x5db4c5556edb6dffe30eb26811327678a54f74b7a3072f2834472ea30ee17360",
      "0x03d7be19e9e961691712fde9fd87b706c7d0768a207b84ef6ad1f81ffa90dec5",
      "0x8e5e221b22795d96d3de1cad930d7b131f37b6b9dfcccd3f745b08e6900ef1bd",
      "0xc2213074ba6cf84780030f9dc261fa31999c039811516aaf0fb8fd1e1a9fa0c3",
      "0x38d3dffed604f5a160b327ecde5147eb1aa46e3d154b98644cd2a39f0f9ab915"
    ]
    before(async () => {
      this.project = await TestHelper({from: proxyAdmin});
      superblocks = await this.project.createProxy(SyscoinSuperblocks, {
        initMethod: 'init',
        initArgs: [erc20Manager, claimManager]
      });
    });
    it('Merkle javascript', async () => {
      hash = utils.makeMerkle(oneHash);
      assert.equal(hash, "0x57a8a9a8de6131bf61f5d385318c10e29a5d826eed6adbdbeedc3a0539908ed4", 'One hash array');
      hash = utils.makeMerkle(twoHashes);
      assert.equal(hash, "0xae1c24c61efe6b378017f6055b891dd62747deb23a7939cffe78002f1cfb79ab", 'Two hashes array');
      hash = utils.makeMerkle(threeHashes);
      assert.equal(hash, "0xe1c52ec93d4f4f83783aeede9e6b84b5ded007ec9591b521d6e5e4b6d9512d43", 'Three hashes array');
      hash = utils.makeMerkle(manyHashes);
      assert.equal(hash, "0xee712eefe9b4c9ecd39a71d45e975b83c9427070e54953559e78f45d2cbb03b3", 'Many hashes array');
    })
    it('Superblock id', async () => {
      const merkleRoot = "0xbc89818e52613f36d6cea2edba2c9417f01ee910250dbd85a8647a92e655996b";
      const timestamp = "0x000000000000000000000000000000000000000000000000000000005ada05b9";
      const mtpTimestamp = timestamp;
      const lastHash = "0xe0dd609916339ee7e12272cf5467cf5915d2d41a16816e7118116fb281337367";
      const parentId = "0xe70a134b97a4381e5b6c1f4ae0e1e3726b7284bf03506afacebf92401e255e97";
      const lastBits = "0x00000000";
      const superblockHash = utils.calcSuperblockHash(
        merkleRoot,
        timestamp,
        mtpTimestamp,
        lastHash,
        lastBits,
        parentId
      );
      const id = await superblocks.methods.calcSuperblockHash(merkleRoot, timestamp, mtpTimestamp, lastHash, lastBits, parentId).call();
      assert.equal(id, superblockHash, "Superblock hash should match");
    });
  });
  describe('Verify status transitions', () => {
    let id0;
    let id1;
    let id2;
    let id3;
    const merkleRoot = utils.makeMerkle(['0x0000000000000000000000000000000000000000000000000000000000000000']);
    const timestamp = 1;
    const mtptimestamp = 1;
    const lastBits = 0;
    const lastHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const parentHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    before(async () => {
      superblocks = await this.project.createProxy(SyscoinSuperblocks, {
        initMethod: 'init',
        initArgs: [erc20Manager, claimManager]
      });
    });
    it('Initialized', async () => {
      const result = await superblocks.methods.initialize(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits, parentHash).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
      id0 = result.events.NewSuperblock.returnValues.superblockHash;
    });
    it('Propose', async () => {

      const result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,id0, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
      id1 = result.events.NewSuperblock.returnValues.superblockHash;
    });
    // re-propose works but claimmanager will reject() if validation fails
    it('Re-propose', async () => {
      const result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,id0, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
    });
    it('Bad parent', async () => {
      const result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,"0x0", utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Superblock parent does not exist');
    });
    it('Approve', async () => {
      const result = await superblocks.methods.confirm(id1, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ApprovedSuperblock.event, 'ApprovedSuperblock', 'Superblock confirmed');
    });
    it('Propose bits', async () => {
      const result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,id1, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
      id2 = result.events.NewSuperblock.returnValues.superblockHash;
    });
    it('Challenge', async () => {
      const result = await superblocks.methods.challenge(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ChallengeSuperblock.event, 'ChallengeSuperblock', 'Superblock challenged');
    });
    it('Semi-Approve', async () => {
      const result = await superblocks.methods.semiApprove(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.SemiApprovedSuperblock.event, 'SemiApprovedSuperblock', 'Superblock semi-approved');
    });
    it('Approve bis', async () => {
      const result = await superblocks.methods.confirm(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ApprovedSuperblock.event, 'ApprovedSuperblock', 'Superblock confirmed');
    });
    it('Invalidate bad', async () => {
      const result = await superblocks.methods.invalidate(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Superblock cannot invalidate');
    });
    it('Propose tris', async () => {
      const result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,id2, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
      id3 = result.events.NewSuperblock.returnValues.superblockHash;
    });
    it('Challenge bis', async () => {
      const result = await superblocks.methods.challenge(id3, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ChallengeSuperblock.event, 'ChallengeSuperblock', 'Superblock challenged');
    });
    it('Invalidate', async () => {
      const result = await superblocks.methods.invalidate(id3, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.InvalidSuperblock.event, 'InvalidSuperblock', 'Superblock invalidated');
    });
    it('Approve bad', async () => {
      const result = await superblocks.methods.confirm(id3, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Superblock cannot approve');
    });
  });
  describe('Only ClaimManager can modify', () => {
    let id0;
    let id1;
    let id2;
    let id3;
    const merkleRoot = utils.makeMerkle(['0x0000000000000000000000000000000000000000000000000000000000000000']);
    const timestamp = Math.floor((new Date()).getTime() / 1000) - 10801;
    const mtptimestamp = timestamp;
    const lastHash = '0x00';
    const lastBits = 0;
    const parentHash = '0x00';
    before(async () => {
      superblocks = await this.project.createProxy(SyscoinSuperblocks, {
        initMethod: 'init',
        initArgs: [erc20Manager, claimManager]
      });
    });
    it('Initialized', async () => {
      const result = await superblocks.methods.initialize(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,parentHash).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
      id0 = result.events.NewSuperblock.returnValues.superblockHash;
    });
    it('Propose', async () => {
      let result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits, id0, utils.ZERO_ADDRESS).send({from: randomAddress, gas: 300000});
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Only claimManager can propose');

      result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits, id0, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'ClaimManager can propose');
      id1 = result.events.NewSuperblock.returnValues.superblockHash;
    });
    it('Approve', async () => {
      let result = await superblocks.methods.confirm(id1, claimManager).send({ from: randomAddress, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Only claimManager can propose');

      result = await superblocks.methods.confirm(id1, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ApprovedSuperblock.event, 'ApprovedSuperblock', 'Only claimManager can propose');
    });
    it('Challenge', async () => {
      let result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,id1, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'ClaimManager can propose');
      id2 = result.events.NewSuperblock.returnValues.superblockHash;

      result = await superblocks.methods.challenge(id2, claimManager).send({ from: randomAddress, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Only claimManager can propose');

      result = await superblocks.methods.challenge(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ChallengeSuperblock.event, 'ChallengeSuperblock', 'Superblock challenged');
    });
    it('Semi-Approve', async () => {
      let result = await superblocks.methods.semiApprove(id2, claimManager).send({ from: randomAddress, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Only claimManager can semi-approve');

      result = await superblocks.methods.semiApprove(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.SemiApprovedSuperblock.event, 'SemiApprovedSuperblock', 'Superblock semi-approved');

      result = await superblocks.methods.confirm(id2, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ApprovedSuperblock.event, 'ApprovedSuperblock', 'Superblock confirmed');
    });
    it('Invalidate', async () => {
      let result = await superblocks.methods.propose(merkleRoot, timestamp, mtptimestamp, lastHash, lastBits,id2, utils.ZERO_ADDRESS).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.NewSuperblock.event, 'NewSuperblock', 'New superblock proposed');
      id3 = result.events.NewSuperblock.returnValues.superblockHash;

      result = await superblocks.methods.challenge(id3, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.ChallengeSuperblock.event, 'ChallengeSuperblock', 'Superblock challenged');

      result = await superblocks.methods.invalidate(id3, claimManager).send({ from: randomAddress, gas: 300000 });
      assert.equal(result.events.ErrorSuperblock.event, 'ErrorSuperblock', 'Only claimManager can invalidate');

      result = await superblocks.methods.invalidate(id3, claimManager).send({ from: claimManager, gas: 300000 });
      assert.equal(result.events.InvalidSuperblock.event, 'InvalidSuperblock', 'Superblock invalidated');
    });
  });
  describe("Test bridge transfer cancellation challange", () => {
    it("challengeCancelTransfer()");
  })
  describe("Test pure/view computation functions", () => {
    it("bytesToBytes32", async () => {
      const result = await superblocks.methods.bytesToBytes32("0x0102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f00", 0).call();
      assert.equal(result, "0x0102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f00", "converted bytes are not the expected ones");
    });
    it("bytesToUint32", async () => {
      const result = await superblocks.methods.bytesToUint32("0x01020304", 0).call();
      assert.equal(result, 16909060, "converted bytes are not the expected ones");
    });
    it("bytesToUint16", async () => {
      const result = await superblocks.methods.bytesToUint16("0x0150", 0).call();
      assert.equal(result, 336, "converted bytes are not the expected ones");
    });
    it("parseMintTx()");
    it("getEthReceipt position encoded value field", async () => {
      const receiptValue = "0xf902e00183043a62b901000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021000008000000000000000000000a000000000004000000000000200000000000000000000000000000000000000100000000000000000000000000000010040000000000000000000010000000000000000000000000000000000000001000000000020000000000000000000000000000000000000000008000000000000000000000000002000000000000020000000000000000000000000000000000000000000010000100000000800000000000000000000000000080000000000000000000f901d5f89b94e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a0000000000000000000000000443d9a14fb6ba2a45465bec3767186f404ccea25a0000000000000000000000000000000000000000000000000000000004190ab00f89b94e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a0000000000000000000000000443d9a14fb6ba2a45465bec3767186f404ccea25a00000000000000000000000000000000000000000000000000000000000000000f89994443d9a14fb6ba2a45465bec3767186f404ccea25e1a0aabab1db49e504b5156edf3f99042aeecb9607a08f392589571cd49743aaba8db860000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053000000000000000000000000000000000000000000000000000000004190ab000000000000000000000000000000000000000000000000000000000000000003";
      const txBytes = "0x0674000000010111d5eff70d76f8f79d6c6e20e997327faae7d93807552acf6ab7c13bbf1d69470100000000feffffff020000000000000000fdce066a4dca06020110fd5e02f9025bf851a0766aa7492d2ae288a54aca97778392bf5613d2915d90dde26464b48d5be8da3580808080808080a0093a0a6203d65f7e44887c52ace8f8a2192709a3a6bc0543d8a2b37f5cc646268080808080808080f8b180a065e039f5f3af69df62b366f4eb7a97ff4e1c7d86848ec55771cec5a8699959c2a012abac8fbc8a63519c678d7cc92d5efad164996d11a8a301071ede0bd2ec19d9a0a013abe590ec132a63e580e2ea0a18d1886480a889974798ab33028678c8cf72a0c6dbae6978c357521d177ddd94b3468d33707df73986369a1f4c037bacf9945ca012f8fdd16c30ad5d71514c0ec6e703888211ae468cffc5aabf4339e18a1deb198080808080808080808080f9015220b9014ef9014b8204d5843b9aca008307a12094443d9a14fb6ba2a45465bec3767186f404ccea2580b8e45f959b69000000000000000000000000000000000000000000000000000000004190ab0000000000000000000000000000000000000000000000000000000000752cbd74000000000000000000000000e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000150073c237a0171e48890a824abbda619de705c0c21f00000000000000000000002ba00f68add3f6a7f77623f6da12e8f70c14f71bd3fdcbb1b831b3e076d8d8e24e1da0624dbf368d261761e92980ef2e152edb64b62c859e35b05f95f8a06e9c543d3421a0f18ad7a19f08efbedbcbf0eefea94bf2d523dbbf1fd3714908db02129d901cd30103020110fdf303f903f0f851a0c6024de1de1393e3ce892ea58a0e013dc6b881c26f22f5c4d78de7ebddf0d54080808080808080a0640ecd1152922fee801514f1d52d67a4c932d4cfce07b5704cf3fe06b04e797f8080808080808080f8b180a090a37ae3593541d04e8f18a913f2a67c08b97d437a807497871c0ab5acc96292a0e4ca2f77e9b824594cf0f104a8289216a1f17756c0e17ae00e8b6f1763ec7d3fa09529ccfee51cba8bdc2a77fd39f5588a15d6c5796bffdbc6149962ce43c99308a01cd036c395d623cc975c1222a51856aaf80ece64d59ef3eacca3b73462cbb2d9a05d0de9048ae4214f2af0ee374e0a0024a64b2bdac08b3bd2f53dfee85e23ed068080808080808080808080f902e720b902e3f902e00183043a62b901000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021000008000000000000000000000a000000000004000000000000200000000000000000000000000000000000000100000000000000000000000000000010040000000000000000000010000000000000000000000000000000000000001000000000020000000000000000000000000000000000000000008000000000000000000000000002000000000000020000000000000000000000000000000000000000000010000100000000800000000000000000000000000080000000000000000000f901d5f89b94e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a0000000000000000000000000443d9a14fb6ba2a45465bec3767186f404ccea25a0000000000000000000000000000000000000000000000000000000004190ab00f89b94e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a0000000000000000000000000443d9a14fb6ba2a45465bec3767186f404ccea25a00000000000000000000000000000000000000000000000000000000000000000f89994443d9a14fb6ba2a45465bec3767186f404ccea25e1a0aabab1db49e504b5156edf3f99042aeecb9607a08f392589571cd49743aaba8db860000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053000000000000000000000000000000000000000000000000000000004190ab00000000000000000000000000000000000000000000000000000000000000000321a0a6c0bf9f924ef1cfc4d0b010b2312276807ab5bca40d28c6dd98b21d29de51f0006165550074bd2c75001473c237a0171e48890a824abbda619de705c0c21f00ca9a3b000000007c2bd8cd3108000016001473c237a0171e48890a824abbda619de705c0c21f0247304402204b31223bd4079f3fae5705bf2740e5637556af6f8e747b21b0e256902ac01c9f02202bd33c9ab511777a515e8a4eb784922fa08d963f8f259b2cd657973afb5ee3e7012102aadaeaa38ce0283c9711689a89c99ce93e54cfb0545f28e9bc07f594cf324e8800000000";
      const resultPos = await superblocks.methods.getOpReturnPos(txBytes, 4).call();
      let pos = parseInt(resultPos);
      pos += 3; // skip pushdata2 + 2 bytes for opreturn varint
      
      const result = await superblocks.methods.getEthReceipt(txBytes, pos).call();
      assert.equal(result.toString(), receiptValue, "converted receipt bytes are not the expected ones");
    });
    it("getEthReceipt receipt value non-encoded", async () => {
      const receiptValue = "0xf902c0018305244eb9010000000000000000000000000000000000000000000000000000000000000100020000000000000000010000000000000000000000000000000000000000200000000000000000080001000008000000000000000000000000340000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000020000000000000000000000000000000000000000008120000000000000010000000002000000000000000000000000000000800000000000000000000000800010000000000000000000000000000000000000000000000000000000000000f901b5f89b94fbf4411309e690a6209b7f0d70ea304f8b40ac20f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a000000000000000000000000038945d8004cf4671c45686853452a6510812117ca00000000000000000000000000000000000000000000000000000000008f0d180f89b94fbf4411309e690a6209b7f0d70ea304f8b40ac20f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a000000000000000000000000038945d8004cf4671c45686853452a6510812117ca00000000000000000000000000000000000000000000000000000000000000000f8799438945d8004cf4671c45686853452a6510812117ce1a07def9f73ac6a7ac8fe4dc55f5257d48aed7e3f9d5247b0020598b87a5c369d82b840000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c1440530000000000000000000000000000000000000000000000000000000008f0d180";
      const txBytes = "0x067400000001010d0e68ec4449bddd7e91c5b1eb5a2c793705769dce5e295e77624b6c0f3e0e610100000000feffffff020000000000000000fd3f0b6a4d3b0bfd4e01f9014b8204ce843b9aca008307a1209438945d8004cf4671c45686853452a6510812117c80b8e45f959b690000000000000000000000000000000000000000000000000000000008f0d180000000000000000000000000000000000000000000000000000000002b7d3c01000000000000000000000000fbf4411309e690a6209b7f0d70ea304f8b40ac20000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000015002d68d3fe66b558010a3fa3ebf424bf1b8a59102400000000000000000000002ba01d91266755bdfe30c3b53a485afae06843bf21fb307b9f1947463002ce991f6ca06bdd1b6acc6016bf71e7ad4012e4e38d6552169e5d7148dbf0deca014794fd9efd9e02f9029bf851a045a99ae455983d52604ee2a850ef7548b74ea118f1012297076dbb04b5348a0780808080808080a029cff91398b0056df3adfaa20bb49d3b416a0e69ee2c3117491ab36eca8465788080808080808080f8f180a082c0e775c7a55cd7dc0887cb15c90d760d994cd4d21fe26471164a9a1cc81161a034586b91f0fbbadaf00a6b3ffeeca8500255f6e8697f522a4c3c15c0f506c31ba0efdaeb23d58fcb4a52516e6856cb5cd9b19a5540cff4013a8f1e20b20ca51f5da00edb363b44a099c43f07c57083e05c5014ff4cbf2ea6ded88c009f12c8d0795ba0c3cdf1761eb751ff912eebb22b785e66976c159c193d7a4eb509e37d98c1bfc0a0595feaf2bbd299d9608f6c8533f9fbf0c34542ae423b35b8e89c432ea7645d61a07193d4763528c975c662910c5ca38424794bc8458e5102d8910f87e3edcbfab3808080808080808080f9015220b9014ef9014b8204ce843b9aca008307a1209438945d8004cf4671c45686853452a6510812117c80b8e45f959b690000000000000000000000000000000000000000000000000000000008f0d180000000000000000000000000000000000000000000000000000000002b7d3c01000000000000000000000000fbf4411309e690a6209b7f0d70ea304f8b40ac20000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000015002d68d3fe66b558010a3fa3ebf424bf1b8a59102400000000000000000000002ba01d91266755bdfe30c3b53a485afae06843bf21fb307b9f1947463002ce991f6ca06bdd1b6acc6016bf71e7ad4012e4e38d6552169e5d7148dbf0deca014794fd9e21a0f7b6f97b29bb3b107a1d1378f46f00750c4dacaa479369e4d599273ded5d98cd0105fdc302f902c0018305244eb9010000000000000000000000000000000000000000000000000000000000000100020000000000000000010000000000000000000000000000000000000000200000000000000000080001000008000000000000000000000000340000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000020000000000000000000000000000000000000000008120000000000000010000000002000000000000000000000000000000800000000000000000000000800010000000000000000000000000000000000000000000000000000000000000f901b5f89b94fbf4411309e690a6209b7f0d70ea304f8b40ac20f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a000000000000000000000000038945d8004cf4671c45686853452a6510812117ca00000000000000000000000000000000000000000000000000000000008f0d180f89b94fbf4411309e690a6209b7f0d70ea304f8b40ac20f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a000000000000000000000000038945d8004cf4671c45686853452a6510812117ca00000000000000000000000000000000000000000000000000000000000000000f8799438945d8004cf4671c45686853452a6510812117ce1a07def9f73ac6a7ac8fe4dc55f5257d48aed7e3f9d5247b0020598b87a5c369d82b840000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c1440530000000000000000000000000000000000000000000000000000000008f0d180fd1304f90410f851a087ce28043d98064d651ec747b0ad1424857abda5ebe33cb512394893d0dacaa680808080808080a07965dbc2e42fbbaa7e6b24a3b93068513bea5a0c43a558dddefc2ae33b52f2898080808080808080f8f180a042f337f63d327f55f6c1498506df6bef6cc468107f163fcf9cb20d09a710ecf5a0991789340b01cd84de5499517a62d90a59eb0e44fe076be58b06704d87e0fbfaa0bd5a74c21752411a4442d5bbe4ffd0ecddcf3dee4a9b6166ee8e22b27fce0c7fa0ddf71b73d27d7bd2c06a734dda7505d590151177142905bf1169aed9cb09121da00b46675c3124c8235ba46d8d946f489f9e7e370b586edd3fdfa155cba6da02b0a0bad056ccfa51a0e98c05a8eaee60400170583e31b257bcf84b6db65db0a23e82a0ff2dcf5e1ec682c011fc64bce7e27b78061f2f899b2af4e8b3b9e0ef2ce2409b808080808080808080f902c720b902c3f902c0018305244eb9010000000000000000000000000000000000000000000000000000000000000100020000000000000000010000000000000000000000000000000000000000200000000000000000080001000008000000000000000000000000340000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000020000000000000000000000000000000000000000008120000000000000010000000002000000000000000000000000000000800000000000000000000000800010000000000000000000000000000000000000000000000000000000000000f901b5f89b94fbf4411309e690a6209b7f0d70ea304f8b40ac20f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a000000000000000000000000038945d8004cf4671c45686853452a6510812117ca00000000000000000000000000000000000000000000000000000000008f0d180f89b94fbf4411309e690a6209b7f0d70ea304f8b40ac20f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a000000000000000000000000038945d8004cf4671c45686853452a6510812117ca00000000000000000000000000000000000000000000000000000000000000000f8799438945d8004cf4671c45686853452a6510812117ce1a07def9f73ac6a7ac8fe4dc55f5257d48aed7e3f9d5247b0020598b87a5c369d82b840000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c1440530000000000000000000000000000000000000000000000000000000008f0d18021a06759019d118f4f19694ee8ed58167d2f460834bbb7dac5a0c5fd8ade3816e66f00a8ff53000c7f2e27001447314e644d681ba36d79e541ded7a73f074b265d80d1f0080000000080b9993b0000000016001447314e644d681ba36d79e541ded7a73f074b265d0247304402203ccfa7ffd7987dc9cf13214ec8e6fa5cc9ffb91e44d70a1a54654f25bf6ff0ba022039d595eb84ab6522a1784a20cdea1bf6adbb6444019af26dc1014479e371fcf701210348efe6431378340a7cbd3163527386be8071f96421ac333d7f4d5e01a27b476600000000";
      const resultPos = await superblocks.methods.getOpReturnPos(txBytes, 4).call();
      var pos = parseInt(resultPos);
      pos += 3; // skip pushdata2 + 2 bytes for opreturn varint
      
      const result = await superblocks.methods.getEthReceipt(txBytes, pos).call();
      assert.equal(result.toString(), receiptValue, "converted receipt bytes are not the expected ones");
    });
    it("getLogValuesForTopic", async () => {
      const txBytes = "0x0674000000010111d5eff70d76f8f79d6c6e20e997327faae7d93807552acf6ab7c13bbf1d69470100000000feffffff020000000000000000fdce066a4dca06020110fd5e02f9025bf851a0766aa7492d2ae288a54aca97778392bf5613d2915d90dde26464b48d5be8da3580808080808080a0093a0a6203d65f7e44887c52ace8f8a2192709a3a6bc0543d8a2b37f5cc646268080808080808080f8b180a065e039f5f3af69df62b366f4eb7a97ff4e1c7d86848ec55771cec5a8699959c2a012abac8fbc8a63519c678d7cc92d5efad164996d11a8a301071ede0bd2ec19d9a0a013abe590ec132a63e580e2ea0a18d1886480a889974798ab33028678c8cf72a0c6dbae6978c357521d177ddd94b3468d33707df73986369a1f4c037bacf9945ca012f8fdd16c30ad5d71514c0ec6e703888211ae468cffc5aabf4339e18a1deb198080808080808080808080f9015220b9014ef9014b8204d5843b9aca008307a12094443d9a14fb6ba2a45465bec3767186f404ccea2580b8e45f959b69000000000000000000000000000000000000000000000000000000004190ab0000000000000000000000000000000000000000000000000000000000752cbd74000000000000000000000000e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000150073c237a0171e48890a824abbda619de705c0c21f00000000000000000000002ba00f68add3f6a7f77623f6da12e8f70c14f71bd3fdcbb1b831b3e076d8d8e24e1da0624dbf368d261761e92980ef2e152edb64b62c859e35b05f95f8a06e9c543d3421a0f18ad7a19f08efbedbcbf0eefea94bf2d523dbbf1fd3714908db02129d901cd30103020110fdf303f903f0f851a0c6024de1de1393e3ce892ea58a0e013dc6b881c26f22f5c4d78de7ebddf0d54080808080808080a0640ecd1152922fee801514f1d52d67a4c932d4cfce07b5704cf3fe06b04e797f8080808080808080f8b180a090a37ae3593541d04e8f18a913f2a67c08b97d437a807497871c0ab5acc96292a0e4ca2f77e9b824594cf0f104a8289216a1f17756c0e17ae00e8b6f1763ec7d3fa09529ccfee51cba8bdc2a77fd39f5588a15d6c5796bffdbc6149962ce43c99308a01cd036c395d623cc975c1222a51856aaf80ece64d59ef3eacca3b73462cbb2d9a05d0de9048ae4214f2af0ee374e0a0024a64b2bdac08b3bd2f53dfee85e23ed068080808080808080808080f902e720b902e3f902e00183043a62b901000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021000008000000000000000000000a000000000004000000000000200000000000000000000000000000000000000100000000000000000000000000000010040000000000000000000010000000000000000000000000000000000000001000000000020000000000000000000000000000000000000000008000000000000000000000000002000000000000020000000000000000000000000000000000000000000010000100000000800000000000000000000000000080000000000000000000f901d5f89b94e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8f863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a0000000000000000000000000443d9a14fb6ba2a45465bec3767186f404ccea25a0000000000000000000000000000000000000000000000000000000004190ab00f89b94e3d9ccbaedabd8fd4401aab7752f6f224a7ef1c8f863a08c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925a0000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053a0000000000000000000000000443d9a14fb6ba2a45465bec3767186f404ccea25a00000000000000000000000000000000000000000000000000000000000000000f89994443d9a14fb6ba2a45465bec3767186f404ccea25e1a0aabab1db49e504b5156edf3f99042aeecb9607a08f392589571cd49743aaba8db860000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053000000000000000000000000000000000000000000000000000000004190ab00000000000000000000000000000000000000000000000000000000000000000321a0a6c0bf9f924ef1cfc4d0b010b2312276807ab5bca40d28c6dd98b21d29de51f0006165550074bd2c75001473c237a0171e48890a824abbda619de705c0c21f00ca9a3b000000007c2bd8cd3108000016001473c237a0171e48890a824abbda619de705c0c21f0247304402204b31223bd4079f3fae5705bf2740e5637556af6f8e747b21b0e256902ac01c9f02202bd33c9ab511777a515e8a4eb784922fa08d963f8f259b2cd657973afb5ee3e7012102aadaeaa38ce0283c9711689a89c99ce93e54cfb0545f28e9bc07f594cf324e8800000000";
      
      // SHA3 of TokenFreeze(address,uint256,uint32)
      const tokenFreezeTopic = "0xaabab1db49e504b5156edf3f99042aeecb9607a08f392589571cd49743aaba8d";

      const expectedLogData = "0x000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053000000000000000000000000000000000000000000000000000000004190ab000000000000000000000000000000000000000000000000000000000000000003";

      const resultPos = await superblocks.methods.getOpReturnPos(txBytes, 4).call();
      let pos = parseInt(resultPos);
      pos += 3; // skip pushdata2 + 2 bytes for opreturn varint

      const ethTxReceipt = await superblocks.methods.getEthReceipt(txBytes, pos).call();
      
      const logData = await superblocks.methods.getLogValuesForTopic(ethTxReceipt, tokenFreezeTopic).call();

      assert.equal(logData, expectedLogData, "Log data incorrect");
    })

    it("getBridgeTransactionId", async () => {
      const logData = "0x000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053000000000000000000000000000000000000000000000000000000004190ab000000000000000000000000000000000000000000000000000000000000000003";
      const expectedBridgeTransactionId = "3";

      const bridgeTransactionId = await superblocks.methods.getBridgeTransactionId(logData).call();
      assert.equal(bridgeTransactionId.toString(), expectedBridgeTransactionId, "Value incorrect");
    })
    
    it("getBridgeTransactionId2", async () => {
      const logData = "0x000000000000000000000000b0ea8c9ee8aa87efd28a12de8c034f947c144053000000000000000000000000000000000000000000000000000000004190ab000000000000000000000000000000000000000000000000000000000008f0d180";
      const expectedBridgeTransactionId = "150000000";

      const bridgeTransactionId = await superblocks.methods.getBridgeTransactionId(logData).call();
      assert.equal(bridgeTransactionId.toString(), expectedBridgeTransactionId, "Value incorrect");
    })
  })
  describe('testParseTransaction', () => {
    const keys = [
      'L43bqxCXdZ1Lp6JkBoHE8pUQKi3BBgqrmBRYnNg4adZmRSRU534a',
      'L4N2R2S2WRAnrdwnezs4kHaxsQkRNMrVwgGpHJNgJxGYT788LnGB',
    ].map(utils.syscoinKeyPairFromWIF);
    it('Parse simple transaction with only OP_RETURN and wrong version', async () => {
      const tx = utils.buildSyscoinTransaction({
        signer: keys[1],
        inputs: [['edbbd164551c8961cf5f7f4b22d7a299dd418758b611b84c23770219e427df67', 0]],
        outputs: [
          ['OP_RETURN', 1000001, utils.ethAddressFromKeyPairRaw(keys[1])],
        ],
      });
      tx.version = 0x01;
      const txData = `0x${tx.toHex()}`;
      const [ ret, amount, inputEthAddress, precision, assetGUID ] = Object.values(await superblocks.methods.parseBurnTx(txData).call());
      assert.equal(ret, 10170, 'Error Parsing, wrong version');
      assert.equal(amount, 0, 'Amount burned');
      
    });
    it('Parse simple transaction with only OP_RETURN', async () => {
      const tx = utils.buildSyscoinTransaction({
        signer: keys[1],
        inputs: [['edbbd164551c8961cf5f7f4b22d7a299dd418758b611b84c23770219e427df67', 0]],
        outputs: [
          ['OP_RETURN', 1000001, utils.ethAddressFromKeyPairRaw(keys[1])],
        ],
      });
      tx.version = 0x7407;
      const txData = `0x${tx.toHex()}`;
      await truffleAssert.reverts(superblocks.methods.parseBurnTx(txData).send({from: randomAddress}));

    });
    
    it('Parse simple transaction without OP_RETURN', async () => {
      const tx = utils.buildSyscoinTransaction({
        signer: keys[1],
        inputs: [['edbbd164551c8961cf5f7f4b22d7a299dd418758b611b84c23770219e427df67', 0]],
        outputs: [
          [utils.syscoinAddressFromKeyPair(keys[1]), 1000001],
          [utils.syscoinAddressFromKeyPair(keys[0]), 1000002],
        ],
      });
      tx.version = 0x7407;
      const txData = `0x${tx.toHex()}`;
      await truffleAssert.reverts(superblocks.methods.parseBurnTx(txData).send({from: randomAddress}));
    });  
    it('Parse transaction with OP_RETURN in vout 1', async () => {
      const tx = utils.buildSyscoinTransaction({
        signer: keys[1],
        inputs: [['edbbd164551c8961cf5f7f4b22d7a299dd418758b611b84c23770219e427df67', 0]],
        outputs: [
          [utils.syscoinAddressFromKeyPair(keys[0]), 1000002],
          ['OP_RETURN', 1000001, utils.ethAddressFromKeyPairRaw(keys[1])],
        ],
      });
      tx.version = 0x7407;
      const txData = `0x${tx.toHex()}`;
      await truffleAssert.reverts(superblocks.methods.parseBurnTx(txData).send({from: randomAddress}));
      
    });
    it('Parse transaction with OP_RETURN', async () => {
      const tx = utils.buildSyscoinTransaction({
        signer: keys[1],
        inputs: [['edbbd164551c8961cf5f7f4b22d7a299dd418758b611b84c23770219e427df67', 0]],
        outputs: [
          ['OP_RETURN', 1000001, utils.ethAddressFromKeyPairRaw(keys[1])],
          [utils.syscoinAddressFromKeyPair(keys[0]), 1000002],
        ],
      });
      tx.version = 0x7407;
      const txData = `0x${tx.toHex()}`;
      
      await truffleAssert.reverts(superblocks.methods.parseBurnTx(txData).send({from: randomAddress}));
    });
  });
});
