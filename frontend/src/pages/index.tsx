import { Button, Image, Input, Table, Space, message, Popconfirm, Descriptions, PageHeader, Card, Tooltip } from 'antd';
import { Header } from "../../asset";
import 'antd/dist/antd.css';
import { UserOutlined, RedoOutlined } from "@ant-design/icons";
import { useEffect, useState } from 'react';
import { lotteryContract, myERC20Contract, web3 } from "../../utils/contracts";
import './index.css';
import { render } from '@testing-library/react';
import type { ColumnsType } from 'antd/es/table';

const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
// TODO change according to your configuration
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'

const LotteryPage = () => {

    const { TextArea } = Input;
    const [myProps, setMyProps] = useState<any[]>([])
    const [allProps, setAllProps] = useState<any[]>([])


    const [ID, setID] = useState(0)
    const [title, setTitle] = useState('')
    const [data, setData] = useState('')

    var index: number

    const [account, setAccount] = useState('')
    const [name, setName] = useState('')
    const [accountBalance, setAccountBalance] = useState(0)
    const [bigcost, setBigcost] = useState(0)
    const [smallcost, setSmallcost] = useState(0)
    const [playAmount, setPlayAmount] = useState(0)
    const [managerAccount, setManagerAccount] = useState('')

    useEffect(() => {
        // 初始化检查用户是否已经连接钱包
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        const initCheckAccounts = async () => {
            // @ts-ignore
            const { ethereum } = window;
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                // 尝试获取连接的用户账户
                const accounts = await web3.eth.getAccounts()
                if (accounts && accounts.length) {
                    setAccount(accounts[0])
                }
            }
        }

        initCheckAccounts()
    }, [])

    useEffect(() => {
        const getLotteryContractInfo = async () => {
            if (lotteryContract) {
                const ma = await lotteryContract.methods.manager().call()
                setManagerAccount(ma)
                const bc = await lotteryContract.methods.INIT_COST().call()
                setBigcost(bc)
                const sc = await lotteryContract.methods.VOTE_COST().call()
                setSmallcost(sc)
                const id = await lotteryContract.methods.ID().call()
                setID(id)
            } else {
                alert('Contract not exists.')
            }
        }

        getLotteryContractInfo()
    }, [])

    useEffect(() => {
        const getAccountInfo = async () => {
            if (myERC20Contract) {
                const ab = await myERC20Contract.methods.balanceOf(account).call()
                setAccountBalance(ab)
            } else {
                alert('Contract not exists.')
            }
        }

        if (account !== '') {
            getAccountInfo()
        }
    }, [account])

    const onClaimTokenAirdrop = async () => {
        if (account === '') {
            message.error('您还没有登陆！')
            return
        }

        if (myERC20Contract) {
            try {
                await myERC20Contract.methods.airdrop().send({
                    from: account
                })
                message.success("您已成功领取500积分")
            } catch (error: any) {
                message.error("请不要重复领取积分！")
            }

        } else {
            alert('Contract not exists.')
        }
    }


    //连接钱包
    const onClickConnectWallet = async () => {
        // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
        // @ts-ignore
        const { ethereum } = window;
        if (!Boolean(ethereum && ethereum.isMetaMask)) {
            alert('MetaMask is not installed!');
            return
        }

        try {
            // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
            if (ethereum.chainId !== GanacheTestChainId) {
                const chain = {
                    chainId: GanacheTestChainId, // Chain-ID
                    chainName: GanacheTestChainName, // Chain-Name
                    rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
                };

                try {
                    // 尝试切换到本地网络
                    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chain.chainId }] })
                } catch (switchError: any) {
                    // 如果本地网络没有添加到Metamask中，添加该网络
                    if (switchError.code === 4902) {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain', params: [chain]
                        });
                    }
                }
            }

            // 小狐狸成功切换网络了，接下来让小狐狸请求用户的授权
            await ethereum.request({ method: 'eth_requestAccounts' });
            // 获取小狐狸拿到的授权用户列表
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            // 如果用户存在，展示其account，否则显示错误信息
            setAccount(accounts[0] || 'Not able to get accounts');
        } catch (error: any) {
            alert(error.message)
        }
    }

    //获取标题
    const getTitle = (e: any) => {
        let word = e.target.value
        setTitle(word)
    }

    //获取内容
    const getData = (e: any) => {
        let word = e.target.value
        setData(word)
    }

    //创建一个新的投票
    const Mint = async () => {
        if (account === '') {
            alert('You have not connected wallet yet.')
            return
        }

        if (lotteryContract && myERC20Contract) {
            try {
                await myERC20Contract.methods.approve(lotteryContract.options.address, bigcost).send({
                    from: account
                })

                await lotteryContract.methods.Mint(title, data, account).send({
                    from: account
                })

                message.success("您的提议已成功提交！")
            } catch (error: any) {
                alert(error.message)
            }
        } else {
            alert('Contract not exists.')
        }
    }

    //显示自己发起的投票
    const showMyProps = async () => {
        const list: any[] = [];
        await myERC20Contract.methods.approve(lotteryContract.options.address, smallcost).send({
            from: account
        })
        for (let index = 1; index <= ID; index++) {
            try {             
                const _addr = await lotteryContract.methods.getAddrbyID(index).call()
                if (account == _addr) {
                    const _name = await lotteryContract.methods.getNamebyID(index).call()
                    const _data = await lotteryContract.methods.getDatabyID(index).call()
                    const _time = await lotteryContract.methods.getTimeLeft(index).call()
                    // alert(_time)
                    const _flag = await lotteryContract.methods.getFlag(index).call()
                    var myflag
                    if (_time > 0) {
                        myflag = "投票中"
                    }
                    else {
                        if (_flag == 0) {
                            myflag = "待开票"
                        }
                        else if (_flag == 1) {
                            myflag = "通过"
                        }
                        else {
                            myflag = "未通过"
                        }

                    }

                    var temp = {
                        key: index,
                        name: _name,
                        flag: myflag,
                        description: _data
                    }
                    list.push(temp)
                }
            } catch (error: any) {
                alert(error.message)
            }


        }
        setMyProps(list)
    }

    //显示所有投票
    const showAllProps = async () => {
        const list: any[] = [];
        await myERC20Contract.methods.approve(lotteryContract.options.address, smallcost).send({
            from: account
        })
        for (let index = 1; index <= ID; index++) {
            try {
                const _addr = await lotteryContract.methods.getAddrbyID(index).call()
                const _name = await lotteryContract.methods.getNamebyID(index).call()
                const _data = await lotteryContract.methods.getDatabyID(index).call()
                const _time = await lotteryContract.methods.getTimeLeft(index).call()
                const _aye = await lotteryContract.methods.getAyes(index).call()
                const _nay = await lotteryContract.methods.getNays(index).call()
                var temp = {
                    key: index,
                    init: _addr,
                    name: _name,
                    time: _time+'s',
                    aye: _aye,
                    nay: _nay,
                    description: _data,

                }
                list.push(temp)
            } catch (error: any) {
                alert(error.message)
            }
        }
        setAllProps(list)
    }

    const showProps = async () => {
        showMyProps();
        showAllProps();

    }

    interface DataTypeMy {
        key: number;
        name: string;
        flag: string;
        description: string;
    }

    const myPropsColumns: ColumnsType<DataTypeMy> = [
        { title: '标题', dataIndex: 'name', key: 'name' },
        { title: '状态', dataIndex: 'flag', key: 'flag' },
    ];

    interface DataTypeAll {
        key: number;
        init: string;
        name: string;
        time: string;
        aye: number;
        nay: number;
        description: string;
    }

    const allPropsColumns: ColumnsType<DataTypeAll> = [
        {
            title: '发起者', dataIndex: 'init', key: 'init', onCell: () => {
                return {
                    style: {
                        maxWidth: 100,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer'
                    }
                }
            }, render: (text) => <Tooltip placement="topLeft" title={text}>{text}</Tooltip>
        },
        { title: '标题', dataIndex: 'name', key: 'name', fixed: 'right' },
        { title: '距截止', dataIndex: 'time', key: 'time', fixed: 'right' },
        { title: '当前赞同数', dataIndex: 'aye', key: 'aye', fixed: 'right' },
        { title: '当前反对数', dataIndex: 'nay', key: 'nay', fixed: 'right' },
        {
            title: '操作',
            dataIndex: '',
            key: 'x',
            render: () => (
                <Space size="middle">
                    <Popconfirm
                        title="您对本提议的态度是"
                        onConfirm={aye}
                        onCancel={nay}
                        okText="赞同"
                        cancelText="反对"
                    >
                        <a href="#">投票</a>
                    </Popconfirm>
                </Space>),
        },
    ];

    const aye = async () => {
        // alert(index)
        if (account === '') {
            alert('您还没有登陆！')
            return
        }
        try {
            await myERC20Contract.methods.approve(lotteryContract.options.address, smallcost).send({
                from: account
            })
            await lotteryContract.methods.Aye(index).send({
                from: account
            })
            const time= await lotteryContract.methods.getTimeLeft(index).call()
            // alert(time);
            if (time>0) message.success('您投了赞同票');
            else message.error('当前不在投票时间段！');
        } catch (error: any) {
            alert(error.message)
        }

    }

    const nay = async () => {
        // alert(index)
        try {
            await myERC20Contract.methods.approve(lotteryContract.options.address, smallcost).send({
                from: account
            })
            await lotteryContract.methods.Nay(index).send({
                from: account
            })
            const time= await lotteryContract.methods.getTimeLeft(index).call()
            // alert(time);
            if (time>0) message.success('您投了反对票');
            else message.error('当前不在可投票时间段！') ;
        } catch (error: any) {
            alert(error.message)
        }
    }

    const close = async () => {
        if (account === '') {
            message.error('您还没有登陆！')
            return
        } else if (account !== managerAccount) {
            // alert(managerAccount)
            message.error('只有管理员才能进行计票！')
            return
        }

        try {
            for (let index = 1; index <= ID; index++){
                await lotteryContract.methods.Close(index).send({
                    from: account
                })
            }
            message.success("您已成功开票！")
        } catch (error: any) {
            alert(error.message)
        }
    }

    return (
        <div>
            <div className="site-page-header-ghost-wrapper">
                <PageHeader
                    onBack={showProps}
                    backIcon=<RedoOutlined />
                    ghost={false}
                    title="学生组织提案投票中心"
                    extra={[
                        <Button key="3" onClick={onClaimTokenAirdrop}>领取积分</Button>,
                        <Button key="2" onClick={close}>统计票数</Button>,
                        <Button key="1" onClick={onClickConnectWallet} type="primary">
                            连接钱包
                        </Button>,
                    ]}
                >
                    <Descriptions size="small" column={1}>
                        <Descriptions.Item label="您拥有积分">{account === '' ? 0 : accountBalance}</Descriptions.Item>
                        <Descriptions.Item label="您的地址是">
                            {account === '' ? '无用户连接' : account}
                        </Descriptions.Item>
                    </Descriptions>
                </PageHeader>
            </div>
            <div className='app-body'>
                <div className='left-side'>
                    <Card title="投票广场">
                        <Table
                            columns={allPropsColumns}
                            expandable={{
                                expandedRowRender: (record) => (
                                    <p style={{ margin: 0 }}>{record.description}</p>
                                )
                            }}
                            dataSource={allProps}
                            rowKey="key"
                            expandIconColumnIndex={0}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        //setState存在延迟，此处弃用
                                        index = record.key
                                        //alert(index)
                                        //aye()
                                    }
                                }
                            }}
                            scroll={{ x: 500 }}
                        />
                    </Card>

                </div>
                <div className='right-side'>
                    <div className='boxes'>
                        <div className='title-box'>
                            <Input.Group compact>
                                <Input onChange={getTitle} style={{ width: '287px' }} placeholder="在此输入标题" />
                                <Button type="primary" onClick={Mint}>提交</Button>
                            </Input.Group>
                        </div>
                        <div className='data-box'>
                            <TextArea onChange={getData} rows={8} placeholder="在此输入内容" />
                        </div>
                    </div>
                    <div className='myprops'>
                        <Table
                            columns={myPropsColumns}
                            expandable={{
                                expandedRowRender: (record) => (
                                    <p style={{ margin: 0 }}>{record.description}</p>
                                )
                            }}
                            dataSource={myProps}
                            rowKey="key"
                            expandIconColumnIndex={0}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        //setState存在延迟，此处弃用
                                        index = record.key
                                        //alert(index)
                                    }
                                }
                            }}
                        />
                    </div>

                </div>
            </div></div>
    )
}

export default LotteryPage
