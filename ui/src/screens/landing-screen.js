import React from 'react';
import '../App.css';
import '../lib-ui.css';
import '../theme.css';
import { Input } from 'antd';
import { Layout, Modal, Menu, Icon} from 'antd';

import { withRouter } from 'react-router-dom'

import queryString from 'querystring';
import Axios from 'axios';

import ListComponent from './list-component'
import { Card } from 'antd';

const { Meta } = Card;
const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;
const { oauthLoginUrl } = require("@octokit/oauth-login-url");

export default withRouter(({ history }) => (
    <LandingPageContent history={history} />
))
class LandingPageContent extends React.Component {

    async componentDidMount() {
        const values = queryString.parse(this.props.history.location.search)
        console.log('VALUE', values)
        if ((localStorage.getItem('oauth') === 'undefined' || localStorage.getItem('oauth') === null) || localStorage.getItem('userName') === 'undefined' || localStorage.getItem('userName') === null) {
            localStorage.removeItem('oauth');
            localStorage.removeItem('userName')
            this.setState({
                showAuth: true
            })
        }
        else {
            // this.props.history.push('/createtree');
        }
    }
    state = {
        userName: '',
        showAuth: false
    }
    render() {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
                    <div className="logo" />
                    <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                        <Menu.Item key="1">
                            <Icon type="pie-chart" />
                            <span>Template Library</span>
                        </Menu.Item>
                        <Menu.Item key="2" onClick={() => {this.props.history.push('/createtree')}}>
                            <Icon type="desktop" />
                            <span>Create a Template</span>
                        </Menu.Item>
                        <Menu.Item key="9" onClick={() => {this.props.history.push('/config')}}>
                            <Icon type="file" />
                            <span>Change Configs</span>
                        </Menu.Item>
                        <Menu.Item key="10" onClick={() => {this.props.history.push('/config')}}>
                            <Icon type="radar-chart" />
                            <span>Community</span>
                        </Menu.Item>
                        <Menu.Item key="11" onClick={() => {this.props.history.push('/config')}}>
                            <Icon type="info-circle" />
                            <span>About</span>
                        </Menu.Item>
                        <SubMenu
                            key="sub1"
                            title={
                                <span>
                                    <Icon type="user" />
                                    <span>User</span>
                                </span>
                            }
                        >
                            <Menu.Item key="3">Profile</Menu.Item>
                            <Menu.Item key="4">Log Out</Menu.Item>

                        </SubMenu>
                        
                    </Menu>
                </Sider>
                <Layout>
                    <Header style={{ position: 'fixed', zIndex: 1, width: '100%', color: 'white' }}>
                        <h2 style={{color: "white", textAlign: 'center'}}>Repository Generation System</h2>
                </Header>
                    <Content style={{ padding: '0 50px', marginTop: 64 }}>
                        <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
                            <span>
                                <Modal
                                    okText="Login"
                                    title="Login"
                                    visible={this.state.showAuth}
                                    onOk={() => {
                                        localStorage.setItem('userName', this.state.userName);
                                        const {
                                            url
                                        } = oauthLoginUrl({
                                            clientId: 'aae68b2693471600a1b4',
                                            redirectUri: 'https://example.com',
                                            login: this.state.userName,
                                            scopes: ['repo', 'admin:org'],
                                            state: this.state.userName,
                                        });

                                        window.open(url)

                                    }}
                                    onCancel={() => { }}
                                >
                                    <Input onChange={(str) => {
                                        this.setState({
                                            userName: str.target.value
                                        })
                                    }} style={{
                                        marginBottom: 10
                                    }}
                                        placeholder="Github Username" />

                                </Modal>
                            </span>
                            <h2>My Templates</h2>
                            <ListComponent history={this.props.history} />
                            <h2>Popular Templates</h2>
                        </div>
                    </Content>
                    <Footer style={{ textAlign: 'center' }}>cs.odu.edu</Footer>
                </Layout>
            </Layout>
        );
    }
}
