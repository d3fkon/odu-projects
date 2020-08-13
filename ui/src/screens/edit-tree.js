import React from 'react';
import Tree from 'react-ui-tree';
import shortid from 'shortid'
import '../App.css';
import '../lib-ui.css';
import '../theme.css';
import { Input, Icon, Button, Layout, Row, Modal, Col, notification, Radio } from 'antd';
import Axios from 'axios';
import { withRouter } from 'react-router-dom'
import { header } from 'express-validator';
import queryString from 'querystring';
import Editor from 'react-simple-code-editor';
import AceEditor from 'react-ace';
import filenamify from 'filenamify';

const { Header, Content, Footer } = Layout;
const IP = 'https://secondforlife.serveo.net'

export default withRouter(({ history }) => (
    <TreeScreen history={history} />
))

class TreeScreen extends React.Component {
    componentDidMount = () => {
        if (!localStorage.getItem('oauth') || !localStorage.getItem('userName')) {
            this.props.history.goBack();
        }
    }
    state = {
    }
    render() {
        return (
            <Layout>
                <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                    <div className="logo" >
                        <span style={{
                            color: 'white'
                        }}>
                            <h2 style={{ color: 'white' }}>Edit your template</h2>
                        </span>
                    </div>

                </Header>
                <Content style={{ padding: '0 50px', marginTop: 64 }}>
                    <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
                        <span>
                            <TreeComponent history={this.props.history} />
                        </span>
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>cs.odu.edu</Footer>
            </Layout>
        )
    }
}


class TreeComponent extends React.Component {
    state = {
        isModelVisible: true,
        editedText: '',
        repoName: '',
        templateName: '',
        currentNewTextBox: '',
        newText: '',
        lookup: {},
        newNames: {},
        active: '/',
        editedContent: '',
        showContentDialog: false,
        contentNode: {},
        tree: {
            "module": "/",
            children: [
            ]
        },
        showAddNewDialog: false,
        newType: 'File',
        projType: 'Template',
        templateDesc: "",
        data: "",
        showRepoNameDialog: false
    };
    /**
     * Tree Manipulation
     */

