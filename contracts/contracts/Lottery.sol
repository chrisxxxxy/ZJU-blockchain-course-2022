// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./MyERC20.sol";

contract Lottery {
    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }
    uint256 public constant INIT_COST = 50;
    uint256 public constant VOTE_COST = 5;
    uint256 public constant VOTING_TIME = 60;

    uint256 public ID = 0; //每个提议的ID
    mapping(uint256 => string) public PropName; //提议名称
    mapping(uint256 => string) public PropData; //提议内容
    mapping(uint256 => address) public PropInit; //提议者地址
    mapping(uint256 => uint256) public Flags; //提议的状态， 0:pending 1:pass 2:fail
    mapping(uint256 => uint256) public VoteEnd;
    mapping(uint256 => uint256) public TimeLeft;
    mapping(uint256 => uint256) public AyeCounts;
    mapping(uint256 => uint256) public NayCounts;

    MyERC20 public myERC20; // 代币合约
    address public manager; // 管理员

    // 管理员
    constructor() {
        myERC20 = new MyERC20("ZJUToken", "ZJUTokenSymbol");
        manager = msg.sender;
    }

    //发起一个新的投票
    function Mint(
        string memory name,
        string memory data,
        address _to
    ) public {
        ID++;
        // 将提议的数据存储起来
        PropData[ID] = data;
        PropName[ID] = name;
        PropInit[ID] = _to;

        myERC20.transferFrom(msg.sender, address(this), INIT_COST); //扣除提议所需费用

        Flags[ID] = 0; //设置状态on
        VoteEnd[ID] = uint256(block.timestamp) + VOTING_TIME;
    }

    //返回提案投票剩余时间
    function getTimeLeft(uint256 i) public returns (uint256) {
        if (uint256(block.timestamp) > VoteEnd[i]) {
            TimeLeft[i] = 0;
        } else {
            TimeLeft[i] = VoteEnd[i] - uint256(block.timestamp);
        }
        return TimeLeft[i];
    }

    //返回提案状态
    function getFlag(uint256 i) public view returns (uint256) {
        return Flags[i];
    }

    //返回提案投票赞同票数
    function getAyes(uint256 i) public view returns (uint256) {
        return AyeCounts[i];
    }

    //返回提案投票反对票数
    function getNays(uint256 i) public view returns (uint256) {
        return NayCounts[i];
    }

    //投赞同票
    function Aye(uint256 i) public returns (uint256) {
        if (block.timestamp < VoteEnd[i]) {
            AyeCounts[i]++;
            myERC20.transferFrom(msg.sender, address(this), VOTE_COST);
            return 1;
        } else return 0;
    }

    //投反对票
    function Nay(uint256 i) public returns (uint256) {
        if (block.timestamp < VoteEnd[i]) {
            NayCounts[i]++;
            myERC20.transferFrom(msg.sender, address(this), VOTE_COST);
            return 1;
        } else return 0;
    }

    //开票
    function Close(uint256 i) public onlyManager {
        if (TimeLeft[i] == 0 && Flags[i] == 0) {
            if ((AyeCounts[i] - NayCounts[i]) > 0) {
                Flags[i] = 1;
                myERC20.transfer(
                    PropInit[i],
                    (AyeCounts[i] + NayCounts[i]) * VOTE_COST
                );
            } else {
                Flags[i] = 2;
            }
        }
    }

    //返回提案发起者地址
    function getAddrbyID(uint256 id) external view returns (address) {
        return PropInit[id];
    }

    //返回提案标题
    function getNamebyID(uint256 id) external view returns (string memory) {
        return PropName[id];
    }

    //返回提案内容
    function getDatabyID(uint256 id) external view returns (string memory) {
        return PropData[id];
    }
}
