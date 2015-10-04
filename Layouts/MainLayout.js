/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule MainLayout
 * @flow
 */

'use strict';

var Platform = require('Platform');
var React = require('react-native');

var {
    } = React;

var Chats = require('../Pages/LayoutItems/Chats');
var Events = require('../Pages/LayoutItems/Events');
var Hot = require('../Pages/LayoutItems/Hot');
var Profile = require('../Pages/LayoutItems/Profile');
var Users = require('../Pages/LayoutItems/Users');

var TAB_BAR_ICON_SIZE = 22;

var AndroidLayout = React.createClass({
    getInitialState() {
        return {
            selectedTab: this.props.selected
        }
    },

    render() {

    }
});

var IOSLayout = React.createClass({
    statics: {
        title: '<TabBarIOS>',
        description: 'Tab-based navigation.'
    },

    getInitialState() {
        return {
            selectedTab: this.props.selected
        }
    },

    _renderComponent(title:string) {
        switch(title) {
            case 'hot':
                return <Hot navigator={this.props.navigator} />;
            case 'events':
                return <Events navigator={this.props.navigator} />;
            case 'users':
                return <Users navigator={this.props.navigator} />;
            case 'chats':
                return <Chats navigator={this.props.navigator} />;
            case 'profile':
                return <Profile navigator={this.props.navigator} />;
        }

    },

    render() {
        var { TabBarIOS, } = require('react-native-icons');
        var TabBarItemIOS = TabBarIOS.Item;

        return (
            <TabBarIOS
                tintColor='white'
                barTintColor='#02030f'>
                <TabBarItemIOS
                    iconName={'ion|flame'}
                    title={'Hot'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    selected={this.state.selectedTab === 'hot'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'hot'
                    });
                  }}>
                    {this._renderComponent('hot')}
                </TabBarItemIOS>
                <TabBarItemIOS
                    iconName={'ion|wineglass'}
                    title={'Events'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    selected={this.state.selectedTab === 'events'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'events'
                    });
                  }}>
                    {this._renderComponent('events')}
                </TabBarItemIOS>
                <TabBarItemIOS
                    iconName={'ion|ios-paw'}
                    title={'Yalies'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    selected={this.state.selectedTab === 'users'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'users'
                    });
                  }}>
                    {this._renderComponent('users')}
                </TabBarItemIOS>
                <TabBarItemIOS
                    iconName={'ion|ios-chatboxes-outline'}
                    title={'Chats'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    badgeValue={'3'}
                    selected={this.state.selectedTab === 'chats'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'chats'
                    });
                 }}>
                    {this._renderComponent('chats')}
                </TabBarItemIOS>
                <TabBarItemIOS
                    iconName={'ion|ios-person-outline'}
                    title={'Profile'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    selected={this.state.selectedTab === 'profile'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'profile'
                    });
                }}>
                    {this._renderComponent('profile')}
                </TabBarItemIOS>
            </TabBarIOS>
        )

    }
});

var MainLayout = React.createClass({
    propTypes: {
        selected: React.PropTypes.string
    },

    render() {
        var selected = this.props.passProps.selected;

        if (Platform.OS === 'android') return <AndroidLayout navigator={this.props.navigator} selected={selected} />;
        return <IOSLayout navigator={this.props.navigator} selected={selected} />;
    }
});


module.exports = MainLayout;