    lookup = {}
    buildLookup = (node, parent) => {
        node.parent = parent;
        this.lookup[node.module] = node;
        // this.setState({
        //   lookup: {...this.state.lookup, [node.module]: node}
        // })
        if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
                this.buildLookup(node.children[i], node);
            }
        }
    }
    treeFromLookup = (newTree, lookupObj, moduleName) => {
        newTree = lookupObj[moduleName];
        if (this.state.newNames[moduleName]) {
            newTree.module = this.state.newNames[moduleName]
        }
        newTree.parent = undefined
        if (newTree.children !== undefined) {
            const children = []
            newTree.children.forEach((child) => {
                if (this.state.lookup[child.module] !== null) {
                    const index = newTree.children.indexOf(child);
                    let obj = this.treeFromLookup(newTree, lookupObj, newTree.children[index].module);
                    children.push(obj)
                }
            })
            newTree.children = children
        }
        return newTree;
    }
    editContent = (node) => {
        this.setState({
            editContent: node.content,
            showContentDialog: true
        })
    }
    objectFlip = (obj) => {
        const ret = {};
        Object.keys(obj).forEach((key) => {
            ret[obj[key]] = key;
        });
        return ret;
    }
    deleteFromLookup = (lookupObj, moduleName) => {
        const flippedAlias = this.objectFlip(this.state.newNames);
        if (flippedAlias[moduleName]) {
            // moduleName = flippedAlias[moduleName];
        }
        console.log(' """""', moduleName, lookupObj)

        lookupObj[moduleName] = null;
        return lookupObj;
    }
    newNames = {}
    finishContentEditing = (lookupObj, node) => {
        // this.state.newNames[node.module
        lookupObj[node.module].content = this.state.editedContent;
        return lookupObj;
    }
    editInLookup = (lookupObj, moduleName, newName) => {
        if (!lookupObj[moduleName]) return lookupObj
        this.state.newNames[moduleName] = newName;
        return lookupObj;
    }

    addFile = (lookupObj, module, fileName) => {
        // if (fileName.toString().split('@#@').trim() === '') {
        //     return lookupObj
        // }
        const newModule = {}
        newModule.module = filenamify(fileName);
        newModule.content = '';
        module.children.push(newModule);
        lookupObj[fileName] = newModule;
        return lookupObj;
    }

    addDir = (lookupObj, module, dirName) => {
        // if (dirName.toString().split('@#@').trim() === '') {
        //     return lookupObj
        // }
        const newModule = {}
        newModule.module = filenamify(dirName);
        newModule.children = [];
        module.children.push(newModule);
        lookupObj[dirName] = newModule;
        return lookupObj;
    }
    getModule = (lookupObj, moduleName) => {
        const flippedAlias = this.objectFlip(this.newNames);
        if (this.newNames[moduleName])
            moduleName = flippedAlias[moduleName];
        return lookupObj[moduleName];
    }
    /**
     * End Tree Manipulation
     */
    renderNode = node => {
        if (node.module === '/') {
            return <div style={{ fontSize: 25 }}>
                {this.state.repoName}
                {this.renderNewTextBox(node)}
            </div>
        }
        // if (node === this.state.active) {
        //     return <div>
        //         <Input size="small" onChange={(e) => this.onTextChange(node, e)} placeholder={node.module.toString().split('@#@')[0]} autoFocus value={this.state.editedText.split('@#@')[0]}
        //             style={{
        //                 width: 150
        //             }} />
        //         <Icon onClick={() => this.onEditSubmit(node)} type="check" />
        //     </div>
        // }

        return (
            <span
                className={({
                    'is-active': node === this.state.active
                })}
            >
                {this.renderBasicNode(node)}
                {/* {node.children === undefined ? <div /> : this.renderNewTextBox(node)} */}

            </span>
        );
    };
    onNewTextChange = (node, event) => {
        this.setState({
            currentNewTextBox: node.module,

            newText: event.target.value
        })
    }
    renderBasicNode = node => (
        <span style={{}}>
            <span onClick={() => this.onClickNode(node)} style={{
                fontWeight: 400,
                fontSize: 16,
                color: 'black',
                backgroundColor: node === this.state.active ? '#b2dfdb' : undefined
            }}>{<span style={{ color: 'black', fontSize: 18 }}>{node.children === undefined ? <span><Icon theme="filled" type="file" style={{ color: '#673AB7' }} /> <span>{node.module.toString().split('@#@')[0]}</span></span> : <span><Icon type="folder" theme="filled" style={{ color: '#ffd600', fontSize: 20 }} /> <span>{node.module.toString().split('@#@')[0]}</span></span>}</span>}</span>
            <Icon type='delete' onClick={() => this.deleteNode(node)} style={{ color: '#E91E63', fontSize: 20, marginLeft: 10 }}>
                Delete
            </Icon>
            {node.children ? this.renderNewTextBox(node) : <Icon type='edit' theme="filled" onClick={() => {
                console.log(this.state.contentNode)
                this.setState({
                    showContentDialog: true,
                    contentNode: node
                })
            }} style={{ color: '#009688', fontSize: 20, marginLeft: 10 }}>
            </Icon>}
        </span>
    );
    renderNewTextBox = node => (
        <Icon size='small' type='plus-square' onClick={() => {
            this.setState({
                showAddNewDialog: true,
                currentNode: node
            });
            this.handleChange(
                this.treeFromLookup({}, this.state.lookup, '/')
            )

        }} style={{
            fontSize: 20,
            marginLeft: 10,
            color: '#009688'
        }} />
    )
    onEditSubmit = node => {
        const editedText = this.state.editedText + '@#@' + shortid.generate();
        this.setState({
            active: null,
            lookup: this.editInLookup(this.state.lookup, node.module, editedText)
        });
        this.handleChange(
            this.treeFromLookup({}, this.state.lookup, '/')
        )
    }
    onTextChange = (node, event) => {
        console.log(event.target.value)
        this.setState({
            // lookup: this.editInLookup(this.state.lookup, node.module, event.target.value)
            editedText: event.target.value
        });
        console.log(this.state.lookup)

    }
    deleteNode = node => {
        console.log('REMOVING ' + node.module)
        this.handleChange(
            this.removeFromTree(this.state.tree, node.module)
        )
    }
    removeFromTree = (parent, childNameToRemove) => {
        console.log(this.state.lookup)
        this.setState({
            lookup: this.deleteFromLookup(this.state.lookup, childNameToRemove)
        });
        console.log(this.state.lookup)
        return this.treeFromLookup({}, this.state.lookup, '/')
    }
    onClickNode = node => {
        this.setState({
            active: node,
            editedText: node.module,
            contentNode: node
        });
        console.log(this.state.active)
    };
    onRepoNameChange = name => {
        this.setState({
            repoName: name.target.value
        })
        console.log(name.target.value)
    }
    createRepo = async () => {
        notification.open({
            message: "Uploading Repository",
            description: "Creating a new Repository for you. Please wait"
            
        })
        const res = await Axios.post(IP + '/repo/add', {
            repoName: this.state.repoName,
            tree: this.state.tree,
            oauth: localStorage.getItem('oauth'),
            userName: localStorage.getItem('userName'),
            justTemplate: false,
            justRepo: true,
            templateId: this.state.templateId
        });
        notification.open({
            message: "Success",
            description: "Created a new Repository"
        });
        this.setState({
            showRepoNameDialog: false
        })
        this.props.history.push('/')
    }
    render() {
        console.log(typeof (this.state.tree))
        return (
            <div style={{}}>
                <Modal
                    title="Add a new Directory/File"
                    visible={this.state.showAddNewDialog}
                    onOk={() => {
                        console.log(this.state.newText)
                        if (this.state.newText.trim() === '') {
                            this.setState({ showAddNewDialog: false });
                            return;
                        }
                        const newFileName = this.state.newText + '@#@' + shortid.generate();
                        const node = this.state.currentNode;
                        if (this.state.newType === 'File') {
                            this.setState({
                                lookup: this.addFile(this.state.lookup, node, newFileName),
                                newText: "",
                            });
                            this.setState({
                                // contentNode: this.state.lookup[newFileName],
                                contentNode: node
                            });
                            // this.finishContentEditing(this.state.lookup, this.state.contentNode);


                        }
                        if (this.state.newType === 'Dir')
                            this.setState({
                                lookup: this.addDir(this.state.lookup, node, this.state.newText + '@#@' + shortid.generate()),
                                newText: "",
                            });
                        this.handleChange(
                            this.treeFromLookup({}, this.state.lookup, '/')
                        );
                        this.setState({
                            showAddNewDialog: false
                        })
                    }}
                    onCancel={() => {
                        this.setState({
                            showAddNewDialog: false
                        })
                    }}
                >
                    <Input onChange={(e) => {
                        this.setState({
                            newText: e.target.value
                        })

                    }} placeholder="New File/Dir name" value={this.state.newText} />
                    <Radio.Group defaultValue='File' style={{ margin: 10, marginLeft: 0 }} buttonStyle="solid" onChange={(e) => {
                        this.setState({
                            newType: e.target.value
                        })
                    }}>
                        <Radio.Button value="File" >File</Radio.Button>
                        <Radio.Button value="Dir" >Dir</Radio.Button>
                    </Radio.Group>
                    {this.state.newType === 'File' && <Input.TextArea value={this.state.contentNode.content} onChange={(str) => {
                        this.setState({
                            editedContent: str.target.value,
                            contentNode: {
                                ...this.state.contentNode,
                                content: str.target.value
                            }
                        })
                    }} style={{
                        marginBottom: 10
                    }}
                        placeholder="Content"
                    />}

                </Modal>
                <Modal
                    title="File Contents"
                    visible={this.state.showContentDialog}
                    onOk={() => {
                        this.setState({
                            showContentDialog: false,
                        });
                        this.finishContentEditing(this.state.lookup, this.state.contentNode);
                        this.setState({
                            editContent: false,
                        })
                        this.handleChange(this.treeFromLookup({}, this.state.lookup, '/'))
                    }}
                    onCancel={() => {
                        this.setState({
                            showContentDialog: false
                        })
                    }}
                >
                    <Input.TextArea value={this.state.contentNode.content} onChange={(str) => {
                        this.setState({
                            editedContent: str.target.value,
                            contentNode: {
                                ...this.state.contentNode,
                                content: str.target.value
                            }
                        })
                    }}
                        autoFocus
                        style={{
                            marginBottom: 10
                        }}
                        placeholder="Content"
                    />

                </Modal>
                <Modal visible={this.showRepoNameDialog} okText="Create a Repository" onOk={this.createRepo} onCancel={() => {
                    this.setState({
                        showRepoNameDialog: false
                    })
                }}>
                    <Input placeholder="Repository Name" onChange={(e) => {
                        this.setState({
                            repoName: e.target.value
                        })
                    }}
                        value={this.state.repoName}
                    />
                </Modal>
                <Row>
                    <Col span={12} >
                        <Tree
                            paddingLeft={25}
                            tree={this.state.tree}
                            onChange={this.handleChange}
                            isNodeCollapsed={this.isNodeCollapsed}
                            renderNode={this.renderNode}
                        />
                    </Col>
                    <Col span={12} >
                        {this.state.active.children ? <div /> : <AceEditor
                            theme="github"
                            value={
                                this.state.active.content
                            }
                            onChange={(str) => {
                                this.setState({
                                    editedContent: str,
                                    contentNode: {
                                        ...this.state.contentNode,
                                        content: str
                                    }
                                });
                                this.finishContentEditing(this.state.lookup, this.state.contentNode);
                                this.setState({
                                    editContent: false,
                                })
                                this.handleChange(this.treeFromLookup({}, this.state.lookup, '/'))
                            }}
                            padding={10}
                            highlight={c => c}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 12,
                                backgroundColor: '#d3d3d3'

                            }}
                        />}
                    </Col>
                </Row>
                <Button type="primary" onClick={async () => {
                    notification.open(
                        {
                            message: 'Updating',
                            description: 'Updating template'
                        }
                    )
                    try {
                        const result = await Axios.post(IP + '/repo/template/update', {
                            tree: this.treeFromLookup({}, this.state.lookup, '/'),
                            templateId: this.state.templateId
                        }, {
                                headers: {
                                    username: localStorage.getItem('userName'),
                                    oauth: localStorage.getItem('oauth')
                                }
                            });
                        if (result.data.success) {
                            notification.open({
                                message: "Successful",
                                description: "Updating template successful"
                            })
                            this.props.history.goBack();
                        }
                        if (!result.data.success) {
                            localStorage.removeItem('userName');
                            localStorage.removeItem('oauth')
                            this.props.history.push('/')
                        }
                    }
                    catch (e) {
                        notification.open({
                            message: 'Error Occured',
                            description: e.toString()
                        });
                        console.log(e)
                    }
                }} style={{
                    margin: 10
                }}>Update Template</Button>
                {/* <Button type="primary" onClick={async () => {
                    this.setState({
                        showRepoNameDialog: true
                    })
                }} style={{
                    margin: 10
                }}>Create Repository</Button> */}

            </div>
        );
    }
    async componentDidMount() {
        const values = queryString.parse(this.props.history.location.search);
        const templateId = values['?id'];
        console.log('https://secondforlife.serveo.net/repo/template/' + templateId);

        const data = await Axios.get('https://secondforlife.serveo.net/repo/template/' + templateId, {
            headers: {
                username: localStorage.getItem('userName'),
                oauth: localStorage.getItem('oauth')
            }
        });
        const tree = ((data.data.data.string))
        console.log(data.data.data.string)
        this.setState({
            tree: tree,
            data: data.data.data.string,
            templateId: values['?id']
        })
        this.buildLookup(this.state.tree, null)
        console.log('BUILT LOOKUPx');
        console.log(this.lookup);
        this.setState({
            lookup: this.lookup
        })
    }

    handleChange = tree => {
        this.setState({
            tree: tree
        });
        this.buildLookup(this.state.tree, null)
        this.setState({
            lookup: this.lookup
        })
        console.log(this.state.tree)
    };

    updateTree = obj => {

    }

}
