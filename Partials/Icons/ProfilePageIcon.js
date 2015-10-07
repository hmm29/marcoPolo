/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ProfilePageIcon
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } = React;

var { Icon, } = require('react-native-icons');

var SIZE = 22;

var ProfilePageIcon = React.createClass({
    propTypes: {
        caption: React.PropTypes.string,
        color: React.PropTypes.string,
        direction: React.PropTypes.oneOf(['up','down','right','left']).isRequired,
        onPress: React.PropTypes.func.isRequired,
        captionStyle: View.propTypes.style,
        style: View.propTypes.style
    },

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    onPress={this.props.onPress}
                    style={this.props.style}>
                    <Icon
                        color={this.props.color || "#fff"}
                        name={'ion|person'}
                        size={SIZE}
                        style={styles.profilePageIcon}
                        />
                </TouchableOpacity>
                <Text style={[styles.caption, this.props.captionStyle]}>{this.props.caption}</Text>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    caption: {
        fontSize: 14,
        fontWeight: '500'
    },
    profilePageIcon: {
        width: SIZE,
        height: SIZE
    }
});

module.exports = ProfilePageIcon;