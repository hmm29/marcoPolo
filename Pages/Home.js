/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Home
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AsyncStorage,
    DatePickerIOS,
    Image,
    InteractionManager,
    LayoutAnimation,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    SwitchIOS,
    View
    } = React;

var _ = require('lodash');
var DDPClient = require('ddp-client');
var MainLayout = require('../Layouts/MainLayout');

var NEXT_BUTTON_SIZE = 28;

var Home = React.createClass({
    statics: {
        title: '<Home>',
        description: 'Venture Home Page - activity selection.'
    },

    getDefaultProps() {
        return {
            ddpClient: new DDPClient({
                port: 443,
                ssl: true,
                url: 'wss://lb1.ventureappofficial.me/websocket'
            })
        }
    },

    getInitialState() {
        return {
            ddpClient: this.props.ddpClient,
            showAddInfoBox: false,
            showNextButton: false,
            hasKeyboardSpace: false,
            viewStyle: {
                marginHorizontal: null
            }
        }
    },

    componentWillMount() {
        this.state.ddpClient.connect((err, wasReconnect) => {

            if (err) {
                console.log('DDP connection error!');
                return;
            }

            if (wasReconnect) console.log('Reestablishment of a connection.');
        });
    },

    onSubmitActivity() {
        this.props.navigator.push({
            title: 'Users',
            component: MainLayout,
            passProps: {selected: 'users'}
        });
    },

    render() {
        return (
            <View style={styles.container}>
                <NextButton onPress={this.onSubmitActivity} />
            </View>
        );
    }
});

class ActivityTextInput extends React.Component {
    constructor(props: any): void {
        super();
        this.state = {
            input: ''
        };
    }

    render() {
        return (
            <View>
            </View>
        );
    }
}

class AddInfoBox extends React.Component {
    constructor(props: any): void {
        super();
        this.state = {
            activeTimeOption: 'now',
            date: new Date(),
            hasIshSelected: false,
            showTimeSpecificationOptions: false,
            timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60
        };
    }

    onDateChange(date): void {
        this.setState({date: date});
    }

    onTimezoneChange(event): void {
        var offset = parseInt(event.nativeEvent.text, 10);
        if (isNaN(offset)) return;
        this.setState({timeZoneOffsetInHours: offset});
    }

    render() {
        return (
            <View>

            </View>
        );
    }
}

class AddInfoButton extends React.Component {
    render() {
        return (
            <View>

            </View>
        );
    }
}

class NextButton extends React.Component {

    render() {
        return (
            <TouchableOpacity
                style={styles.nextButton}
                activeOpacity={0.4}
                onPress={this.props.onPress}>
                <Text>Next</Text>
            </TouchableOpacity>
        );
    }
}

class Tags extends React.Component {
    constructor(props: any): void {
        super();
        this.state = {
            input: ''
        };
    }

    render() {
        return (
            <View>

            </View>
        );
    }
}

class TrendingItems extends React.Component {
    render() {
        return (
            <View>

            </View>
        );
    }
}

var styles = StyleSheet.create({
    background: {
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    nextButton: {

    }
});

module.exports = Home;