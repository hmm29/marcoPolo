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
    AsyncStorage,
    InteractionManager,
    View
    } = React;

var _ = require('lodash');
var ChatsList = require('../Pages/LayoutItems/ChatsList');
var EventsList = require('../Pages/LayoutItems/EventsList');
var Firebase = require('firebase');
var Hot = require('../Pages/LayoutItems/Hot');
var Profile = require('../Pages/LayoutItems/Profile');
var UsersList = require('../Pages/LayoutItems/UsersList');

var TAB_BAR_ICON_SIZE = 22;

var MainLayout = React.createClass({
    propTypes: {
        passProps: React.PropTypes.object
    },

    render() {
        let currentUserFriends = this.props.passProps && this.props.passProps.currentUserFriends,
            currentUserLocationCoords = this.props.passProps && this.props.passProps.currentUserLocationCoords,
            friendsAPICallURL = this.props.passProps && this.props.passProps.friendsAPICallURL,
            navigator = this.props.passProps && this.props.navigator,
            selected = this.props.passProps && this.props.passProps.selected,
            ventureId = this.props.passProps && this.props.passProps.ventureId;

        if (Platform.OS === 'android') {
            return <AndroidLayout
                navigator={navigator}
                selected={selected} />;
        }

        return <IOSLayout
            currentUserFriends={currentUserFriends}
            currentUserLocationCoords={currentUserLocationCoords}
            friendsAPICallURL={friendsAPICallURL}
            navigator={navigator}
            selected={selected}
            ventureId={ventureId} />;
    }
});

var IOSLayout = React.createClass({
    getInitialState() {
        return {
            currentUserFriends: [],
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            selectedTab: this.props.selected
        }
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let chatCountRef = this.state.firebaseRef.child(`users/${this.props.ventureId}/chatCount`),
                currentRouteStack = this.props.navigator.getCurrentRoutes();

            this.setState({currentUserFriends: this.props.currentUserFriends});

            chatCountRef.on('value', snapshot => {
                this.setState({chatCount: snapshot.val(), chatCountRef});

                if(snapshot.val() <= 0 && _.findWhere(currentRouteStack, {title: 'Chat'})) {
                    _.remove(currentRouteStack, (route) => {
                        return route && route.title === 'Chat';
                    });
                    this.props.navigator.immediatelyResetRouteStack(currentRouteStack);
                }
            });
        });
    },

    componentWillUnmount() {
        this.state.chatCountRef && this.state.chatCountRef.off();

        AsyncStorage.setItem('@AsyncStorage:Venture:currentUserFriends', 'null')
            .catch(error => console.log(error.message))
            .done();
    },

    _handleSelectedTabChange(selectedTab:string) {
        this.setState({selectedTab});
    },

    _renderComponent(title:string) {
        switch(title) {
            case 'hot':
                return <Hot currentUserFriends={this.state.currentUserFriends} currentUserLocationCoords={this.props.currentUserLocationCoords} handleSelectedTabChange={this._handleSelectedTabChange} navigator={this.props.navigator} />;
            case 'events':
                return <EventsList currentUserFriends={this.state.currentUserFriends} currentUserLocationCoords={this.props.currentUserLocationCoords} navigator={this.props.navigator} ventureId={this.props.ventureId} />;
            case 'users':
                return <UsersList currentUserFriends={this.state.currentUserFriends} currentUserLocationCoords={this.props.currentUserLocationCoords}  navigator={this.props.navigator} ventureId={this.props.ventureId} />;
            case 'chats':
                return <ChatsList currentUserFriends={this.state.currentUserFriends} currentUserLocationCoords={this.props.currentUserLocationCoords} navigator={this.props.navigator} ventureId={this.props.ventureId} />;
            case 'profile':
                return <Profile currentUserFriends={this.state.currentUserFriends} currentUserLocationCoords={this.props.currentUserLocationCoords} navigator={this.props.navigator} />;
        }

    },

    render() {
        var { TabBarIOS, } = require('react-native-icons'),
            TabBarItemIOS = TabBarIOS.Item;

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
                {this.state.chatCount > 0 ?

                    <TabBarItemIOS
                    iconName={'ion|ios-chatboxes-outline'}
                    title={'Chats'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    badgeValue={JSON.stringify(this.state.chatCount)}
                    selected={this.state.selectedTab === 'chats'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'chats'
                    });
                 }}>
                    {this._renderComponent('chats')}
                </TabBarItemIOS>

                    :

                    <TabBarItemIOS
                    iconName={'ion|ios-chatboxes-outline'}
                    title={'Chats'}
                    iconSize={TAB_BAR_ICON_SIZE}
                    selected={this.state.selectedTab === 'chats'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'chats'
                    });
                 }}>
                    {this._renderComponent('chats')}
                </TabBarItemIOS>

                }
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

var AndroidLayout = React.createClass({
    getInitialState() {
        return {
            selectedTab: this.props.selected
        }
    },
    render() {

    }
});

module.exports = MainLayout;