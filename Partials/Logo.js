/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Logo
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    Image,
    PixelRatio,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } = React;

var { Icon, } = require('react-native-icons');

var Logo = React.createClass({
    propTypes: {
        onPress: React.PropTypes.func,
        logoContainerStyle: View.propTypes.style,
        logoStyle: View.propTypes.style
    },

    render() {
        return (
            <View style={[styles.container, this.props.logoContainerStyle]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={this.props.onPress}
                    style={this.props.style}>
                    <Image source={{uri: `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_95,w_${PixelRatio.getPixelSizeForLayoutSize(200)}/v1440366805/Venture-logo-white_oywnx3.png`}}
                           style={[styles.logo, this.props.logoStyle]}/>
                </TouchableOpacity>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    logo: {
        width: 200,
        height: 120,
        backgroundColor: 'transparent'
    }
});

module.exports = Logo;