/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule EditProfilePageIcon
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    InteractionManager,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } = React;

var { Icon, } = require('react-native-icons');

var SIZE = 32;

var EditProfilePageIcon = React.createClass({
    propTypes: {
        active: React.PropTypes.bool.isRequired,
        caption: React.PropTypes.string,
        color: React.PropTypes.string,
        onPress: React.PropTypes.func.isRequired,
        captionStyle: View.propTypes.style,
        style: View.propTypes.style
    },

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    onPress={() =>  InteractionManager.runAfterInteractions(() => {
                        this.props.onPress();
                    })}
                    style={this.props.style}>
                    <Icon
                        color={this.props.color || "#fff"}
                        name={"ion|edit"}
                        size={SIZE}
                        style={styles.editProfilePageIcon}
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
    editProfilePageIcon: {
        width: SIZE,
        height: SIZE
    }
});

module.exports = EditProfilePageIcon;