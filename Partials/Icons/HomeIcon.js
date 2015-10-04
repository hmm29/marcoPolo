/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule HomeIcon
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    TouchableOpacity,
    StyleSheet
    } = React;

var { Icon, } = require('react-native-icons');

class HomeIcon extends React.Component {
    render() {
        let size = 32;

        return (
            <TouchableOpacity
                activeOpacity={0.4}
                onPress={this.props.onPress}>
                <Icon
                    color='#eee'
                    name='ion|ios-home-outline'
                    size={size}
                    style={[{width: size, height: size}, this.props.style]}/>
            </TouchableOpacity>
        );
    }
}

module.exports = HomeIcon;