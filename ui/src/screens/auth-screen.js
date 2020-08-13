import React from 'react';
import { withRouter } from 'react-router-dom';
import queryString from 'querystring';
import Axios from 'axios';

export default withRouter(({ history }) => <AuthScreen history={history} />);

class AuthScreen extends React.Component {
    async componentDidMount() {
        const values = queryString.parse(this.props.history.location.search);
        localStorage.setItem('oauth', values['?oauth']);
        try {
            
            const resp = await Axios.get('https://secondforlife.serveo.net/auth/user/login', {
                headers: {
                    username: localStorage.getItem('userName'),
                    oauth: values['?oauth']
                }
            });
            console.log(resp)
            this.props.history.push("/");
        }
        catch (e) {
            console.log("ERROR");
            console.log(e.status)
        }

    }
    render() {
        return (
            <div>
                Authenticating
            </div>
        )
    }
}