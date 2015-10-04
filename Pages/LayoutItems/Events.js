/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Events
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    StyleSheet,
    Text,
    View,
    } = React;

var Events = React.createClass({

    render: function() {
        return (
            <View style={[styles.tabContent, {backgroundColor: '#444'}]}>
                <Text style={styles.tabText}>Events</Text>
            </View>);
    }
});

var styles = StyleSheet.create({
    tabContent: {
        flex: 1,
        alignItems: 'center',
    },
    tabText: {
        color: 'white',
        margin: 50,
    },
});


module.exports = Events;