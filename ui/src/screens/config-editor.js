import React from 'react';
import { withRouter } from 'react-router-dom';
import ReactDataGrid from 'react-data-grid';
import { Editors, Formatters } from 'react-data-grid-addons';
import { Input, Button, Menu, Icon, notification } from 'antd';
import { Layout, Modal } from 'antd';

import queryString from 'querystring';
import Axios from 'axios';

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;
const { DropDownEditor } = Editors;
const { DropDownFormatter } = Formatters;

const IP = 'https://secondforlife.serveo.net'
export default withRouter(({ history }) => <ConfigEditor history={history} />);

const createColumns = (data, props) => {
    const columnNames = [{
        key: "RepoName",
        name: "Repo Name"
    }, {
        key: "JobName",
        name: "Job Name"
    }];
    const vals = [{
        id: 'yes',
        value: 'yes'
    }, {
        id: 'no',
        value: 'no'
    }]
    if (data === undefined) {
        notification.open({
            message: 'Error',
            description: 'Create a repository to generate the config'
        })
        props.history.push('/')

        return;
    }
    if (data.config === null) return false;
    if (data.config.data) return false;
    if (data.config.constructor === String) return false;

    const IssueTypeEditor = <DropDownEditor options={vals} />;
    console.log('-', data.config.data)
    console.log("DUH", data.config)
    Object.keys(data.config.job.config).forEach(key => {
        columnNames.push({
            key: key,
            name: key,
            editor: IssueTypeEditor,
            formatter: props => <div style={{ backgroundColor: props.value === 'yes' ? '#8BC34A' : '#EC407A', color: 'white' }}>{props.value}</div>
        })
    })
    console.log('COL', columnNames)
    return columnNames;
}

const columns = [
    { key: 'RepoName', name: 'Repo Name' },
    { key: 'JobName', name: 'Job Name' },
    { key: 'PreUnitTest', name: 'Pre Unit Test' },
    { key: 'PostUnitTest', name: 'Post Unit Test' },
    { key: 'dev', name: 'dev' }
];
const rows = [
    { RepoName: 'Habba 19', JobName: 'Habba 19', PreUnitTest: 'yes', PostUnitTest: 'no', dev: 'yes' }
]
class ConfigEditor extends React.Component {
    state = {
        columns: [],
        rowData: []
    }
    createData = (data) => {
        const cleanData = data.filter(d => {
            if (d.config === null) return false;
            if (d.config.data) return false;
            if (d.config.constructor === String) return false;
            return true
        })
        console.log("CLEAN DATA", cleanData)
        const rowData = [];
        cleanData.forEach(d => {
            try {
                const obj = {
                    RepoName: d['repoName'],
                    JobName: d['config']['job']['job-name'],

                }
                const { columns } = this.state
                console.log('-->', columns.length)

                for (let i = 2; i < columns.length; i++) {
                    obj[columns[i].key] = d['config']['job']['config'][columns[i].key]
                    console.log('=>', d['config']['job']['config'][columns[i].key])
                }
                rowData.push(obj)
            }
            catch (e) {

            }
        })
        return rowData;

    }
    componentDidMount = async () => {
        const res = await Axios.get(`${IP}/j/repos`, {
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                "Accept": 'application/json',
                userName: localStorage.getItem('userName'),
                oAuth: localStorage.getItem('oauth')
            }
        });
        let host = res.data.data[0]
        for (let i = 0; i < res.data.data.length; i++) {
            console.log(createColumns(res.data.data[i], this.props))
            if (createColumns(res.data.data[i], this.props)) {

                host = res.data.data[i]
                break;
            }
        }
        this.setState({
            columns: createColumns(host, this.props),
        });
        this.setState({
            rowData: this.createData(res.data.data)
        })
    }
    onGridRowsUpdated = ({ fromRow, toRow, updated }) => {
        this.setState(state => {
            const rows = state.rowData.slice();
            for (let i = fromRow; i <= toRow; i++) {
                rows[i] = { ...rows[i], ...updated };
            }
            this.setState({
                rowData: rows
            })
            console.log(rows)
            return { rows };
        });
    };
    render() {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
                    <div className="logo" />
                    <Menu theme="dark" defaultSelectedKeys={['9']} mode="inline">
                        <Menu.Item key="1" onClick={() => { this.props.history.push('/') }}>
                            <Icon type="pie-chart" />
                            <span>Template Library</span>
                        </Menu.Item>
                        <Menu.Item key="2" onClick={() => { this.props.history.push('/createtree') }}>
                            <Icon type="desktop" />
                            <span>Create a Template</span>
                        </Menu.Item>
                        <Menu.Item key="9" onClick={() => { this.props.history.push('/config') }}>
                            <Icon type="file" />
                            <span>Change Configs</span>
                        </Menu.Item>
                        <Menu.Item key="10" onClick={() => { this.props.history.push('/config') }}>
                            <Icon type="radar-chart" />
                            <span>Community</span>
                        </Menu.Item>
                        <Menu.Item key="11" onClick={() => { this.props.history.push('/config') }}>
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
                    <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                        <div className="logo" />

                    </Header>
                    <Content style={{ padding: '0 50px', marginTop: 64 }}>
                        <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
                            <h2>My Configs</h2>
                            <ReactDataGrid
                                columns={this.state.columns}
                                rowGetter={
                                    rowNumber => this.state.rowData[rowNumber]
                                }
                                enableCellSelect
                                onGridRowsUpdated={this.onGridRowsUpdated}
                                rowsCount={this.state.rowData.length}
                            />
                            <Button type="primary" onClick={async () => {
                                notification.open({
                                    message: "Updating config.yaml",
                                    description: 'Please Wait'
                                })
                                const res = await Axios.post(IP + '/j/update', {
                                    newconfig: this.state.rowData
                                }, {
                                        headers: {
                                            oauth: localStorage.getItem('oauth'),
                                            username: localStorage.getItem('userName')
                                        }
                                    });
                                notification.open({
                                    message: 'Success',
                                    description: 'Finished updating config.yaml'
                                })
                                console.log(res)
                            }}>Submit</Button>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        )
    }

}
