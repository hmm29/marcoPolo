/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    Navigator,
    StyleSheet,
    View
    } = React;

var Home = require('../Pages/Home');
var Orientation = require('react-native-orientation');

class VentureAppBase extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {

        };
        this.statics = {
            title: '<VentureAppBase>',
            description: 'Top-level app component.'
        }
    }

    componentDidMount(): void {
        Orientation.lockToPortrait();
    }

    renderScene(route:object, navigator:object) {
        var Component = route.component;
        var navBar = route.navigationBar;
        var passProps = route.passProps;

        if (navBar) {
            navBar = React.cloneElement(navBar, {
                navigator,
                route
            });
        }

        return (
            <View style={{flex: 1}}>
                {navBar}
                <Component navigator={navigator}
                           passProps={passProps}
                           route={route} />
            </View>
        );
    }

    render() {

    }
}

var styles = StyleSheet.create({

});

module.exports = VentureAppBase;


