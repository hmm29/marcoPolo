/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Login
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AsyncStorage,
    Image,
    StyleSheet,
    Text,
    View
    } = React;

var _ = require('lodash');
var Display = require('react-native-device-display');
var FBLogin = require('react-native-facebook-login');

var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

var Login = React.createClass({
    _navigateToNextPage() {
        if(this.props.navigator.getCurrentRoutes()[this.props.navigator.getCurrentRoutes().length-2].title ==='Profile')
            this.props.navigator.popToTop();

        this.props.navigator.pop()
    },
    render() {
        var _this = this;

        return (
            <View style={styles.tabContent}>
                <Image
                    source={require('image!HomeBackground')}
                    style={styles.backdrop}>

                    <Image source={require('image!VentureLogoWhite')}
                           style={styles.ventureLogo}/>

                    <FBLogin style={{ top: 40 }}
                             permissions={['email','user_friends']}
                             onLogin={function(data){
                           AsyncStorage.setItem('@AsyncStorage:Venture:isLoggedIn', 'true')
                            // TODO: update the current user account login status
                            .then(() => _this._navigateToNextPage())
                            .then(() => console.log('Logged in!'))
                            .catch((error) => console.log(error.message))
                            .done();

                          console.log(data);
                        }}
                        />
                </Image>
            </View>
        )
    }
});

var styles = StyleSheet.create({
    backdrop: {
        paddingTop: 30,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    tabContent: {
        flex: 1,
        alignItems: 'center'
    },
    tabText: {
        color: 'white',
        bottom: 190,
        fontFamily: 'AvenirNextCondensed-Medium',
        fontSize: 30
    },
    ventureLogo: {
        bottom: 54,
        width: 120,
        height: 92.62,
        backgroundColor: 'transparent'
    }
});

module.exports = Login;