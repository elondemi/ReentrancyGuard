// Import the required modules and libraries
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Main test suite
describe("Deploy contracts", function () {

  // Define variables for accounts and contracts that will be used in the tests
  let deployer, user, attacker;

  // This function runs before each test to set up the environment
  beforeEach(async function () {

    // Get the signers (accounts) provided by Hardhat
    [deployer, user, attacker] = await ethers.getSigners();

    // Create an instance of the Bank contract and deploy it
    const BankFactory = await ethers.getContractFactory("Bank", deployer);
    this.bankContract = await BankFactory.deploy();

    // Make initial deposits to the bank by the deployer and user
    await this.bankContract.deposit({ value: ethers.utils.parseEther("100") });
    await this.bankContract.connect(user).deposit({ value: ethers.utils.parseEther("50") });

    // Create an instance of the Attacker contract and deploy it with the Bank's address as an argument
    const AttackerFactory = await ethers.getContractFactory("Attacker", attacker);
    this.attackerContract = await AttackerFactory.deploy(this.bankContract.address);
  });

  // Test suite for deposit and withdrawal functionality of the Bank contract
  describe("Test deposit and withdraw of Bank contract", function () {

    // Test to check if the bank contract accepts deposits correctly
    it("Should accept deposits", async function () {

      // Retrieve the balance of deployer in the bank contract and check if it matches the expected value
      const deployerBalance = await this.bankContract.balanceOf(deployer.address);
      expect(deployerBalance).to.eq(ethers.utils.parseEther("100"));

      // Retrieve the balance of user in the bank contract and check if it matches the expected value
      const userBalance = await this.bankContract.balanceOf(user.address);
      expect(userBalance).to.eq(ethers.utils.parseEther("50"));
    });

    // Test to check if the bank contract handles withdrawals correctly
    it("Should accept withdrawals", async function () {

      // Deployer initiates a withdrawal
      await this.bankContract.withdraw();

      // Check if the deployer's balance in the bank contract is 0 after withdrawal
      const deployerBalance = await this.bankContract.balanceOf(deployer.address);
      expect(deployerBalance).to.eq(0);

      // Check if the user's balance remains unaffected
      const userBalance = await this.bankContract.balanceOf(user.address);
      expect(userBalance).to.eq(ethers.utils.parseEther("50"));
    });

    // Test to simulate an attack on the Bank contract
    it("Perform Attack", async function () {

      // Displaying the balances of Bank and Attacker before initiating the attack for clarity
      console.log("");
      console.log("*** Before ***");
      console.log(`Bank's balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.bankContract.address)).toString()}`);
      console.log(`Attacker's balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)).toString()}`);

      // The attacker initiates the attack
      await this.attackerContract.attack({ value: ethers.utils.parseEther("10") });

      // Displaying the balances of Bank and Attacker after the attack for clarity
      console.log("");
      console.log("*** After ***");
      console.log(`Bank's balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.bankContract.address)).toString()}`);
      console.log(`Attackers's balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)).toString()}`);
      console.log("");

      // Asserting that the bank's balance becomes 0 after the attack
      expect(await ethers.provider.getBalance(this.bankContract.address)).to.eq(0);
    });
  });
});
