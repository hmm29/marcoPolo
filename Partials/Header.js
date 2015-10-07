/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Header
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    StyleSheet,
    Text,
    View
    } = React;

var Display = require('react-native-device-display');

var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

var Header = React.createClass({
    propTypes: {
        containerStyle: View.propTypes.style
    },

    render() {
        let length = this.props.children.length;

        if(length === 3) {
            return (
                <View style={[styles.headerContainer, this.props.containerStyle]}>
                    <View style={styles.header}>
                        <View style={{position: 'absolute', left: 20}}>{this.props.children[0]}</View>
                        <Text style={styles.headerText}>{this.props.children[1]}</Text>
                        <View style={{position: 'absolute', right: 20}}>{this.props.children[2]}</View>
                    </View>
                </View>
            )
        } else if (length === 2) {
            return (
                <View style={[styles.headerContainer, this.props.containerStyle]}>
                    <View style={styles.header}>
                        <View style={{position: 'absolute', left: 20}}>{this.props.children[0]}</View>
                        <View style={{position: 'absolute', right: 20}}>{this.props.children[1]}</View>
                    </View>
                </View>
            )
        } else if (length === 1) {
            return (
                <View style={[styles.headerContainer, this.props.containerStyle]}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>{this.props.children[0]}</Text>
                    </View>
                </View>
            )
        } else {
            return (
                <View style={[styles.headerContainer, this.props.containerStyle]}>
                    <View style={styles.header}>
                    </View>
                </View>
            )
        }
    }
});

var styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    headerContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT/20,
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(0,0,0,0.02)',
        paddingHorizontal: 20,
        paddingVertical: SCREEN_HEIGHT/18
    },
    headerText: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'AvenirNextCondensed-Regular'
    }
});

module.exports = Header;