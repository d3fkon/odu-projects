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
import AceEditor from 'react-ace';
import filenamify from 'filenamify';

const { Header, Content, Footer } = Layout;
const IP = 'https://secondforlife.serveo.net'
const ILLEGAL = 'CON, PRN, AUX, NUL, COM1, COM2, COM3, COM4, COM5, COM6, COM7, COM8, COM9, LPT1, LPT2, LPT3, LPT4, LPT5, LPT6, LPT7, LPT8, LPT9';
const ILLEGAL_ARR = ILLEGAL.split(', ')

export default withRouter(({ history }) => (
    <TreeScreen history={history} />
))

class TreeScreen extends React.Component {
    componentDidMount = () => {
        if (!localStorage.getItem('oauth')) {
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
                            <h2 style={{ color: 'white' }}>Repository Generator</h2>
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
        active: {},
        editedContent: '',
        showContentDialog: false,
        contentNode: {},
        tree: {
            "module": "/",
            children: [
                {
                    module: "Jenkinsfile@#@989",
                    content: `
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
                    `
                },
            ]
        },
        showAddNewDialog: false,
        newType: 'File',
        projType: 'Template',
        templateDesc: ""
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
        if (newModule.module.trim() === '') {
            return lookupObj
        }
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
        if (newModule.module.trim() === '') {
            return lookupObj
        }
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
            editedText: node.module
        });
        console.log(this.state.active)
    };
    onRepoNameChange = name => {
        this.setState({
            repoName: name.target.value
        })
        console.log(name.target.value)
    }
    validatingName = (name) => {
        if (name.includes('/') || name.includes('<') || name.includes('>') || name.includes(':') || name.includes('"') || name.includes('\\') || name.includes('|') || name.includes('?') || name.includes('*') || name.endsWith('.') || ILLEGAL_ARR.includes(name))
            return false
    }
    render() {
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
                    <Input autoFocus value={this.state.newText} onChange={(e) => {
                        if (!e.target.value.includes('/'))
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
                    title="What's new today?"
                    visible={this.state.isModelVisible}
                    onOk={() => {
                        const name = this.state.repoName;
                        if (!name.includes('/') && !name.includes('%') && !name.includes('$') && !name.includes('@'))
                            this.setState({
                                isModelVisible: false
                            });
                    }}
                    onCancel={() => {
                        this.props.history.goBack();
                    }}
                >
                    <h4>Lets create a new ...</h4>
                    <Radio.Group defaultValue='Template' style={{ margin: 10, marginLeft: 0 }} buttonStyle="solid" onChange={(e) => {
                        this.setState({
                            projType: e.target.value
                        })
                    }}>
                        <Radio.Button value="Template" >Template</Radio.Button>
                        <Radio.Button value="Template + Repository" >Template + Repository</Radio.Button>
                    </Radio.Group>
                    {
                        this.state.projType === 'Template + Repository' ?
                            <Input autoFocus={this.state.projType === "Template + Repository"} onChange={(str) => {
                                if (str.target.value === '/')
                                    return;
                                this.setState({
                                    repoName: str.target.value,
                                    templateName: this.state.templateName === this.state.repoName + '-tmplt' ? str.target.value + '-tmplt' : this.state.templateName
                                })
                            }} style={{
                                marginBottom: 10
                            }}
                                placeholder="Repository Name"
                            /> : <div />
                    }

                    <Input autoFocus={this.state.projType === "Template"} value={this.state.templateName} onChange={(str) => {
                        this.setState({
                            templateName: str.target.value
                        })
                    }} style={{
                        marginBottom: 10
                    }}
                        placeholder="Template Name"
                    />

                    <Input.TextArea onChange={(str) => {
                        this.setState({
                            templateDesc: str.target.value
                        })
                    }} value={this.state.templateDesc} placeholder="Add Template Description" />

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
                        {this.state.active.children || this.state.active.module === undefined ? <div /> : <AceEditor
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
                            message: 'Creating a new project',
                            description: 'Processing...' + this.state.repoName + ' under ' + localStorage.getItem('userName')
                        }
                    )
                    try {
                        const endpoint = this.state.projType === 'Template' ? '/templatenew' : '/repo/add'
                        if (this.state.projType !== 'Template') {

                            const repoRes = await Axios.post(IP + '/repo/new', {
                                oauth: localStorage.getItem('oauth'),
                                repoName: this.state.repoName,
                                userName: localStorage.getItem('userName')
                            })
                            console.log("Created new repo", this.state.repoName)
                            notification.open({
                                message: 'Empty Repository Created',
                                description: 'Empty Repository Created. Adding Files...'
                            })
                        }
                        const actualTree = this.treeFromLookup({}, this.state.lookup, '/');

                        const res = await Axios.post(IP + '/repo/add', {
                            tree: actualTree,
                            repoName: this.state.repoName,
                            oauth: localStorage.getItem('oauth'),
                            userName: localStorage.getItem('userName'),
                            templateName: this.state.templateName,
                            templateDesc: this.state.templateDesc,
                            justTemplate: this.state.projType === 'Template',
                            justRepo: false
                        }, {
                                headers: {
                                    username: localStorage.getItem('userName'),
                                    oauth: localStorage.getItem('oauth')
                                }
                            });
                        console.log(res);
                        if (!res.data.success) {
                            if (res.data.unauth) {
                                localStorage.removeItem('oauth');
                                localStorage.removeItem('userName');
                                this.props.history.goBack();
                            }
                        }

                        notification.open({
                            message: 'Success',
                            description: this.state.projType === 'Template' ? 'Template Created' : 'Template created. Repository populated!'
                        });
                        this.props.history.push('/')
                    }
                    catch (e) {
                        notification.open({
                            message: 'Error Occured',
                            description: e.toString()
                        })
                    }
                }} style={{
                    margin: 10
                }}>{this.state.projType === 'Template' ? 'Save Template' : 'Save Template and Create Repo'}</Button>

            </div>
        );
    }
    componentDidMount() {
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
