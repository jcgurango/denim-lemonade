import React, {Component} from 'react';
import {Image} from 'react-native';
import {MenuItems} from "./MenuItems"
import './NavBar.css'

class NavBar extends Component{
    state = {clicked: false}

    handleClick = () => {
        this.setState({clicked: !this.state.clicked})
    }

    render(){
        return(
            <nav className="NavBarItems">
                <div className="navbar-logo">
                    <Image style={{ width:'100%', height:'100%', resizeMode : 'contain'}} source={require('./assets/Lemonade.png')} />
                </div>
                <div className="menu-icon" onClick={this.handleClick}>
                
                </div>
                <ul className={this.state.clicked ? 'nav-menu active' : 'nav-menu'}>
                    {MenuItems.map((item, index) =>{
                        return (
                            <li>
                                <a className={item.cName} href={item.url}>
                                    {item.title}
                                </a>
                            </li>
                        )
                    })}                    
                </ul>
            </nav>
        )
    }
}

export default NavBar