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
    StatusBarIOS,
    StyleSheet,
    SwitchIOS,
    View
 } = React;

var _ = require('lodash');
var DDPClient = require('ddp-client');

var Home = React.createClass({
     getDefaultProps: function () {
        return {
          date: new Date(),
          timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60,
        };
  },

    getInitialState() {

        return {
            activeTimeOption: 'now',
            activityInputVal: '',
            date: this.props.date,
            showAddInfobox: false,
            hasKeyboardSpace: false,
            hasIshSelected: false,
            showNextButton: false,
            showTimeSpecificationOptions: false,
            tagInputVal: '',
            timeZoneOffsetInHours: this.props.timeZoneOffsetInHours,
            viewStyle: {
                marginHorizontal: null
            }
        }
    },

    componentWillMount() {
        StatusBarIOS.setStyle('light-content', true);
    },

    componentDidMount() {
        var _this = this;

        var ddpClient = new DDPClient({
            port: 443,
            ssl: true,
            url: 'wss://lb1.ventureappofficial.me/websocket'
         });

        ddpClient.connect((err, wasReconnect) => {
            _this.setState({ddpClient});
            if (err) {
                console.log('DDP connection error!');
                return;
            }
            if (wasReconnect) console.log('Reestablishment of a connection.');
        });
    },

    onDateChange: function(date) {
        this.setState({date: date});
      },

  onTimezoneChange: function(event) {
    var offset = parseInt(event.nativeEvent.text, 10);
    if (isNaN(offset)) {
      return;
    }
    this.setState({timeZoneOffsetInHours: offset});
  },

  render() {

    return (
        <View style={styles.container}>
            <Text>Hello</Text>
        </View>

    );

  }     
});

var styles = StyleSheet.create({
    background: {
        width: 200,
        height: 200
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

module.exports = Home;