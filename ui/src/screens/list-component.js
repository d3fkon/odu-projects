/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { List, Avatar, Skeleton, Modal, Input, notification, Icon, Card } from 'antd';
import Axios from 'axios';
import moment from 'moment';
import Tree from 'react-ui-tree';


const popularTemplates = [
    {
        title: 'React ',
        desc: ''
    },
    {
        title: 'Title 2',
        desc: ''
    },
    {
        title: 'Title 3',
        desc: ''
    },
    {
        title: 'Title 4',
        desc: ''
    },
];
const IP = 'https://secondforlife.serveo.net'
export default class ListComponent extends React.Component {
    state = {
        isLoading: false,
        data: [],
        showNewRepoModel: false,
        repoName: "",
        showOverlayModel: false,
        tree: {}

    }
    componentDidMount = async () => {
        // Get list of repos from 
        this.setState({
            isLoading: true
        })
        const data = await Axios.get('https://secondforlife.serveo.net/repo/list', {
            headers: {
                oauth: localStorage.getItem('oauth'),
                username: localStorage.getItem('userName')
            }
        });
        if (data.data.unauth) {

            localStorage.removeItem('userName');
            localStorage.removeItem('oauth')
            this.props.history.push('/')
        }
        this.setState({
            isLoading: false,
            data: data.data.data
        })
        console.log('LIST DATA')
        console.log(data.data)
    }
    render() {
        const { isLoading } = this.state;
        if (this.state.isLoading)
            return (
                <h1>Center</h1>
            )
        return (
            <div>
                <Modal title="Preview" visible={this.state.showOverlayModel} onOk={() => {
                    this.props.history.push('/edittree?id=' + this.state.templateId)
                }} onCancel={() => {
                    this.setState({
                        showOverlayModel: false
                    })
                }} okText="Edit Template">
                    <Tree tree={this.state.tree} paddingLeft={30} isNodeCollapsed={(node) => false} renderNode={node => {
                        return <span style={{ color: 'black', fontSize: 18 }}>{node.children === undefined ? <span><Icon type="file" theme="filled" /> <span>{node.module.toString().split('@#@')[0]}</span></span> : <span><Icon type="folder" /> <span>{node.module.toString().split('@#@')[0]}</span></span>}</span>

                    }} />
                </Modal>
                <Modal
                    title={isLoading ? 'Loading...' : 'Repo Name'}
                    visible={this.state.showNewRepoModel}
                    onOk={async () => {
                        this.setState({
                            showNewRepoModel: false,
                        });
                        await this.generateRepo();
                        this.setState({
                            repoName: ""
                        })
                    }}
                    onCancel={() => {
                        this.setState({
                            showNewRepoModel: false,
                            repoName: ''
                        })
                    }}
                >
                    <Input placeholder="Repository Name" onChange={(evt) => {
                        this.setState({
                            repoName: evt.target.value
                        });
                    }} value={this.state.repoName} />
                </Modal>
                <List
                    className="demo-loadmore-list"
                    loading={this.state.isLoading}
                    itemLayout="horizontal"
                    dataSource={this.state.data}
                    renderItem={item => (
                        <Card>
                            <List.Item actions={[<a href={'/edittree?id=' + item['template_id']}>Edit Template</a>, <a onClick={
                                () => {
                                    this.handleRepoGeneration(item)
                                }
                            }>New Repo</a>, <a onClick={() => {
                                this.setState({
                                    tree: JSON.parse(item['string']),
                                    templateId: item['template_id']
                                })
                                this.setState({
                                    showOverlayModel: true
                                })
                            }}>View Structure</a>]}>
                                <Skeleton avatar title={false} loading={item.loading} active>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                                        }
                                        title={item.name}
                                        description={`${item.descr}`}

                                    >
                                    </List.Item.Meta>

                                </Skeleton>
                            </List.Item>
                            {moment(item['created_on']).format('LLL')}

                        </Card>
                    )}
                />
            </div>
        );
    }
    generateRepo = async () => {
        this.setState({
            isLoading: true
        })
        notification.open({
            message: 'Generating',
            description: 'Generating new Repository',
        })
        const repoRes = await Axios.post('https://secondforlife.serveo.net/repo/new', {
            oauth: localStorage.getItem('oauth'),
            repoName: this.state.repoName,
            userName: localStorage.getItem('userName')
        })
        console.log("Created new repo", this.state.repoName)
        notification.open({
            message: 'Empty Repository Created',
            description: 'Empty Repository Created. Adding Files...'
        })
        const result = await Axios.post('https://secondforlife.serveo.net/repo/add', {
            justRepo: true,
            templateId: this.state.templateId,
            tree: this.state.tree,
            repoName: this.state.repoName,
            userName: localStorage.getItem('userName'),
            oauth: localStorage.getItem('oauth'),
        })
        notification.open({
            message: 'Success',
            description: 'Success createing a new repository'
        })
        this.setState({
            isLoading: false,
            showNewRepoModel: false
        })
        console.log(result.data);

    }
    handleRepoGeneration = async item => {
        this.setState({
            isLoading: true,
            showNewRepoModel: true
        })

        const data = await Axios.get('https://secondforlife.serveo.net/repo/template/' + item['template_id'], {
            headers: {
                username: localStorage.getItem('userName'),
                oauth: localStorage.getItem('oauth')
            }
        });
        const tree = ((data.data.data.string))
        console.log(data.data.data.string)
        this.setState({
            tree: tree,
            templateId: item['template_id']
        });
        this.setState({
            isLoading: false,
        })
    }
}
