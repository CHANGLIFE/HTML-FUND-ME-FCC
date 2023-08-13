// in nodejs  => require()

// in js =>  you  can't use require,
// should use import
import { ethers } from "./ethers-5.7.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");

connectButton.onclick = connectMetamask;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connectMetamask() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // 连接到metamask
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    //提示用户钱包已经连接
    //getElementById() 方法可返回对拥有指定 ID 的第一个对象的引用。
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "please install metamask";
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(ethers.utils.formatEther(balance));
  }
}

// fund

async function fund() {
  // 获取前端输入的ETH数量
  const ethAmount = document.getElementById("ethAmount").value;
  console.log(`Funding with ${ethAmount}`);
  if (typeof window.ethereum !== "undefined") {
    // 发送交易的必备条件
    // provider => 连接到区块链上
    // signer /wallet => 签名和付gas
    // ABI & Address => 与合约交互

    // 获取metamask上的一个节点HTTP
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // 获取一个账户
    const signer = provider.getSigner();
    console.log(signer);

    // 将智能合约与账户连接到一起，返回合约实例
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      // 创建交易，对交易签名
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });

      // 监听这个交易

      // 这叫事件循环队列
      // 此时会启动事件监听器，但是不会等待其结束
      // 而是直接开始执行下面的代码逻辑
      // 然后再回过头来查看监听器的返回

      // 解决方法
      // 返回一个promise，在Promise中创建匿名函数，匿名函数执行监听器的逻辑
      // resolve：监听结束时触发
      // reject: 出现错误时触发
      // promise 在resolve() 或者 reject()执行完成之后返回
      await listenForTransactionMine(transactionResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.log(error);
    }
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const transactionResponse = await contract.withdraw();
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Ming ${transactionResponse.hash}...`);
  // 监听交易直到完成

  return new Promise((resolve, reject) => {
    // provider.once() 添加监听器一直到下一次交易触发
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      resolve();
    });
  });
}
